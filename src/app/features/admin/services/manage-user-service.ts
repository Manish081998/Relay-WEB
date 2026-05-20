
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { BrandDto, DocumentumUserDto, UpdateDocumentumUserRequest } from '../../documentum/models/documentum-user.model';
import { AdUserDto, CreateUserRequest, UpdateUserRequest } from '../models/ad-user.model';
import { BrandAndQueuesAndMappingDto } from '../models/brand-mapping.model';

@Injectable()
export class ManageUserService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  GetUserByGlobalId(GlobalID: string): Observable<AdUserDto> {
    return this.api.get<AdUserDto>(`${this.env.apiBaseUrl}/api/users/${GlobalID}`, {
      headers: { 'X-Silent-Errors': '404' },
    });
  }

  createUser(body: CreateUserRequest): Observable<void> {
    return this.api.post<void>(`${this.env.apiBaseUrl}/api/users/CreateUser`, body);
  }

  updateUser(body: UpdateUserRequest): Observable<void> {
    return this.api.put<void>(`${this.env.apiBaseUrl}/api/users/UpdateUser`, body);
  }

  deleteUser(globalId: string, queueId: number): Observable<void> {
    return this.api.delete<void>(
      `${this.env.apiBaseUrl}/api/users/DeleteUser`,
      undefined,
      { params: { globalId, queueId } },
    );
  }

  getById(id: number): Observable<DocumentumUserDto> {
    return this.api.get<DocumentumUserDto>(`${this.env.apiBaseUrl}/api/users/${id}`);
  }
  

  getAllBrands(): Observable<BrandDto[]> {
    return this.api.get<BrandDto[]>(`${this.env.apiBaseUrl}/api/documentum/GetAllBrands`);
  }
  GetBrandAndQueuesAndMapping(): Observable<BrandAndQueuesAndMappingDto> {
    return this.api.get<BrandAndQueuesAndMappingDto>(`${this.env.apiBaseUrl}/api/documentum/GetBrandAndQueuesAndMapping`);
  }

  update(body: UpdateDocumentumUserRequest): Observable<DocumentumUserDto> {
    return this.api.put<DocumentumUserDto>(
      `${this.env.apiBaseUrl}/api/documentum/users/`,
      body,
    );
  }
}
