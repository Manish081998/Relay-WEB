import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';
import { ENVIRONMENT } from '../../core/tokens/environment.token';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InitialsPipe, RouterLink, ConfirmationDialogComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly auth    = inject(AuthStore);
  readonly user    = this.auth.currentUser;
  readonly envappVersion = inject(ENVIRONMENT).appVersion;
  readonly envappVersionDate = inject(ENVIRONMENT).appVersionDate;

  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly sectionLabels: Record<string, string> = {
    dashboard:  'Dashboard',
    documentum: 'Documentum',
    intranet:   'Intranet',
    webtool:    'WebTool',
    reports:    'Reports',
    admin:      'Administration',
    profile:    'Profile',
    forbidden:  'Access Denied',
  };

  readonly dropdownOpen     = signal(false);
  readonly signOutModalOpen = signal(false);

  onSignOutClick(): void {
    this.dropdownOpen.set(false);
    this.signOutModalOpen.set(true);
  }

  onSignOutConfirm(): void {
    this.signOutModalOpen.set(false);
    this.auth.logout();
  }

  readonly sectionTitle = computed(() => {
    const segment = (this.currentUrl() ?? '').split('/').filter(Boolean)[0] ?? '';
    return this.sectionLabels[segment] ?? 'Home';
  });

  /** Breadcrumb trail: e.g. ['Home', 'Intranet', 'Users'] */
  readonly breadcrumbTrail = computed<string[]>(() => {
    const raw = this.currentUrl() ?? '';
    const [path, qs] = raw.split('?');
    const segments = path.split('/').filter(Boolean);
    const trail: string[] = ['Home'];

    const section = segments[0] ?? '';
    if (section) {
      const sectionLabel = this.sectionLabels[section]
        ?? section.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      trail.push(sectionLabel);
    }

    const page = segments[1];
    if (page === 'workflow-information') {
      trail.push('Queue Search');
      const params = new URLSearchParams(qs ?? '');
      const po = params.get('po');
      if (po) trail.push(`PO: ${po}`);
    } else if (page === 'order-detail') {
      trail.push('Search');
      const params = new URLSearchParams(qs ?? '');
      const po = params.get('po');
      if (po) trail.push(`PO: ${po}`);
    } else if (page) {
      trail.push(page.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    }

    return trail;
  });
}
