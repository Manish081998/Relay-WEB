import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerStore } from '../../store/planner.store';
import { NOTIFICATION_MESSAGES as NM } from '../../../../core/constants/notification-messages';
import { NotificationService } from '../../../../core/services/notification.service';
import { PlannerOrderRow } from '../../models/planner-view.model';
import { PlantReleaseImpact, CapacityStatus } from '../../models/planner-plant.model';
import { ReleaseConfirmItem } from '../../models/planner-view.model';

type SortField = keyof PlannerOrderRow | '';
type SortDir   = 'asc' | 'desc' | '';

@Component({
  selector: 'app-planner-orders',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit, OnDestroy {
  protected readonly store = inject(PlannerStore);
  private  readonly notify = inject(NotificationService);

  // ── Sort / pagination ────────────────────────────────────────────────────────
  readonly sortField     = signal<SortField>('');
  readonly sortDirection = signal<SortDir>('');
  readonly currentPage   = signal(1);
  readonly pageSize      = signal(20);

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  readonly bulkPlantId = signal('');

  // ── Release modal ─────────────────────────────────────────────────────────────
  readonly showModal    = signal(false);
  readonly modalItems   = signal<ReleaseConfirmItem[]>([]);
  readonly modalImpact  = signal<PlantReleaseImpact[]>([]);
  readonly hasCapWarn   = signal(false);
  private pendingReleaseIds: string[] = [];

  readonly skeletonRows = Array.from({ length: 10 });

  // ── Sorted + paged rows ───────────────────────────────────────────────────────
  private readonly sortedOrders = computed<PlannerOrderRow[]>(() => {
    const field = this.sortField();
    const dir   = this.sortDirection();
    const rows  = this.store.enrichedOrders();
    if (!field || !dir) return rows;

    return [...rows].sort((a, b) => {
      const va = a[field as keyof PlannerOrderRow];
      const vb = b[field as keyof PlannerOrderRow];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return dir === 'asc' ? va - vb : vb - va;
      }
      if (field === 'shipDate') {
        return dir === 'asc'
          ? new Date(va as string).getTime() - new Date(vb as string).getTime()
          : new Date(vb as string).getTime() - new Date(va as string).getTime();
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedOrders().length / this.pageSize())),
  );

  readonly pagedOrders = computed<PlannerOrderRow[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedOrders().slice(start, start + this.pageSize());
  });

  readonly allPendingSelected = computed(() => {
    const pending = this.store.pendingRows();
    return pending.length > 0 && pending.every(r => r.isSelected);
  });

  readonly selectedPendingCount = computed(
    () => this.store.selectedRows().filter(r => !r.isReleased).length,
  );

  // ── Note debounce map ─────────────────────────────────────────────────────────
  private noteTimers = new Map<string, ReturnType<typeof setTimeout>>();

  ngOnInit(): void {
    this.store.loadData();
  }

  ngOnDestroy(): void {
    this.noteTimers.forEach(t => clearTimeout(t));
  }

  // ── Sort ──────────────────────────────────────────────────────────────────────
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

  // ── Selection ─────────────────────────────────────────────────────────────────
  onRowCheck(orderId: string, checked: boolean): void {
    this.store.setSelection(orderId, checked);
  }

  onSelectAll(checked: boolean): void {
    const ids = this.pagedOrders().filter(r => !r.isReleased).map(r => r.id);
    this.store.selectMany(ids, checked);
  }

  // ── Override plant ────────────────────────────────────────────────────────────
  onOverrideChange(orderId: string, plantId: string): void {
    this.store.setOverride(orderId, plantId);
  }

  // ── Notes ─────────────────────────────────────────────────────────────────────
  onNoteInput(orderId: string, value: string): void {
    const prev = this.noteTimers.get(orderId);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      this.store.setNote(orderId, value);
      this.noteTimers.delete(orderId);
    }, 600);
    this.noteTimers.set(orderId, t);
  }

  // ── Assign selected ───────────────────────────────────────────────────────────
  assignSelected(): void {
    if (this.selectedPendingCount() === 0) {
      this.notify.info(NM.PLANNER.NO_SELECTION, 'Planner');
      return;
    }
    this.store.assignSelectedToRecommended();
  }

  // ── Bulk plant assign ──────────────────────────────────────────────────────────
  applyBulkPlant(): void {
    if (!this.bulkPlantId()) {
      this.notify.info(NM.PLANNER.BULK_NO_PLANT, 'Planner');
      return;
    }
    if (this.selectedPendingCount() === 0) {
      this.notify.info(NM.PLANNER.NO_SELECTION, 'Planner');
      return;
    }
    const { applied, skipped } = this.store.bulkAssignPlant(this.bulkPlantId());
    if (skipped > 0) {
      this.notify.warning(
        `${applied} assigned to ${this.bulkPlantId()}. ${skipped} skipped — plant not eligible for those orders.`,
        'Planner',
      );
    } else {
      this.notify.success(`${applied} order(s) bulk-assigned to ${this.bulkPlantId()}.`, 'Planner');
    }
  }

  // ── Release modal ─────────────────────────────────────────────────────────────
  openReleaseModal(): void {
    const ids = this.store.selectedRows().filter(r => !r.isReleased).map(r => r.id);
    if (ids.length === 0) {
      this.notify.info(NM.PLANNER.NO_SELECTION, 'Planner');
      return;
    }

    const items: ReleaseConfirmItem[] = ids.map(id => {
      const order     = this.store.enrichedOrders().find(o => o.id === id)!;
      const plant     = order.effectivePlant;
      const plantData = this.store.getPlantById(plant);
      const moLoad    = this.store.monthlyLoad()[plant]?.[this.store.yearMonth(order.shipDate)] ?? 0;
      const projPct   = plantData
        ? Math.round(((moLoad + order.qty) / plantData.monthlyCapacity) * 100)
        : 0;
      return {
        order,
        plant,
        plantName: plantData?.name ?? plant,
        projPct,
        capStatus: plantData
          ? this.store.capacityStatus(moLoad + order.qty, plantData.monthlyCapacity)
          : 'ok' as CapacityStatus,
      };
    });

    const impact = this.store.computeReleaseImpact(ids);
    this.pendingReleaseIds = ids;
    this.modalItems.set(items);
    this.modalImpact.set(impact);
    this.hasCapWarn.set(impact.some(i => i.status === 'over'));
    this.showModal.set(true);
  }

  confirmRelease(): void {
    this.store.releaseOrders(this.pendingReleaseIds);
    this.closeModal();
  }

  closeModal(): void {
    this.showModal.set(false);
    this.pendingReleaseIds = [];
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  // ── Template helpers ──────────────────────────────────────────────────────────
  getPlantOptionLabel(plantId: string, order: PlannerOrderRow): string {
    const plant   = this.store.getPlantById(plantId);
    if (!plant) return plantId;
    const monthKey = this.store.yearMonth(order.shipDate);
    const curLoad  = this.store.monthlyLoad()[plantId]?.[monthKey] ?? 0;
    const curPct   = Math.round((curLoad / plant.monthlyCapacity) * 100);
    const projPct  = Math.round(((curLoad + order.qty) / plant.monthlyCapacity) * 100);
    return `${plant.name}  [${curPct}% → ${projPct}% if assigned]`;
  }

  isRestricted(order: PlannerOrderRow): boolean {
    return order.allowedPlants.length === 1;
  }

  capStatusLabel(status: CapacityStatus): string {
    if (status === 'over') return 'Over Cap';
    if (status === 'warn') return 'Near Cap';
    return 'OK';
  }

  isDue(dateStr: string): boolean {
    return (new Date(dateStr).getTime() - Date.now()) / 86_400_000 < 3;
  }

  getRecPlantStatus(plantId: string, order: PlannerOrderRow): CapacityStatus {
    const plant = this.store.getPlantById(plantId);
    if (!plant) return 'ok';
    const moLoad = this.store.monthlyLoad()[plantId]?.[this.store.yearMonth(order.shipDate)] ?? 0;
    return this.store.capacityStatus(moLoad, plant.monthlyCapacity);
  }

  getRecPlantPct(plantId: string, order: PlannerOrderRow): number {
    const plant = this.store.getPlantById(plantId);
    if (!plant) return 0;
    const moLoad = this.store.monthlyLoad()[plantId]?.[this.store.yearMonth(order.shipDate)] ?? 0;
    return Math.round((moLoad / plant.monthlyCapacity) * 100);
  }
}
