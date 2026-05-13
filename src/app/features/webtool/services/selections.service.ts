import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { SelectionDto } from '../models/selection.model';
import { ApiResult } from '../../../models/api-response.model';

@Injectable()
export class SelectionsService {
  private readonly api = inject(ApiService);

  getById(id: string): Observable<ApiResult<SelectionDto>> {
    return this.api.get<ApiResult<SelectionDto>>(`${API_ENDPOINTS.WEBTOOL.SELECTIONS}/${id}`);
  }
}
