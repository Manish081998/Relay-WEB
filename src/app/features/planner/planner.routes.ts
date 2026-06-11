import { Routes } from '@angular/router';
import { PlannerService } from './services/planner.service';
import { PlannerStateService } from './services/planner-state.service';
import { PlannerStore } from './store/planner.store';

export const plannerRoutes: Routes = [
  {
    path: '',
    providers: [PlannerService, PlannerStateService, PlannerStore],
    children: [
      {
        path: 'orders',
        title: 'Production Orders',
        loadComponent: () =>
          import('./pages/orders/orders.component').then(m => m.OrdersComponent),
      },
      {
        path: 'plant-capacity',
        title: 'Plant Capacity',
        loadComponent: () =>
          import('./pages/plant-capacity/plant-capacity.component').then(
            m => m.PlantCapacityComponent,
          ),
      },
      {
        path: 'released-orders',
        title: 'Released Orders',
        loadComponent: () =>
          import('./pages/released-orders/released-orders.component').then(
            m => m.ReleasedOrdersComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full',
      },
    ],
  },
];
