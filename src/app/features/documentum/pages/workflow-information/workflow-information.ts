import {
  ChangeDetectionStrategy, Component, computed,
  inject, input, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-workflow-information',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-information.html',
  styleUrl: './workflow-information.scss',
})
export class WorkflowInformation {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  readonly orderGuid = input<string>('');
  readonly activeTab = signal<'info' | 'documents' | 'history'>('info');

  readonly salesOrderNumber = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('so') ?? '')),
    { initialValue: '' },
  );

  readonly workflow = {
    queueName: 'Release to Production',
    state: 'Dormant',
    startedOn: '12/22/25',
  };

  readonly packageInfo = {
    salesOrderNumber: 'H78303',
    purchaseOrderNumber: 'SS24-289',
    accountNumber: '742400',
    jobName: 'PAULR...',
    brand: 'Krueger',
    productType: 'GRD',
    region: 'CENTRAL',
    repName: 'SWANEY SALES',
    subBrand: '',
    priority: '2',
    captureDate: '10/13/24 09:48 pm',
    completionDate: '',
    status: 'Release to Production',
    taskOwner: '',
  };

  readonly salesOrders = [
    { name: 'SS24-289_10-13-2024_12-18-50.pdf', createdOn: '10/13/24 09:48 pm', createdBy: 'asc_order_load' },
  ];

  readonly supportDocuments: { name: string; createdOn: string; createdBy: string }[] = [];

  readonly workflowHistory = [
    { activityName: 'Initiate', comments: 'Creation of Sales Order Package', userName: 'swaney.sales', timestamp: '10/13/24 09:02 am', eventType: 'Creation', orderStatus: 'Order Initiated' },
    { activityName: 'Release to Production', comments: 'ccarfwja acquired task for final production release', userName: 'ccarfwja', timestamp: '12/22/25 06:42 pm', eventType: 'Acquire', orderStatus: '' },
  ];

  readonly salesOrderHistory = [
    { name: '18T109JB3G 1-14-2020_093800.pdf', createdOn: '01/14/20 09:38 pm', createdBy: 'asc_order_load', versionLabel: 'CURRENT' },
  ];

  readonly notes = [
    { createdOn: '12/22/25 06:42 pm', userName: 'ccarfwja', note: '113.62 1' },
  ];

  setTab(tab: 'info' | 'documents' | 'history'): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/documentum/queue-search']);
  }
}
