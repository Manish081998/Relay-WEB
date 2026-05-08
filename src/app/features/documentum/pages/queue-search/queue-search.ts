import {
  ChangeDetectionStrategy, Component, computed,
  DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Subject, switchMap } from 'rxjs';
import { OrderSearchPanelComponent } from '../../../../shared/components/order-search-panel/order-search-panel.component';
import { OrdersService } from '../../services/orders.service';
import { OrderItem, OrderSearchRequest } from '../../models/order.model';

@Component({
  selector: 'app-queue-search',
  standalone: true,
  imports: [CommonModule, OrderSearchPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './queue-search.html',
  styleUrl: './queue-search.scss',
})
export class QueueSearch {
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef    = inject(DestroyRef);

  private readonly search$ = new Subject<OrderSearchRequest>();
  private lastRequest: OrderSearchRequest | null = null;

  readonly orders     = signal<OrderItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading    = signal(false);
  readonly searched   = signal(false);
  readonly currentPage = signal(1);
  readonly pageSize    = signal(100);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );

  constructor() {
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
    this.currentPage.set(1);
    this.pageSize.set(request.pageSize);
    this.search$.next(this.lastRequest);
  }

  onCleared(): void {
    this.orders.set([]);
    this.totalCount.set(0);
    this.searched.set(false);
    this.currentPage.set(1);
    this.lastRequest = null;
  }

  goToPage(page: number): void {
    if (!this.lastRequest || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.search$.next({ ...this.lastRequest, pageNumber: page });
  }
}
