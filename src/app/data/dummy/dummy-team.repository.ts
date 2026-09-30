// DELETE WHEN LIVE — in-memory stand-in for /v1/admin/users.
import { AppError } from '../../domain/models';
import { TeamRepository } from '../../domain/repositories';
import { TeamInvite, TeamMember } from '../../domain/team';
import { Row } from '../mappers';
import { DummyDb, requireAdmin } from './dummy-db';

export class DummyTeamRepository implements TeamRepository {
  constructor(private readonly db: DummyDb) {}

  async members(): Promise<TeamMember[]> {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    return this.db.profiles
      .filter((p) => p['role'] === 'admin' || p['role'] === 'staff')
      .map(toMember);
  }

  async search(query: string): Promise<TeamMember[]> {
    await this.db.delay(0.4);
    requireAdmin(this.db);
    const q = query.trim().toLowerCase();
    return this.db.profiles
      .filter((p) =>
        `${p['full_name']} ${p['email'] ?? ''} ${p['phone'] ?? ''}`.toLowerCase().includes(q),
      )
      .slice(0, 20)
      .map(toMember);
  }

  async invite(invite: TeamInvite): Promise<TeamMember> {
    await this.db.delay(0.5);
    requireAdmin(this.db);
    const email = invite.email.trim().toLowerCase();
    if (this.db.profiles.some((p) => p['email'] === email)) {
      throw new AppError('Ese correo ya tiene cuenta: búscalo y cambia su rol.', 'validation');
    }
    const row: Row = {
      id: this.db.nextId('user'),
      email,
      full_name: invite.fullName.trim(),
      role: 'user',
      created_at: new Date().toISOString(),
    };
    this.db.profiles.push(row);
    return this.setRole(row['id'], invite.role, invite.locationId);
  }

  async setRole(
    userId: string,
    role: TeamMember['role'],
    locationId?: string,
  ): Promise<TeamMember> {
    const me = requireAdmin(this.db);
    if (userId === me)
      throw new AppError(
        'No puedes cambiar tu propio rol; pídeselo a otro super admin.',
        'validation',
      );
    if (role === 'staff' && !locationId)
      throw new AppError('Elige la sucursal del admin.', 'validation');
    const row = this.db.profiles.find((p) => p['id'] === userId);
    if (!row) throw new AppError('Usuario no encontrado.', 'notFound');
    Object.assign(row, { role, location_id: role === 'user' ? null : (locationId ?? null) });
    return toMember(row);
  }
}

const toMember = (p: Row): TeamMember => ({
  id: p['id'],
  fullName: p['full_name'] || p['email'] || 'Sin nombre',
  email: p['email'] ?? undefined,
  phone: p['phone'] ?? undefined,
  role: p['role'] ?? 'user',
  locationId: p['location_id'] ?? undefined,
  createdAt: p['created_at'] ?? new Date().toISOString(),
});
