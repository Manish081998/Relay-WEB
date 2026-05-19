import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, NgZone, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { UiStore } from '../../store/ui/ui.store';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';
import { ADMIN_NAV, DASHBOARD_NAV, NAV_GROUPS, USER_NAV, NavGroup, NavStandaloneItem } from './nav-config';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, InitialsPipe, ConfirmationDialogComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly auth      = inject(AuthStore);
  readonly ui        = inject(UiStore);
  readonly user      = this.auth.currentUser;
  readonly collapsed = this.ui.sidebarCollapsed;
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  // ── Resize state ───────────────────────────────────────────────────────────
  private static readonly MIN_WIDTH = 200;
  private static readonly MAX_WIDTH = 420;
  private static readonly DEFAULT_WIDTH = 256;

  readonly sidebarWidth     = signal(SidebarComponent.DEFAULT_WIDTH);
  readonly isResizing       = signal(false);
  readonly signOutModalOpen = signal(false);

  onSignOutConfirm(): void {
    this.signOutModalOpen.set(false);
    this.auth.logout();
  }

  private resizeCleanup: (() => void) | null = null;

  readonly dashboard = DASHBOARD_NAV;
  readonly allGroups = NAV_GROUPS;
  readonly allAdmin  = ADMIN_NAV;
  readonly userNav   = USER_NAV;

  private readonly currentUrl;

  private readonly _manualToggles = signal<Map<string, boolean>>(new Map());

  readonly openGroupLabels;

  constructor() {
    this.currentUrl = toSignal(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        map(e => (e as NavigationEnd).urlAfterRedirects),
        startWith(this.router.url),
      ),
      { initialValue: this.router.url },
    );

    this.openGroupLabels = computed(() => {
      const url    = this.currentUrl() ?? '';
      const manual = this._manualToggles();
      return new Set(
        NAV_GROUPS
          .filter(g => {
            const override = manual.get(g.label);
            return override !== undefined
              ? override
              : true;
          })
          .map(g => g.label),
      );
    });
  }

  readonly visibleGroups = computed<NavGroup[]>(() =>
    this.allGroups.filter(g =>
      g.roles === 'all' || this.auth.hasAnyRole(g.roles),
    ),
  );

  readonly visibleAdmin = computed<NavStandaloneItem[]>(() =>
    this.allAdmin.filter(i =>
      i.roles === 'all' || this.auth.hasAnyRole(i.roles),
    ),
  );

  toggle(groupLabel: string): void {
    // When collapsed: clicking a group icon navigates directly to its first child
    if (this.collapsed()) {
      const group = NAV_GROUPS.find(g => g.label === groupLabel);
      if (group?.children.length) {
        this.router.navigate([group.children[0].route]);
      }
      return;
    }
    const isOpen = this.openGroupLabels().has(groupLabel);
    this._manualToggles.update(m => new Map(m).set(groupLabel, !isOpen));
  }

  // ── Drag-to-resize ──────────────────────────────────────────────────────────

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(
        SidebarComponent.MAX_WIDTH,
        Math.max(SidebarComponent.MIN_WIDTH, e.clientX),
      );
      this.zone.run(() => this.sidebarWidth.set(newWidth));
    };

    const onMouseUp = () => {
      this.zone.run(() => this.isResizing.set(false));
      this.cleanupResize();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    this.resizeCleanup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    this.destroyRef.onDestroy(() => this.cleanupResize());
  }

  private cleanupResize(): void {
    this.resizeCleanup?.();
    this.resizeCleanup = null;
  }
}
