import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser } from '../../models/user.model';
import { Role } from '../../models/role.enum';
import { SessionService } from '../services/session.service';
import { LoginResponse } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  private readonly _user = signal<AppUser | null>(this.rehydrate());

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);
  readonly queues = computed(() => this._user()?.associatedQueueNames ?? []);

  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(allowed: Role[]): boolean {
    return allowed.some((r) => this.roles().includes(r));
  }

  hasAnyQueue(required: string[]): boolean {
    return required.some((q) => this.queues().includes(q));
  }

  login(response: LoginResponse): void {
    const user = this.buildUser(response);
    this._user.set(user);
    this.session.saveLoginSession(response.accessToken, response.refreshToken, response.expiresAt, user);
  }

  /** Development shortcut — remove once real auth is integrated. */
  loginDev(user: AppUser): void {
    this._user.set(user);
    this.session.saveDevUser(user);
  }

  logout(): void {
    this._user.set(null);
    this.session.clearAll();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.session.getToken();
  }

  private rehydrate(): AppUser | null {
    const devUser = this.session.getDevUser();
    if (devUser) return devUser;
    const stored = this.session.getUser();
    if (stored) return stored;
    const token = this.session.getToken();
    return token ? this.parseToken(token) : null;
  }

  private buildUser(response: LoginResponse): AppUser {
    const { user } = response;
    const roles = this.mapUserType(user.userType);
    return {
      id: user.globalId,
      email: user.emailId,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      roles,
      firstName: user.firstName,
      lastName: user.lastName,
      globalId: user.globalId,
      title: user.title,
      companyName: user.companyName,
      department: user.department,
      office: user.office,
      profileImage: user.profileImage,
      brandId: user.brandId,
      brandName: user.brandName,
      associatedQueueNames: user.associatedQueueNames ?? [],
    };
  }

  private mapUserType(userType: string): Role[] {
    const map: Record<string, Role> = {
      [Role.SuperAdmin]: Role.SuperAdmin,
      [Role.Admin]: Role.Admin,
      [Role.User]: Role.User,
    };
    const role = map[userType];
    return role ? [role] : [];
  }

  private parseToken(token: string): AppUser {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const rawRoles: string[] = Array.isArray(roleClaim) ? roleClaim : roleClaim ? [roleClaim] : [];
    return {
      id: payload.sub ?? '',
      email: payload.unique_name ?? payload.sub ?? '',
      displayName: payload.unique_name ?? payload.sub ?? '',
      roles: rawRoles as Role[],
    };
  }
}
