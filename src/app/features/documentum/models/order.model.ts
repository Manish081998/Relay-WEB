export interface OrderItem {
  orderGuid: string;
  orderSeq: number;
  brand: string;
  repPO: string;
  accountNumber: string;
  orderDate: string;
  repCustomer: string;
  repSalesPerson: string;
  repUserName: string;
  jobNumber: string;
  status: string;
  totalNet: string;
  orderRecdDate: string;
}

export interface OrderSearchResponse {
  items: OrderItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface OrderSearchRequest {
  salesOrderNumber?: string;
  repPO?: string;
  accountNumber?: string;
  productType?: string;
  region?: string;
  priority?: string;
  brand?: string;
  captureDateFrom?: string;
  captureDateTo?: string;
  jobName?: string;
  queueName?: string;
  packageOwner?: string;
  pageNumber: number;
  pageSize: number;
}

export interface DropdownOption {
  label: string;
  value: string;
}
