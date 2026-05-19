import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import {
  SalesOrderDocumentDto,
  SalesOrderDocumentVersionDto,
  UploadDocumentResultDto,
} from '../models/document.model';

@Injectable()
export class SalesOrderDocumentService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  private base = `${this.env.apiBaseUrl}/api/documentum/sales-order-documents`;

  /** Upload a new document (sales order or support doc) */
  upload(
    orderSeq: number,
    file: File,
    isSupportedDocument: boolean,
    repPO?: string,
    brandName?: string,
  ): Observable<UploadDocumentResultDto> {
    const form = new FormData();
    form.append('orderSeq', orderSeq.toString());
    form.append('isSupportedDocument', isSupportedDocument.toString());
    form.append('file', file, file.name);
    if (repPO) form.append('repPO', repPO);
    if (brandName) form.append('brandName', brandName);
    return this.api.upload<UploadDocumentResultDto>(`${this.base}/upload`, form);
  }

  /** Create a new version (edit/annotate an existing document) */
  createVersion(documentId: number, file: File, comment?: string): Observable<UploadDocumentResultDto> {
    const form = new FormData();
    form.append('documentId', documentId.toString());
    form.append('file', file, file.name);
    if (comment) form.append('comment', comment);
    return this.api.upload<UploadDocumentResultDto>(`${this.base}/create-version`, form);
  }

  /** Get all documents for an order (optionally filter by type) */
  getByOrderSeq(orderSeq: number, isSupportedDocument?: boolean): Observable<SalesOrderDocumentDto[]> {
    const params: Record<string, string | number | boolean> = {};
    if (isSupportedDocument !== undefined) params['isSupportedDocument'] = isSupportedDocument;
    return this.api.get<SalesOrderDocumentDto[]>(`${this.base}/${orderSeq}`, { params });
  }

  /** Get all versions for a specific document */
  getVersions(documentId: number): Observable<SalesOrderDocumentVersionDto[]> {
    return this.api.get<SalesOrderDocumentVersionDto[]>(`${this.base}/${documentId}/versions`);
  }

  /** Build a preview URL for a document path (unauthenticated — use for direct links only) */
  getPreviewUrl(documentPath: string): string {
    return `${this.base}/preview?path=${encodeURIComponent(documentPath)}`;
  }

  /** Fetch a document as a Blob via the authenticated HttpClient */
  getPreviewBlob(documentPath: string): Observable<Blob> {
    return this.api.download(`${this.base}/preview?path=${encodeURIComponent(documentPath)}`);
  }
}
