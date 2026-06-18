import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints.constants';

export interface LoginRequest {
  UserName: string;
  Password: string;
}

export interface ApiUserProfile {
  userId: string | null;
  globalId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  title: string | null;
  companyName: string | null;
  department: string | null;
  office: string | null;
  userType: string;
  profileImage: string | null;
  brandId: number | null;
  brandName: string | null;
  associatedQueueNames: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: ApiUserProfile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { UserName: username, Password: password } satisfies LoginRequest,
    );
  }

  logout(): Observable<void> {
    return this.api.post<void>(API_ENDPOINTS.AUTH.LOGOUT, {});
  }
}
