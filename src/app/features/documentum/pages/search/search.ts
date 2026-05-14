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


export type SearchCriteria = Partial<{
  noRecords: string;
  release: string;
  pcUserName: string;
  releaseName: string;
  emailAddress: string;
  repPo: string;
  dateTime: string;
}>;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderSearchPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly router        = inject(Router);

  private readonly search$ = new Subject<OrderSearchRequest>();
  private readonly filterSearch$ = new Subject<void>();
  private lastRequest: OrderSearchRequest | null = null;

  readonly productTypes = signal<DropdownOption[]>([]);
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

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );

  constructor() {
    this.ordersService.getProductTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(types => this.productTypes.set(types));

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
          this.orders.set(res.items ?? []);
          this.totalCount.set(res.totalCount ?? 0);
          this.loading.set(false);
          this.searched.set(true);
          this.selectedRows.set(new Set());
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
      this.ordersService.getQueuesByBrand(brandName)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(queues => this.queueNames.set(queues));
    } else {
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
  }

  goToPage(page: number): void {
    if (!this.lastRequest || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.search$.next({ ...this.buildFilteredRequest(), pageNumber: page });
  }

  openOrder(order: OrderItem): void {
    this.router.navigate(
      ['/documentum/order-detail', order.orderGuid],
      { queryParams: { so: order.orderSeq } },
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

  isRowSelected(guid: string): boolean {
    return this.selectedRows().has(guid);
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
