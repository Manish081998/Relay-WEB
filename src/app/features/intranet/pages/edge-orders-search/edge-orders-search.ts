import {
  ChangeDetectionStrategy, Component, computed,
  inject, OnInit, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { EdgeOrdersService } from '../../services/edge-orders.service';
import { EdgeOrderDto, EdgeOrderSearchParams } from '../../models/edge-orders.model';
import { NOTIFICATION_MESSAGES as NM } from '../../../../core/constants/notification-messages';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-edge-orders-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, DatePickerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edge-orders-search.html',
  styleUrl: './edge-orders-search.scss',
})
export class EdgeOrdersSearch implements OnInit {
  private readonly svc    = inject(EdgeOrdersService);
  private readonly notify = inject(NotificationService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly orders      = signal<EdgeOrderDto[]>([]);
  readonly loading     = signal(false);
  readonly searched    = signal(false);
  readonly totalCount  = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize    = signal(50);

  readonly sortField     = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc' | ''>('');

  readonly skeletonRows = Array.from({ length: 20 });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );

  private unsortedOrders: EdgeOrderDto[] = [];
  private lastSearchParams: EdgeOrderSearchParams = { PageNumber: 1, PageSize: 50 };

  readonly form = this.fb.nonNullable.group({
    noRecords:    '50',
    emailAddress: '',
    pcUserName:   '',
    release:      '',
    repPo:        '',
    dateTime:     this.fb.control<Date | null>(null),
    releaseName:  '',
  });

  async ngOnInit(): Promise<void> {
    await this.load({ PageNumber: 1, PageSize: 50 });
  }

  async onSearch(): Promise<void> {
    const v = this.form.getRawValue();
    const pageSize = Number(v.noRecords) || 50;
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
    this.sortField.set('');
    this.sortDirection.set('');

    const params: EdgeOrderSearchParams = { PageNumber: 1, PageSize: pageSize };
    if (v.emailAddress.trim()) params.EmailId       = v.emailAddress.trim();
    if (v.release.trim())      params.ReleaseNumber = v.release.trim();
    if (v.repPo.trim())        params.RepPO         = v.repPo.trim();
    if (v.pcUserName.trim())   params.PcUserName    = v.pcUserName.trim();
    if (v.dateTime) {
      const d  = v.dateTime as Date;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      params.RecordedDate = `${mm}/${dd}/${d.getFullYear()}`;
    }
    if (v.releaseName.trim()) params.ReleaseName = v.releaseName.trim();

    this.lastSearchParams = { ...params };
    await this.load(params);
  }

  onClear(): void {
    this.form.reset({ noRecords: '50' });
    this.orders.set([]);
    this.totalCount.set(0);
    this.searched.set(false);
    this.currentPage.set(1);
    this.sortField.set('');
    this.sortDirection.set('');
    this.lastSearchParams = { PageNumber: 1, PageSize: 50 };
  }

  async goToPage(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    await this.load({ ...this.lastSearchParams, PageNumber: page });
  }

  // ── Sort ──────────────────────────────────────────────────────────────────────
  onSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.applySortLocally();
  }

  clearSort(): void {
    this.sortField.set('');
    this.sortDirection.set('');
    if (this.unsortedOrders.length) {
      this.orders.set([...this.unsortedOrders]);
    }
  }

  get hasActiveSort(): boolean { return this.sortField() !== ''; }

  private applySortLocally(): void {
    const field = this.sortField() as keyof EdgeOrderDto;
    const dir   = this.sortDirection();
    if (!field || !dir) return;

    const sorted = [...this.orders()].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (field === 'orderRecdDate') {
        const da = new Date(valA as string).getTime();
        const db = new Date(valB as string).getTime();
        return dir === 'asc' ? da - db : db - da;
      }

      const sa  = String(valA).toLowerCase();
      const sb  = String(valB).toLowerCase();
      const cmp = sa.localeCompare(sb);
      return dir === 'asc' ? cmp : -cmp;
    });

    this.orders.set(sorted);
  }

  // ── Column resize ─────────────────────────────────────────────────────────────
  private resizingCol: HTMLTableCellElement | null = null;
  private resizeStartX = 0;
  private resizeStartW = 0;

  onResizeStart(event: MouseEvent, th: HTMLTableCellElement): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingCol  = th;
    this.resizeStartX = event.clientX;
    this.resizeStartW = th.offsetWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.resizingCol) return;
      const diff     = e.clientX - this.resizeStartX;
      const newWidth = Math.max(40, this.resizeStartW + diff);
      this.resizingCol.style.width    = `${newWidth}px`;
      this.resizingCol.style.minWidth = `${newWidth}px`;
    };

    const onMouseUp = () => {
      this.resizingCol = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  // ── Edit Order ───────────────────────────────────────────────────────────────
  openEditOrder(row: EdgeOrderDto): void {
    const key = this.storePayload('edit-order', {
      xml:           row.xmlMacPacOrder,
      releaseNumber: row.releaseNumber,
    });
    this.router.navigate(['/intranet/edit-order'], { queryParams: { key } });
  }

  // ── XML / Order Transmittal ───────────────────────────────────────────────────
  openXml(row: EdgeOrderDto): void {
    if (!row.xmlMacPacOrder) return;
    const key = this.storePayload('xml-viewer', {
      xml:   row.xmlMacPacOrder,
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
      xml:           row.xmlMacPacOrder,
      releaseNumber: row.releaseNumber,
    });
    window.open(
      this.router.serializeUrl(
        this.router.createUrlTree(['/print/order-transmittal'], { queryParams: { key } }),
      ),
      '_blank',
    );
  }

  private storePayload(prefix: string, data: object): string {
    const key = `${prefix}-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
    const cutoff = Date.now() - 60 * 60 * 1000;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${prefix}-`) && Number(k.replace(`${prefix}-`, '')) < cutoff)
      .forEach((k) => localStorage.removeItem(k));
    return key;
  }

  private async load(params: EdgeOrderSearchParams): Promise<void> {
    this.loading.set(true);
    try {
      const res           = await firstValueFrom(this.svc.searchEdgeOrders(params));
      const items         = res.items ?? [];
      this.unsortedOrders = [...items];
      this.orders.set(items);
      this.totalCount.set(res.totalCount ?? 0);
      this.currentPage.set(res.pageNumber ?? params.PageNumber ?? 1);
      this.searched.set(true);
      if (this.sortField()) this.applySortLocally();
    } catch {
      this.notify.error(NM.INTRANET.EDGE_ORDER.LOAD_FAILED, 'Intranet');
    } finally {
      this.loading.set(false);
    }
  }
}
