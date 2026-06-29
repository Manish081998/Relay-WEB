import { BrandDto } from '../../documentum/models/documentum-user.model';

export interface QueueSummaryDto {
  queueId: number;
  queueName: string;
}

export interface BrandQueueMappingApiResponse {
  brands: BrandDto[];
  availableQueues: QueueSummaryDto[];
  selectedQueues: BrandQueueMappingDto[];
}

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
  queueId: string | null;   // comma-separated: "5, 11"
  queueName: string | null; // comma-separated: "AM, EDI Order Entry"
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
