import {
  ChangeDetectionStrategy, Component, computed,
  DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { OrderSearchPanelComponent } from '../../../../shared/components/order-search-panel/order-search-panel.component';
import { OrdersService } from '../../services/orders.service';
import { DropdownOption, OrderItem, OrderSearchRequest } from '../../models/order.model';

@Component({
  selector: 'app-queue-search',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderSearchPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './queue-search.html',
  styleUrl: './queue-search.scss',
})
export class QueueSearch {
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly router        = inject(Router);

  private readonly search$ = new Subject<OrderSearchRequest>();
  private readonly filterSearch$ = new Subject<void>();
  private lastRequest: OrderSearchRequest | null = null;

  readonly productTypes = signal<DropdownOption[]>([]);
  readonly regions    = signal<DropdownOption[]>([]);
  readonly brands     = signal<DropdownOption[]>([]);
  readonly queueNames = signal<DropdownOption[]>([]);
  readonly orders     = signal<OrderItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading    = signal(false);
  readonly searched   = signal(false);
  readonly selectedQueueName = signal('');
  readonly currentPage = signal(1);
  readonly pageSize    = signal(20);

  // ── Row selection ──────────────────────────────────────────────────────────
  readonly selectedRows = signal<Set<string>>(new Set());

  readonly selectedCount = computed(() => this.selectedRows().size);

  readonly isAllSelected = computed(() => {
    const items = this.orders();
    return items.length > 0 && this.selectedRows().size === items.length;
  });

  readonly isIndeterminate = computed(() => {
    const size = this.selectedRows().size;
    return size > 0 && size < this.orders().length;
  });

  // ── Column filters (server-side) ──────────────────────────────────────────
  readonly colFilters = signal<Record<string, string>>({});

  // ── Column sorting ────────────────────────────────────────────────────────
  readonly sortField     = signal<string>('');
  readonly sortDirection = signal<'asc' | 'desc' | ''>('');

  readonly skeletonRows = Array.from({ length: 20 });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );

  constructor() {
    this.ordersService.getBrands()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(brands => this.brands.set(brands));

    // Main search pipeline
    this.search$
      .pipe(
        switchMap(req => {
          this.loading.set(true);
          return this.ordersService.search(req);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: res => {
          const items = res.items ?? [];
          this.unsortedOrders = [...items];
          this.orders.set(items);
          this.totalCount.set(res.totalCount ?? 0);
          this.loading.set(false);
          this.searched.set(true);
          this.selectedRows.set(new Set());
          // Re-apply active sort to new data
          if (this.sortField()) {
            this.applySortLocally();
          }
        },
        error: () => {
          this.loading.set(false);
          this.searched.set(true);
        },
      });

    // Debounced column filter pipeline — merges filters into lastRequest
    this.filterSearch$
      .pipe(
        debounceTime(400),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!this.lastRequest) return;
        this.currentPage.set(1);
        this.search$.next(this.buildFilteredRequest());
      });
  }

  onSearch(request: OrderSearchRequest): void {
    this.lastRequest = { ...request, pageNumber: 1 };
    this.selectedQueueName.set(request.queueName ?? '');
    this.currentPage.set(1);
    this.pageSize.set(request.pageSize);
    // Clear column filters on new search from panel
    this.colFilters.set({});
    this.search$.next(this.lastRequest);
  }

  onBrandChanged(brandName: string): void {
    if (brandName) {
      this.ordersService.getProductTypes(brandName)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(types => this.productTypes.set(types));

      this.ordersService.getRegionsByBrand(brandName)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(regions => this.regions.set(regions));

      this.ordersService.getQueuesByBrand(brandName)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(queues => this.queueNames.set(queues));
    } else {
      this.productTypes.set([]);
      this.regions.set([]);
      this.queueNames.set([]);
    }
  }

  onCleared(): void {
    this.orders.set([]);
    this.totalCount.set(0);
    this.searched.set(false);
    this.currentPage.set(1);
    this.lastRequest = null;
    this.selectedQueueName.set('');
    this.selectedRows.set(new Set());
    this.colFilters.set({});
    this.sortField.set('');
    this.sortDirection.set('');
  }

  goToPage(page: number): void {
    if (!this.lastRequest || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.search$.next({ ...this.buildFilteredRequest(), pageNumber: page });
  }

  onAcquire(): void {
    // TODO: implement acquire selected queue items
  }

  openOrder(order: OrderItem): void {
    this.router.navigate(
      ['/documentum/workflow-information', order.orderGuid],
      { queryParams: { orderSeq: order.orderSeq, po: order.repPO }, state: { order } },
    );
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  toggleSelectAll(): void {
    const items = this.orders();
    if (this.isAllSelected()) {
      this.selectedRows.set(new Set());
    } else {
      this.selectedRows.set(new Set(items.map(o => o.orderGuid)));
    }
  }

  toggleRow(guid: string): void {
    const current = new Set(this.selectedRows());
    if (current.has(guid)) {
      current.delete(guid);
    } else {
      current.add(guid);
    }
    this.selectedRows.set(current);
  }

  selectRow(guid: string): void {
    if (this.selectedRows().has(guid)) {
      this.selectedRows.set(new Set());
    } else {
      this.selectedRows.set(new Set([guid]));
    }
  }

  isRowSelected(guid: string): boolean {
    return this.selectedRows().has(guid);
  }

  // ── Sort helpers ──────────────────────────────────────────────────────────
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
    // Restore original order from last API response
    if (this.unsortedOrders.length) {
      this.orders.set([...this.unsortedOrders]);
    }
  }

  private unsortedOrders: OrderItem[] = [];

  private applySortLocally(): void {
    const field = this.sortField() as keyof OrderItem;
    const dir   = this.sortDirection();
    if (!field || !dir) return;

    const sorted = [...this.orders()].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      // Handle nulls — push them to the end
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Date fields
      if (field === 'createdDate' || field === 'orderDate' || field === 'completionDate' || field === 'orderRecdDate') {
        const da = new Date(valA as string).getTime();
        const db = new Date(valB as string).getTime();
        return dir === 'asc' ? da - db : db - da;
      }

      // Numeric fields
      if (field === 'orderSeq' || field === 'priority') {
        const na = Number(valA) || 0;
        const nb = Number(valB) || 0;
        return dir === 'asc' ? na - nb : nb - na;
      }

      // String fields
      const sa = String(valA).toLowerCase();
      const sb = String(valB).toLowerCase();
      const cmp = sa.localeCompare(sb);
      return dir === 'asc' ? cmp : -cmp;
    });

    this.orders.set(sorted);
  }

  get hasActiveSort(): boolean {
    return this.sortField() !== '';
  }

  // ── Column resize ────────────────────────────────────────────────────────
  private resizingCol: HTMLTableCellElement | null = null;
  private resizeStartX = 0;
  private resizeStartW = 0;

  onResizeStart(event: MouseEvent, th: HTMLTableCellElement): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingCol = th;
    this.resizeStartX = event.clientX;
    this.resizeStartW = th.offsetWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.resizingCol) return;
      const diff = e.clientX - this.resizeStartX;
      const newWidth = Math.max(40, this.resizeStartW + diff);
      this.resizingCol.style.width = `${newWidth}px`;
      this.resizingCol.style.minWidth = `${newWidth}px`;
    };

    const onMouseUp = () => {
      this.resizingCol = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  // ── Filter helpers ────────────────────────────────────────────────────────
  onFilterChange(field: string, value: string): void {
    const current = { ...this.colFilters() };
    if (value) {
      current[field] = value;
    } else {
      delete current[field];
    }
    this.colFilters.set(current);
    this.selectedRows.set(new Set());
    // Trigger debounced server-side search
    this.filterSearch$.next();
  }

  clearAllFilters(): void {
    this.colFilters.set({});
    this.selectedRows.set(new Set());
    if (this.lastRequest) {
      this.currentPage.set(1);
      this.search$.next({ ...this.lastRequest, pageNumber: 1 });
    }
  }

  get hasActiveFilters(): boolean {
    return Object.keys(this.colFilters()).length > 0;
  }

  // ── Build request with column filters merged ──────────────────────────────
  private buildFilteredRequest(): OrderSearchRequest {
    const base = { ...this.lastRequest! };
    const filters = this.colFilters();

    // Merge column filter values — they override/refine the search panel values
    if (filters['repPO'])            base.repPO            = filters['repPO'];
    if (filters['salesOrderNumber']) base.salesOrderNumber  = filters['salesOrderNumber'];
    if (filters['priority'])         base.priority          = filters['priority'];
    if (filters['accountNumber'])    base.accountNumber     = filters['accountNumber'];
    if (filters['repName'])          base.repName           = filters['repName'];
    if (filters['queueName'])        base.queueName         = filters['queueName'];
    if (filters['productType'])      base.productType       = filters['productType'];
    if (filters['region'])           base.region            = filters['region'];
    if (filters['jobName'])          base.jobName           = filters['jobName'];
    if (filters['packageOwner'])     base.packageOwner      = filters['packageOwner'];
    if (filters['brand'])            base.brand             = filters['brand'];

    base.pageNumber = 1;
    return base;
  }
}
