import { Component, computed, inject, resource, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { SessionStore } from '../../../core/auth/session.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { optional } from '../../../core/utils/resource';
import { ROLE_LABELS, UserRole } from '../../../domain/models';
import { CATALOG_REPOSITORY, TEAM_REPOSITORY } from '../../../domain/repositories';
import { TeamMember } from '../../../domain/team';
import { ErrorState, Skeleton } from '../../../shared/ui/state-views';

interface Access {
  role: UserRole;
  locationId: string;
}

/**
 * Super admin: who works in the portals. Branch admins (`staff`) see only their branch's
 * ads and chats (plus the inventory of every branch); super admins see everything.
 */
@Component({
  selector: 'cx-admin-users-page',
  imports: [FormField, NgTemplateOutlet, ErrorState, Skeleton],
  templateUrl: './users.page.html',
  styleUrls: ['../ui/admin-page.scss', './users.page.scss'],
})
export class UsersPage {
  private readonly team = inject(TEAM_REPOSITORY);
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly toast = inject(ToastStore);
  protected readonly me = inject(SessionStore).user;

  protected readonly roles = (['staff', 'admin', 'user'] as const).map((value) => ({
    value,
    label: value === 'user' ? 'Sin acceso (cliente)' : ROLE_LABELS[value],
  }));
  protected readonly locations = resource({ loader: () => optional(this.catalog.locations(), []) });
  protected readonly members = resource({ loader: () => this.team.members() });

  /** Super admins first, then branch admins grouped by branch. */
  protected readonly sorted = computed(() =>
    [...(this.members.value() ?? [])].sort(
      (a, b) =>
        Number(b.role === 'admin') - Number(a.role === 'admin') ||
        (a.locationId ?? '').localeCompare(b.locationId ?? '') ||
        a.fullName.localeCompare(b.fullName),
    ),
  );

  /** Unsaved role/branch changes per user id. */
  protected readonly drafts = signal<Record<string, Access>>({});
  protected readonly saving = signal<string | null>(null);

  protected readonly inviteModel = signal({
    email: '',
    fullName: '',
    role: 'staff',
    locationId: '',
  });
  protected readonly inviteForm = form(this.inviteModel, (p) => {
    required(p.email, { message: 'Escribe el correo.' });
    email(p.email, { message: 'Correo no válido.' });
    required(p.fullName, { message: 'Escribe el nombre.' });
  });
  protected readonly inviteError = signal<string | null>(null);

  protected readonly query = signal('');
  protected readonly results = signal<TeamMember[] | null>(null);

  protected roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  protected branchName(id?: string): string {
    if (!id) return '—';
    return this.locations.value()?.find((l) => l.id === id)?.city ?? id;
  }

  protected access(m: TeamMember): Access {
    return this.drafts()[m.id] ?? { role: m.role, locationId: m.locationId ?? '' };
  }

  protected changed(m: TeamMember): boolean {
    const d = this.drafts()[m.id];
    return !!d && (d.role !== m.role || d.locationId !== (m.locationId ?? ''));
  }

  protected edit(m: TeamMember, patch: Partial<Access>): void {
    this.drafts.update((all) => ({ ...all, [m.id]: { ...this.access(m), ...patch } }));
  }

  protected async save(m: TeamMember): Promise<void> {
    const { role, locationId } = this.access(m);
    if (role === 'staff' && !locationId) {
      this.toast.error(new Error('Elige la sucursal del admin.'), 'Elige la sucursal del admin.');
      return;
    }
    this.saving.set(m.id);
    try {
      const updated = await this.team.setRole(
        m.id,
        role,
        role === 'user' ? undefined : locationId || undefined,
      );
      this.drafts.update(({ [m.id]: _, ...rest }) => rest);
      this.members.reload();
      if (this.results())
        this.results.update((r) => r?.map((x) => (x.id === m.id ? updated : x)) ?? null);
      this.toast.success(
        role === 'user'
          ? `${updated.fullName} ya no tiene acceso.`
          : `${updated.fullName}: ${ROLE_LABELS[role]}.`,
      );
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.saving.set(null);
    }
  }

  protected invite(): Promise<boolean> {
    return submit(this.inviteForm, async () => {
      this.inviteError.set(null);
      const { email, fullName, role, locationId } = this.inviteModel();
      if (role === 'staff' && !locationId) {
        this.inviteError.set('Elige la sucursal del admin.');
        return;
      }
      try {
        const member = await this.team.invite({
          email,
          fullName,
          role: role as 'staff' | 'admin',
          locationId: role === 'staff' ? locationId : undefined,
        });
        this.inviteModel.set({ email: '', fullName: '', role: 'staff', locationId: '' });
        this.inviteForm().reset();
        this.members.reload();
        this.toast.success(
          `Invitación enviada a ${member.email}. Elegirá su contraseña desde el correo.`,
        );
      } catch (e) {
        this.inviteError.set(e instanceof Error ? e.message : 'No se pudo enviar la invitación.');
      }
    });
  }

  protected async search(): Promise<void> {
    const q = this.query().trim();
    if (q.length < 2) return;
    try {
      this.results.set(await this.team.search(q));
    } catch (e) {
      this.toast.error(e);
    }
  }
}
