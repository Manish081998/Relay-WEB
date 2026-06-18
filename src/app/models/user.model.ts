import { Role } from './role.enum';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  firstName?: string;
  lastName?: string;
  globalId?: string;
  title?: string | null;
  companyName?: string | null;
  department?: string | null;
  office?: string | null;
  profileImage?: string | null;
  brandId?: number | null;
  brandName?: string | null;
  associatedQueueNames?: string[];
}
