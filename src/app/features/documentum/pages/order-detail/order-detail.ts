import {
  ChangeDetectionStrategy, Component,
  inject, input, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  readonly orderGuid = input<string>('');
  readonly activeTab = signal<'documents' | 'logs'>('documents');

  readonly salesOrderNumber = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('so') ?? '')),
    { initialValue: '' },
  );

  readonly packageInfo = {
    salesOrderNumber: '163323',
    purchaseOrderNumber: 'JL-1874-14B',
    accountNumber: 'N24301',
    repName: 'AIR-SIDE COMPONENTS',
    jobName: '',
    brand: 'Krueger',
    priority: '1',
    productType: 'TU',
    region: 'WEST',
    captureDate: '09/04/14',
    completionDate: '10/25/14 02:51 am',
    status: 'Complete',
    queueOwner: '',
    subBrand: '',
  };

  readonly notes = [
    { createdOn: '09/04/14 12:31 am', userName: 'Valerie Nail', note: '175.40 4' },
  ];

  readonly salesOrders = [
    { name: 'image2014-09-03-1...', createdOn: '09/04/14 12:30 am', createdBy: 'cnailv', versionLabel: '1.0\nCURRENT' },
  ];

  readonly supportDocuments = [
    { name: 'COIL ORDER E-MAIL...', createdOn: '09/03/2014 19:05:23', createdBy: 'cnailv', lastChanged: '06/26/2016 23:40:17', lastChangedBy: 'dmadmin', id: '0902ac578002ba66' },
  ];

  readonly workflowHistory = [
    { activityName: 'Initiate', comments: 'Creation of Sales Order Package', userName: 'swaney.sales', timestamp: '10/13/24 09:02 am', eventType: 'Creation', orderStatus: 'Order Initiated' },
    { activityName: 'Release to Production', comments: 'ccarfwja acquired task for final production release', userName: 'ccarfwja', timestamp: '12/22/25 06:42 pm', eventType: 'Acquire', orderStatus: '' },
  ];

  readonly salesOrderHistory = [
    { name: '18T109JB3G 1-14-2020_093800.pdf', createdOn: '01/14/20 09:38 pm', createdBy: 'asc_order_load', versionLabel: 'CURRENT' },
  ];

  setTab(tab: 'documents' | 'logs'): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/documentum/search']);
  }
}
