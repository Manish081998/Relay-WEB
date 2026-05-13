export interface AdUserDto {
  firstName: string;
  lastName: string;
  emailId: string;
  companyName?: string;
  title?: string;
  department?: string;
  office?: string;
}

export interface CreateUserRequest {
  globalId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  brandId: number | null;
  queueId: number | null;
  roleId: number | null;
  createdBy: string;
}
