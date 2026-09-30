import { TeamRepository } from '../../domain/repositories';
import { TeamInvite, TeamMember } from '../../domain/team';
import { ApiClient } from './api-client';

/** carmexio-BE `UserDto` (nulls on the wire). */
interface UserDto {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: TeamMember['role'];
  locationId: string | null;
  createdAt: string;
}

const toMember = (u: UserDto): TeamMember => ({
  id: u.id,
  fullName: u.fullName || u.email || 'Sin nombre',
  email: u.email ?? undefined,
  phone: u.phone ?? undefined,
  role: u.role,
  locationId: u.locationId ?? undefined,
  createdAt: u.createdAt,
});

export class ApiTeamRepository implements TeamRepository {
  constructor(private readonly api: ApiClient) {}

  async members(): Promise<TeamMember[]> {
    const [admins, staff] = await Promise.all(
      (['admin', 'staff'] as const).map((role) =>
        this.api.request<{ items: UserDto[] }>('GET', `/admin/users?role=${role}&pageSize=50`),
      ),
    );
    return [...admins.items, ...staff.items].map(toMember);
  }

  async search(query: string): Promise<TeamMember[]> {
    const q = encodeURIComponent(query.trim());
    const page = await this.api.request<{ items: UserDto[] }>(
      'GET',
      `/admin/users?q=${q}&pageSize=20`,
    );
    return page.items.map(toMember);
  }

  async invite(invite: TeamInvite): Promise<TeamMember> {
    return toMember(await this.api.request<UserDto>('POST', '/admin/users/invite', invite));
  }

  async setRole(
    userId: string,
    role: TeamMember['role'],
    locationId?: string,
  ): Promise<TeamMember> {
    return toMember(
      await this.api.request<UserDto>('PATCH', `/admin/users/${userId}/role`, {
        role,
        locationId: locationId ?? null,
      }),
    );
  }
}
