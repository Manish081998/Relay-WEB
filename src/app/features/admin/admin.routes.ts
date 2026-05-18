import { Routes } from '@angular/router';
import { DocumentumUsersService } from '../documentum/services/documentum-users.service';
import { ManageUserService } from './services/manage-user-service';
import { ManageQueueService } from './services/manage-queue.service';

export const adminRoutes: Routes = [
  {
    path: '',
    providers: [DocumentumUsersService, ManageUserService, ManageQueueService],
    children: [
      {
        path: 'manage-users',
        title: 'Manage Users',
        loadComponent: () =>
          import('./manage-users/manage-users').then(m => m.ManageUsers),
      },
      {
        path: 'manage-queue',
        title: 'Manage Queues',
        loadComponent: () =>
          import('./manage-queues/manage-queues').then(m => m.ManageQueues),
      },
    ],
  },
];
