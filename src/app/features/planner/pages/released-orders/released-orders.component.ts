import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerStore } from '../../store/planner.store';
import { ReleasedOrderRow } from '../../models/planner-view.model';

type SortField = keyof ReleasedOrderRow | '';
type SortDir   = 'asc' | 'desc' | '';

@Component({
  selector: 'app-planner-released-orders',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './released-orders.component.html',
  styleUrl: './released-orders.component.scss',
})
export class ReleasedOrdersComponent implements OnInit {
  protected readonly store = inject(PlannerStore);

  readonly sortField     = signal<SortField>('');
  readonly sortDirection = signal<SortDir>('');
  readonly filterPlant   = signal('');
  readonly currentPage   = signal(1);
  readonly pageSize      = signal(20);

  readonly skeletonRows = Array.from({ length: 8 });

  protected readonly sorted = computed<ReleasedOrderRow[]>(() => {
    const field = this.sortField();
    const dir   = this.sortDirection();
    const plant = this.filterPlant();
    let rows = this.store.releasedOrderRows();
    if (plant) rows = rows.filter(r => r.assignedPlant === plant);
    if (!field || !dir) return rows;

    return [...rows].sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[field];
      const vb = (b as unknown as Record<string, unknown>)[field];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return dir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sorted().length / this.pageSize())),
  );

  readonly pagedRows = computed<ReleasedOrderRow[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  readonly totalReleasedQty = computed(() =>
    this.store.releasedOrderRows().reduce((s, r) => s + r.order.qty, 0),
  );

  ngOnInit(): void {
    this.store.loadData();
  }

  onSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  clearSort(): void {
    this.sortField.set('');
    this.sortDirection.set('');
  }

  get hasActiveSort(): boolean {
    return this.sortField() !== '';
  }

  onFilterPlant(value: string): void {
    this.filterPlant.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }
}
