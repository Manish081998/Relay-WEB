import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { AnnotationDto } from '../models/annotation.model';
import { ApiResult } from '../../../models/api-response.model';

@Injectable()
export class AnnotationsService {
  private readonly api = inject(ApiService);

  getById(id: string): Observable<ApiResult<AnnotationDto>> {
    return this.api.get<ApiResult<AnnotationDto>>(`${API_ENDPOINTS.DOCUMENTUM.ANNOTATIONS}/${id}`);
  }
}
