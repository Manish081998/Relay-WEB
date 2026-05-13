import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { DocumentDto, UpdateDocumentRequest } from '../models/document.model';
import { ApiResult } from '../../../models/api-response.model';

@Injectable()
export class DocumentsService {
  private readonly api = inject(ApiService);

  getById(id: string): Observable<ApiResult<DocumentDto>> {
    return this.api.get<ApiResult<DocumentDto>>(`${API_ENDPOINTS.DOCUMENTUM.DOCUMENTS}/${id}`);
  }

  getByName(name: string): Observable<ApiResult<DocumentDto>> {
    return this.api.get<ApiResult<DocumentDto>>(API_ENDPOINTS.DOCUMENTUM.DOCUMENTS, { params: { name } });
  }

  update(id: string, body: UpdateDocumentRequest): Observable<ApiResult<DocumentDto>> {
    return this.api.put<ApiResult<DocumentDto>>(`${API_ENDPOINTS.DOCUMENTUM.DOCUMENTS}/${id}`, body);
  }
}
