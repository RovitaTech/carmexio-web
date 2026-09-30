// People with portal access (super admins + branch admins), managed by the super admin.
// Mirrors carmexio-BE /v1/admin/users (docs/API_MAP.md).
import { UserRole } from './models';

export interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  /** Branch of a branch admin (`staff`). */
  locationId?: string;
  createdAt: string;
}

export interface TeamInvite {
  email: string;
  fullName: string;
  /** `staff` = admin of one branch · `admin` = super admin. */
  role: 'staff' | 'admin';
  locationId?: string;
}
