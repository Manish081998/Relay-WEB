import { Routes } from '@angular/router';
import { UsersService } from './services/users.service';
import { UsersStore } from './store/users.store';
import { EdgeOrdersService } from './services/edge-orders.service';

export const intranetRoutes: Routes = [
  {
    path: '',
    providers: [UsersService, UsersStore, EdgeOrdersService],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      // {
      //   path: 'users',
      //   loadComponent: () =>
      //     import('./pages/user-list/user-list.component').then(m => m.UserListComponent),
      // },
      // {
      //   path: 'users/:id',
      //   loadComponent: () =>
      //     import('./pages/user-detail/user-detail.component').then(m => m.UserDetailComponent),
      // },
      {
        path: 'Edge-Orders-Search',
        loadComponent: () =>
          import('./pages/edge-orders-search/edge-orders-search').then(m => m.EdgeOrdersSearch),
      },
      {
        path: 'xml-viewer',
        loadComponent: () =>
          import('./pages/xml-viewer/xml-viewer').then(m => m.XmlViewer),
      },
      {
        path: 'order-transmittal',
        loadComponent: () =>
          import('./pages/order-transmittal/order-transmittal').then(m => m.OrderTransmittal),
      },
    ],
  },
];
