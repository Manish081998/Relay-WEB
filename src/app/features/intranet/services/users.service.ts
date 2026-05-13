import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { UserDetailDto, UpdateUserRequest } from '../models/user-detail.model';
import { ApiResult } from '../../../models/api-response.model';

@Injectable()
export class UsersService {
  private readonly api = inject(ApiService);

  getById(id: string): Observable<ApiResult<UserDetailDto>> {
    return this.api.get<ApiResult<UserDetailDto>>(`${API_ENDPOINTS.INTRANET.USERS}/${id}`);
  }

  updateByEmail(email: string, body: UpdateUserRequest): Observable<ApiResult<UserDetailDto>> {
    return this.api.put<ApiResult<UserDetailDto>>(
      `${API_ENDPOINTS.INTRANET.USERS}/${encodeURIComponent(email)}`,
      body,
    );
  }
}
