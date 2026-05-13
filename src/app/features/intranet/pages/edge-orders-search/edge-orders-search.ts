import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { EdgeOrdersService } from '../../services/edge-orders.service';
import {
  EdgeOrderColDef,
  EdgeOrderDto,
  EdgeOrderSearchParams,
} from '../../models/edge-orders.model';
import { NOTIFICATION_MESSAGES as NM } from '../../../../core/constants/notification-messages';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-edge-orders-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    TooltipModule,
    InputTextModule,
    DatePickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edge-orders-search.html',
  styleUrl: './edge-orders-search.scss',
})
export class EdgeOrdersSearch implements OnInit {
  private readonly svc = inject(EdgeOrdersService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly orders = signal<EdgeOrderDto[]>([]);
  readonly apiResponseTime = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    noRecords: '',
    emailAddress: '',
    pcUserName: '',
    release: '',
    repPo: '',
    dateTime: this.fb.control<Date | null>(null),
    releaseName: '',
  });

  readonly columns: EdgeOrderColDef[] = [
    { field: 'releaseNumber', header: 'Release' },
    { field: 'name', header: 'PC User Name' },
    { field: 'accountNumber', header: 'Account #' },
    { field: 'releaseName', header: 'Release Name' },
    { field: 'repPO', header: 'Rep PO' },
    { field: 'lineItems', header: 'Line Items' },
    { field: 'totalNet', header: 'Total Net' },
    { field: 'emailId', header: 'Email ' },
    { field: 'marketingProgram', header: 'Marketing Program' },
    { field: 'orderRecdDate', header: 'Recorded Date', dateFormat: 'MM/dd/yyyy' },
    { field: 'brand', header: 'Brand' },
    { field: 'orderSource', header: 'Order Source' },
    { field: 'xmlMacPacOrder', header: 'XML File', isXml: true },
  ];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async onSearch(): Promise<void> {
    // getRawValue() returns fully-typed { field: string } with no nulls or Partial gaps
    const v = this.form.getRawValue();
    const params: EdgeOrderSearchParams = {};

    if (v.emailAddress.trim()) params.EmailId = v.emailAddress.trim();
    if (v.release.trim()) params.ReleaseNumber = v.release.trim();
    if (v.repPo.trim()) params.RepPO = v.repPo.trim();
    if (v.pcUserName.trim()) params.PcUserName = v.pcUserName.trim();
    if (v.dateTime) {
      const d = v.dateTime as Date;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      params.RecordedDate = `${mm}/${dd}/${d.getFullYear()}`;
    }
    if (v.releaseName.trim()) params.ReleaseName = v.releaseName.trim();

    // Pass undefined (load all) when no filter fields are filled
    await this.load(Object.keys(params).length ? params : undefined);
  }

  onClear(): void {
    this.form.reset();
    this.orders.set([]);
  }

  openXml(row: EdgeOrderDto): void {
    if (!row.xmlMacPacOrder) return;
    const key = this.storePayload('xml-viewer', {
      xml: row.xmlMacPacOrder,
      title: row.releaseName || row.releaseNumber || 'XML Document',
    });
    window.open(
      this.router.serializeUrl(
        this.router.createUrlTree(['/intranet/xml-viewer'], { queryParams: { key } }),
      ),
      '_blank',
    );
  }

  openOrderTransmittal(row: EdgeOrderDto): void {
    if (!row.xmlMacPacOrder) return;
    const key = this.storePayload('order-transmittal', {
      xml: row.xmlMacPacOrder,
      releaseNumber: row.releaseNumber,
    });
    window.open(
      this.router.serializeUrl(
        this.router.createUrlTree(['/intranet/order-transmittal'], { queryParams: { key } }),
      ),
      '_blank',
    );
  }

  // Persists payload to localStorage and prunes entries older than 2 hours
  // with the same prefix so storage doesn't grow unbounded.
  private storePayload(prefix: string, data: object): string {
    const key = `${prefix}-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${prefix}-`) && Number(k.replace(`${prefix}-`, '')) < cutoff)
      .forEach((k) => localStorage.removeItem(k));
    return key;
  }

  private async load(params?: EdgeOrderSearchParams): Promise<void> {
    const start = Date.now();
    try {
      const res = await firstValueFrom(this.svc.searchEdgeOrders(params));
      this.orders.set(res ?? []);
      this.apiResponseTime.set(Date.now() - start);
    } catch {
      this.notify.error(NM.INTRANET.EDGE_ORDER.LOAD_FAILED, 'Intranet');
    } finally {
    }
  }
}
