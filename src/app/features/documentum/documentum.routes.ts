import { Routes } from '@angular/router';
import { DocumentsService } from './services/documents.service';
import { AnnotationsService } from './services/annotations.service';
import { DocumentsStore } from './store/documents.store';
import { OrdersService } from './services/orders.service';
import { DocumentumUsersService } from './services/documentum-users.service';

export const documentumRoutes: Routes = [
  {
    path: '',
    providers: [DocumentsService, AnnotationsService, DocumentsStore, OrdersService, DocumentumUsersService],
    children: [
      { path: '', redirectTo: 'documents', pathMatch: 'full' },

      {
        path: 'search',
        loadComponent: () =>
          import('./pages/search/search').then(m => m.Search),
      },

      {
        path: 'queue-search',
        loadComponent: () =>
          import('./pages/queue-search/queue-search').then(m => m.QueueSearch),
      },
      {
        path: 'order-detail/:orderGuid',
        loadComponent: () =>
          import('./pages/order-detail/order-detail').then(m => m.OrderDetail),
      },
      {
        path: 'workflow-information/:orderGuid',
        loadComponent: () =>
          import('./pages/workflow-information/workflow-information').then(m => m.WorkflowInformation),
      },

      {
        path: 'test-annotation',
        loadComponent: () =>
          import('./pages/test.annotation.component/test.annotation.component').then(m => m.TestAnnotationComponent),
      },
      

    ],
  },
];
