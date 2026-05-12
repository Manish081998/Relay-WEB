export interface BrandDto {
  brandId: number;
  brandName: string;
}

export interface DocumentumUserDto {
  userId: number;
  globalId: string;
  emailId: string;
  brandId: number;
  brandName: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdBy: string;
  createdDate: string;
}

export interface UpdateDocumentumUserRequest {
  userId: number;
  brandId: number;
  isActive: boolean;
  modifiedBy: string;
}
