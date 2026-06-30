import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../models/role.enum';
import { NotificationService } from '../../../core/services/notification.service';
import { NOTIFICATION_MESSAGES as NM } from '../../../core/constants/notification-messages';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly envappVersion = inject(ENVIRONMENT).appVersion;
  readonly username = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  // DEV SHORTCUT: quick-login buttons — remove once real auth is integrated
  readonly devRoles = [
    { label: 'Super Admin', roles: [Role.SuperAdmin] },
    { label: 'Admin', roles: [Role.Admin] },
    { label: 'User', roles: [Role.User] },
  ];

  inputVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loading()) return;

    this.error.set('');
    this.loading.set(true);

    try {
      const res = await firstValueFrom(this.authSvc.login(this.username(), this.password()));
      this.authStore.login(res);
      this.notify.success(NM.AUTH.LOGIN_SUCCESS, 'Auth');
      this.router.navigate(['/']);
    } catch (err: unknown) {
      const httpErr = err as { error?: { message?: string } };
      this.error.set(httpErr?.error?.message ?? NM.AUTH.LOGIN_FAILED);
    } finally {
      this.loading.set(false);
    }
  }

  devLogin(roles: Role[]): void {
    this.authStore.loginDev({
      id: 'dev-user-001',
      email: 'dev@adticorp.com',
      displayName: 'Dev User',
      roles,
    });
    this.router.navigate(['/']);
  }
}
