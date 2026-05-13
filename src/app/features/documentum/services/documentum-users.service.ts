import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { BrandDto, DocumentumUserDto, UpdateDocumentumUserRequest } from '../models/documentum-user.model';

@Injectable()
export class DocumentumUsersService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  getAll(): Observable<DocumentumUserDto[]> {
    return this.api.get<DocumentumUserDto[]>(`${this.env.apiBaseUrl}/api/documentum/users`);
  }

  getById(id: number): Observable<DocumentumUserDto> {
    return this.api.get<DocumentumUserDto>(`${this.env.apiBaseUrl}/api/documentum/users/${id}`);
  }

  getAllBrands(): Observable<BrandDto[]> {
    return this.api.get<BrandDto[]>(`${this.env.apiBaseUrl}/api/documentum/GetAllBrands`);
  }

  update(body: UpdateDocumentumUserRequest): Observable<DocumentumUserDto> {
    return this.api.put<DocumentumUserDto>(
      `${this.env.apiBaseUrl}/api/documentum/users/`,
      body,
    );
  }
}
