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
  repPO?: string;
  accountNumber?: string;
  brand?: string;
  repUserName?: string;
  jobNumber?: string;
  orderDateFrom?: string;
  orderDateTo?: string;
  pageNumber: number;
  pageSize: number;
}
