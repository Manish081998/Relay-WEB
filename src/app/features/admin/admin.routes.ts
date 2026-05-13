import { Routes } from '@angular/router';
import { DocumentumUsersService } from '../documentum/services/documentum-users.service';
import { ManageUserService } from './services/manage-user-service';

export const adminRoutes: Routes = [
  {
    path: '',
    providers: [DocumentumUsersService, ManageUserService],
    children: [
      {
        path: 'manage-users',
        loadComponent: () =>
          import('./manage-users/manage-users').then(m => m.ManageUsers),
      },
    ],
  },
];
