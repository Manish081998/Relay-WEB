import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { Role } from './models/role.enum';

export const routes: Routes = [
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes),
  },

  // ── Authenticated shell ───────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'documentum/search', pathMatch: 'full' },
      // Documentum — SuperAdmin, Admin, User
      {
        path: 'documentum',
        canActivate: [roleGuard([Role.SuperAdmin, Role.Admin, Role.User])],
        loadChildren: () =>
          import('./features/documentum/documentum.routes').then(m => m.documentumRoutes),
      },

      // Intranet — SuperAdmin, Admin
      {
        path: 'intranet',
        canActivate: [roleGuard([Role.SuperAdmin, Role.Admin,Role.User])],
        loadChildren: () =>
          import('./features/intranet/intranet.routes').then(m => m.intranetRoutes),
      },

      // WebTool — all authenticated roles
      {
        path: 'webtool',
        loadChildren: () =>
          import('./features/webtool/webtool.routes').then(m => m.webtoolRoutes),
      },


      // Profile Settings — all authenticated users
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },

      // Admin panel — SuperAdmin only
      {
        path: 'admin',
        canActivate: [roleGuard([Role.SuperAdmin])],
        loadChildren: () =>
          import('./features/admin/admin.routes').then(m => m.adminRoutes),
      },

      {
        path: 'forbidden',
        loadComponent: () =>
          import('./shared/components/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
      },

      // ── 404 (inside shell so header + sidebar are visible) ──────────────
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
      },
    ],
  },
];
