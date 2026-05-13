import { inject, Injectable } from '@angular/core';
import { AppUser } from '../../models/user.model';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = inject(StorageService);

  // ── Token ──────────────────────────────────────────────────────────────────

  saveToken(token: string): void {
    this.storage.set(STORAGE_KEYS.TOKEN, token, 'local');
  }

  getToken(): string | null {
    return this.storage.get(STORAGE_KEYS.TOKEN, 'local');
  }

  clearToken(): void {
    this.storage.remove(STORAGE_KEYS.TOKEN, 'local');
  }

  // ── Refresh token ──────────────────────────────────────────────────────────

  saveRefreshToken(token: string): void {
    this.storage.set(STORAGE_KEYS.REFRESH_TOKEN, token, 'local');
  }

  getRefreshToken(): string | null {
    return this.storage.get(STORAGE_KEYS.REFRESH_TOKEN, 'local');
  }

  clearRefreshToken(): void {
    this.storage.remove(STORAGE_KEYS.REFRESH_TOKEN, 'local');
  }

  // ── Token expiry ───────────────────────────────────────────────────────────

  saveExpiresAt(expiresAt: string): void {
    this.storage.set(STORAGE_KEYS.EXPIRES_AT, expiresAt, 'local');
  }

  getExpiresAt(): string | null {
    return this.storage.get(STORAGE_KEYS.EXPIRES_AT, 'local');
  }

  clearExpiresAt(): void {
    this.storage.remove(STORAGE_KEYS.EXPIRES_AT, 'local');
  }

  // ── User profile ──────────────────────────────────────────────────────────

  saveUser(user: AppUser): void {
    this.storage.set(STORAGE_KEYS.USER, JSON.stringify(user), 'local');
  }

  getUser(): AppUser | null {
    const raw = this.storage.get(STORAGE_KEYS.USER, 'local');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      return null;
    }
  }

  clearUser(): void {
    this.storage.remove(STORAGE_KEYS.USER, 'local');
  }

  // ── Dev user (development shortcut only) ───────────────────────────────────

  saveDevUser(user: AppUser): void {
    this.storage.set(STORAGE_KEYS.DEV_USER, JSON.stringify(user));
  }

  getDevUser(): AppUser | null {
    const raw = this.storage.get(STORAGE_KEYS.DEV_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      return null;
    }
  }

  clearDevUser(): void {
    this.storage.remove(STORAGE_KEYS.DEV_USER);
  }

  // ── Grouped convenience methods ────────────────────────────────────────────

  /** Call once after a successful login — persists tokens + user profile. */
  saveLoginSession(accessToken: string, refreshToken: string, expiresAt: string, user: AppUser): void {
    this.saveToken(accessToken);
    this.saveRefreshToken(refreshToken);
    this.saveExpiresAt(expiresAt);
    this.saveUser(user);
  }

  /** Call after a token refresh — updates tokens only, leaves user profile intact. */
  saveTokens(accessToken: string, refreshToken: string, expiresAt: string): void {
    this.saveToken(accessToken);
    this.saveRefreshToken(refreshToken);
    this.saveExpiresAt(expiresAt);
  }

  // ── Full session lifecycle ─────────────────────────────────────────────────

  clearAll(): void {
    this.clearToken();
    this.clearRefreshToken();
    this.clearExpiresAt();
    this.clearUser();
    this.clearDevUser();
  }
}
