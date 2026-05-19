export interface DocumentDto {
  id: string;
  name: string;
  status: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDocumentRequest {
  name?: string;
  status?: string;
}

// ── Sales Order Document Models ───────────────────────────────────────────

export interface SalesOrderDocumentDto {
  documentId: number;
  orderSeq: number;
  repPO: string | null;
  brandName: string | null;
  documentName: string;
  contentType: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
  isSupportedDocument: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

export interface SalesOrderDocumentVersionDto {
  salesOrderDocumentVersionId: number;
  documentId: number;
  versionNumber: number;
  comment: string | null;
  documentPath: string;
  contentType: string;
  mimeType: string;
  sizeBytes: number;
  createdBy: string;
  createdDate: string;
}

export interface UploadDocumentResultDto {
  documentId: number;
  versionId: number;
  versionNumber: number;
  documentPath: string;
}
