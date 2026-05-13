import {
  ChangeDetectionStrategy, Component, computed,
  DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, switchMap } from 'rxjs';
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
  imports: [CommonModule, OrderSearchPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly router        = inject(Router);

  private readonly search$ = new Subject<OrderSearchRequest>();
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
  readonly pageSize    = signal(100);

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
        },
        error: () => {
          this.loading.set(false);
          this.searched.set(true);
        },
      });
  }

  onSearch(request: OrderSearchRequest): void {
    this.lastRequest = { ...request, pageNumber: 1 };
    this.selectedQueueName.set(request.queueName ?? '');
    this.currentPage.set(1);
    this.pageSize.set(request.pageSize);
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
    this.queueNames.set([]);
  }

  goToPage(page: number): void {
    if (!this.lastRequest || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.search$.next({ ...this.lastRequest, pageNumber: page });
  }

  openOrder(order: OrderItem): void {
    this.router.navigate(
      ['/documentum/order-detail', order.orderGuid],
      { queryParams: { so: order.orderSeq } },
    );
  }
}

