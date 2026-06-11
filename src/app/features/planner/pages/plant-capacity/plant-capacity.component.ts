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
import { MonthBreakdown, PlantCapacitySummary } from '../../models/planner-plant.model';

@Component({
  selector: 'app-planner-plant-capacity',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plant-capacity.component.html',
  styleUrl: './plant-capacity.component.scss',
})
export class PlantCapacityComponent implements OnInit {
  protected readonly store = inject(PlannerStore);

  readonly expandedPlant = signal<string | null>(null);
  readonly skeletonRows  = Array.from({ length: 5 });

  readonly overCapCount = computed(() =>
    this.store.plantCapacitySummaries().filter(s => s.worstStatus === 'over').length,
  );

  readonly warnCount = computed(() =>
    this.store.plantCapacitySummaries().filter(s => s.worstStatus === 'warn').length,
  );

  ngOnInit(): void {
    this.store.loadData();
  }

  togglePlant(plantId: string): void {
    this.expandedPlant.update(cur => (cur === plantId ? null : plantId));
  }

  isExpanded(plantId: string): boolean {
    return this.expandedPlant() === plantId;
  }

  barPct(pct: number): number {
    return Math.min(pct, 100);
  }

  pendingOrdersLabel(summary: PlantCapacitySummary): string {
    const n = summary.pendingOrders.length;
    return n === 0
      ? 'No pending orders'
      : `${n} pending order${n !== 1 ? 's' : ''} · ${summary.pendingQty.toLocaleString()} units`;
  }

  monthRowClass(month: MonthBreakdown): string {
    if (month.projStatus === 'over') return 'week-over';
    if (month.projStatus === 'warn') return 'week-warn';
    return '';
  }
}
