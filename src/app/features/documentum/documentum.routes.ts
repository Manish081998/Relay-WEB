import { Routes } from '@angular/router';
import { OrdersService } from './services/orders.service';
import { DocumentumUsersService } from './services/documentum-users.service';

export const documentumRoutes: Routes = [
  {
    path: '',
    providers: [OrdersService, DocumentumUsersService],
    children: [
      { path: '', redirectTo: 'documents', pathMatch: 'full' },

      {
        path: 'search',
        title: 'Document Search',
        loadComponent: () =>
          import('./pages/search/search').then(m => m.Search),
      },

      {
        path: 'queue-search',
        title: 'Queue Search',
        loadComponent: () =>
          import('./pages/queue-search/queue-search').then(m => m.QueueSearch),
      },
      {
        path: 'order-detail/:orderGuid',
        title: 'Order Detail',
        loadComponent: () =>
          import('./pages/order-detail/order-detail').then(m => m.OrderDetail),
      },
      {
        path: 'workflow-information/:orderGuid',
        title: 'Workflow Information',
        loadComponent: () =>
          import('./pages/workflow-information/workflow-information').then(m => m.WorkflowInformation),
      },

      {
        path: 'test-annotation',
        title: 'Annotation Test',
        loadComponent: () =>
          import('./pages/test.annotation.component/test.annotation.component').then(m => m.TestAnnotationComponent),
      },
      

    ],
  },
];
