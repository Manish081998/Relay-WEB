import { BrandDto } from '../../documentum/models/documentum-user.model';

export interface BrandQueueMappingDto {
  brandId: number;
  brandName: string;
  queueId: number;
  queueName: string;
}

export interface QueueUserMappingDto {
  fullName: string | null;
  globalId: string | null;
  emailId: string | null;
  queueId: number | null;
  queueName: string | null;
  brandId: number | null;
  brandName: string | null;
  roleName: string | null;
  actionByFullName: string | null;
}

export interface RoleDto {
  roleMasterId: number;
  roleName: string;
  privilegeLevel: number;
}

export interface BrandAndQueuesAndMappingDto {
  brands: BrandDto[];
  brandQueueMappings: BrandQueueMappingDto[];
  userQueueMappings: QueueUserMappingDto[];
  roles: RoleDto[];
}
