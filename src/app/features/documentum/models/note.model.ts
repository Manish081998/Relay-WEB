export interface SalesOrderNoteDto {
  salesOrderNoteId: number;
  orderSeq: number;
  notesDescription: string;
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

export interface AddSalesOrderNoteRequest {
  orderSeq: number;
  notesDescription: string;
}
