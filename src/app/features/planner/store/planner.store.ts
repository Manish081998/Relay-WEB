import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { PlannerOrder } from '../models/planner-order.model';
import {
  CapacityStatus,
  MonthBreakdown,
  PlantCapacitySummary,
  PlantMonthlyLoad,
  PlantReleaseImpact,
  PlannerPlant,
} from '../models/planner-plant.model';
import { PlannerSessionState } from '../models/planner-session.model';
import { PlannerOrderRow, ReleasedOrderRow } from '../models/planner-view.model';
import { capacityStatus, monthLabel, yearMonth } from '../utils/planner-capacity.utils';
import { PlannerService } from '../services/planner.service';
import { PlannerStateService } from '../services/planner-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NOTIFICATION_MESSAGES as NM } from '../../../core/constants/notification-messages';

@Injectable()
export class PlannerStore {
  private readonly svc = inject(PlannerService);
  private readonly stateService = inject(PlannerStateService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _orders = signal<PlannerOrder[]>([]);
  private readonly _plants = signal<PlannerPlant[]>([]);
  private readonly _loading = signal(false);
  private readonly _initialized = signal(false);
  private readonly _session = signal<PlannerSessionState>(this.stateService.getState());

  readonly orders = this._orders.asReadonly();
  readonly plants = this._plants.asReadonly();
  readonly loading = this._loading.asReadonly();

  // ── Capacity engine ──────────────────────────────────────────────────────────
  // Sums released-order qty into plant × calendar-month buckets.  Pending orders
  // are excluded so planners see committed load before making new assignments.
  readonly monthlyLoad = computed<PlantMonthlyLoad>(() => {
    const session = this._session();
    const load: PlantMonthlyLoad = {};
    this._plants().forEach((p) => {
      load[p.id] = {};
    });
    this._orders().forEach((order) => {
      const isReleased = !!session.released[order.id] || order.status === 'released';
      if (!isReleased) return;
      const plant = session.overrides[order.id] || order.recommendedPlant;
      const month = yearMonth(order.shipDate);
      if (!load[plant]) return;
      load[plant][month] = (load[plant][month] ?? 0) + order.qty;
    });
    return load;
  });

  // ── Enriched order rows (combines raw order + session state) ─────────────────
  readonly enrichedOrders = computed<PlannerOrderRow[]>(() => {
    const session = this._session();
    const mLoad = this.monthlyLoad();
    return this._orders().map((order) => {
      const override = session.overrides[order.id] ?? '';
      const isReleased = !!session.released[order.id] || order.status === 'released';
      const effectivePlant = override || order.recommendedPlant;
      const monthKey = yearMonth(order.shipDate);
      const plantMoLoad = mLoad[effectivePlant]?.[monthKey] ?? 0;
      const plant = this._plants().find((p) => p.id === effectivePlant);
      return {
        ...order,
        overridePlant: override,
        effectivePlant,
        isModified: !!override && override !== order.recommendedPlant,
        isReleased,
        currentNote: session.notes[order.id] ?? order.notes,
        capStatus: plant ? capacityStatus(plantMoLoad, plant.monthlyCapacity) : 'ok',
        isSelected: !!session.selections[order.id],
      };
    });
  });

  readonly selectedRows = computed(() => this.enrichedOrders().filter((o) => o.isSelected));
  readonly pendingRows = computed(() => this.enrichedOrders().filter((o) => !o.isReleased));
  readonly totalCount = computed(() => this._orders().length);
  readonly pendingCount = computed(() => this.pendingRows().length);
  readonly releasedCount = computed(() => this.enrichedOrders().filter((o) => o.isReleased).length);

  // ── Plant capacity summaries (consumed by PlantCapacityComponent) ─────────────
  readonly plantCapacitySummaries = computed<PlantCapacitySummary[]>(() => {
    const session = this._session();
    const mLoad = this.monthlyLoad();

    return this._plants().map((plant) => {
      const plantLoad = mLoad[plant.id] ?? {};

      const pendingOrders = this._orders().filter((o) => {
        if (!!session.released[o.id] || o.status === 'released') return false;
        return (session.overrides[o.id] || o.recommendedPlant) === plant.id;
      });

      const allMonths = [
        ...new Set([...Object.keys(plantLoad), ...pendingOrders.map((o) => yearMonth(o.shipDate))]),
      ].sort();

      const monthlyBreakdown: MonthBreakdown[] = allMonths.map((ym) => {
        const releasedLoad = plantLoad[ym] ?? 0;
        const pendingInMonth = pendingOrders.filter((o) => yearMonth(o.shipDate) === ym);
        const pendingLoad = pendingInMonth.reduce((s, o) => s + o.qty, 0);
        const projectedLoad = releasedLoad + pendingLoad;
        const relPct = Math.round((releasedLoad / plant.monthlyCapacity) * 100);
        const projPct = Math.round((projectedLoad / plant.monthlyCapacity) * 100);
        return {
          monthKey: ym,
          monthLabel: monthLabel(ym),
          releasedLoad,
          pendingLoad,
          projectedLoad,
          relPct,
          projPct,
          freeUnits: Math.max(0, plant.monthlyCapacity - releasedLoad),
          status: capacityStatus(releasedLoad, plant.monthlyCapacity),
          projStatus: capacityStatus(projectedLoad, plant.monthlyCapacity),
          pendingOrdersList: pendingInMonth,
        };
      });

      const worstStatus = monthlyBreakdown.reduce<CapacityStatus>((worst, m) => {
        if (m.status === 'over') return 'over';
        if (m.status === 'warn' && worst !== 'over') return 'warn';
        return worst;
      }, 'ok');

      return {
        plant,
        monthlyBreakdown,
        worstStatus,
        pendingOrders,
        pendingQty: pendingOrders.reduce((s, o) => s + o.qty, 0),
      };
    });
  });

  // ── Released order rows (consumed by ReleasedOrdersComponent) ────────────────
  readonly releasedOrderRows = computed<ReleasedOrderRow[]>(() => {
    const session = this._session();
    const mLoad = this.monthlyLoad();
    return this._orders()
      .filter((o) => !!session.released[o.id] || o.status === 'released')
      .map((order) => {
        const assignedPlant = session.overrides[order.id] || order.recommendedPlant;
        const plant = this._plants().find((p) => p.id === assignedPlant);
        const monthKey = yearMonth(order.shipDate);
        const moLoad = mLoad[assignedPlant]?.[monthKey] ?? 0;
        const utilPct = plant ? Math.round((moLoad / plant.monthlyCapacity) * 100) : 0;
        const meta = session.releaseMeta[order.id];
        return {
          order,
          assignedPlant,
          plant,
          monthKey,
          monthLabel: monthLabel(monthKey),
          monthLoad: moLoad,
          utilPct,
          capStatus: plant
            ? capacityStatus(moLoad, plant.monthlyCapacity)
            : ('ok' as CapacityStatus),
          releasedAt: meta
            ? new Date(meta.ts).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Pre-loaded',
        };
      });
  });

  // ── Data loading ──────────────────────────────────────────────────────────────
  loadData(): void {
    if (this._initialized()) return;
    this._loading.set(true);
    forkJoin({ orders: this.svc.getOrders(), plants: this.svc.getPlants() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ orders, plants }) => {
          this._plants.set(plants);
          this._orders.set(orders);
          this._loading.set(false);
          this._initialized.set(true);
          if (this.stateService.hasPersistedChanges()) {
            this.notify.info(NM.PLANNER.STATE_RESTORED, 'Planner');
          }
        },
        error: () => {
          this._loading.set(false);
          this.notify.error(NM.PLANNER.LOAD_FAILED, 'Planner');
        },
      });
  }

  refresh(): void {
    this._initialized.set(false);
    this.loadData();
  }

  // ── Session mutations ─────────────────────────────────────────────────────────
  setOverride(orderId: string, plantId: string): void {
    this._session.set(
      this.stateService.patch({
        overrides: { ...this._session().overrides, [orderId]: plantId },
      }),
    );
  }

  setNote(orderId: string, note: string): void {
    this._session.set(
      this.stateService.patch({
        notes: { ...this._session().notes, [orderId]: note },
      }),
    );
  }

  setSelection(orderId: string, selected: boolean): void {
    const selections = { ...this._session().selections };
    if (selected) {
      selections[orderId] = true;
    } else {
      delete selections[orderId];
    }
    this._session.set(this.stateService.patch({ selections }));
  }

  selectMany(ids: string[], selected: boolean): void {
    const selections = { ...this._session().selections };
    ids.forEach((id) => {
      if (selected) {
        selections[id] = true;
      } else {
        delete selections[id];
      }
    });
    this._session.set(this.stateService.patch({ selections }));
  }

  clearSelections(): void {
    this._session.set(this.stateService.patch({ selections: {} }));
  }

  assignSelectedToRecommended(): void {
    const overrides = { ...this._session().overrides };
    let count = 0;
    this.selectedRows()
      .filter((r) => !r.isReleased && !overrides[r.id])
      .forEach((r) => {
        overrides[r.id] = r.recommendedPlant;
        count++;
      });

    if (count === 0) {
      this.notify.info(NM.PLANNER.ALREADY_ASSIGNED, 'Planner');
      return;
    }
    this._session.set(this.stateService.patch({ overrides }));
    this.notify.success(`${count} order(s) confirmed to recommended plants.`, 'Planner');
  }

  bulkAssignPlant(plantId: string): { applied: number; skipped: number } {
    const overrides = { ...this._session().overrides };
    let applied = 0,
      skipped = 0;
    this.selectedRows()
      .filter((r) => !r.isReleased)
      .forEach((r) => {
        if (r.allowedPlants.includes(plantId)) {
          overrides[r.id] = plantId;
          applied++;
        } else {
          skipped++;
        }
      });
    this._session.set(this.stateService.patch({ overrides }));
    return { applied, skipped };
  }

  releaseOrders(ids: string[]): void {
    const session = this._session();
    const released = { ...session.released };
    const releaseMeta = { ...session.releaseMeta };
    const selections = { ...session.selections };
    const ts = new Date().toISOString();

    ids.forEach((id) => {
      released[id] = true;
      delete selections[id];
      const order = this._orders().find((o) => o.id === id);
      releaseMeta[id] = { plant: session.overrides[id] || (order?.recommendedPlant ?? ''), ts };
    });

    this._session.set(this.stateService.patch({ released, releaseMeta, selections }));
    this.notify.success(`${ids.length} order(s) released and dispatched to plants.`, 'Planner');
  }

  // ── Release impact projection (used by release modal) ─────────────────────────
  computeReleaseImpact(ids: string[]): PlantReleaseImpact[] {
    const session = this._session();
    const mLoad = this.monthlyLoad();

    const affectedPlantIds = [
      ...new Set(
        ids.map(
          (id) =>
            (session.overrides[id] || this._orders().find((o) => o.id === id)?.recommendedPlant) ??
            '',
        ),
      ),
    ].filter(Boolean);

    return affectedPlantIds
      .map((pid) => {
        const plant = this._plants().find((p) => p.id === pid);
        if (!plant) return null;
        const beforeLoad = Object.values(mLoad[pid] ?? {}).reduce((s, v) => s + v, 0);
        const addedLoad = ids.reduce((s, id) => {
          const o = this._orders().find((o) => o.id === id);
          if (!o) return s;
          return (session.overrides[id] || o.recommendedPlant) === pid ? s + o.qty : s;
        }, 0);
        const afterLoad = beforeLoad + addedLoad;
        return {
          plant,
          beforeLoad,
          afterLoad,
          beforePct: Math.min(Math.round((beforeLoad / plant.monthlyCapacity) * 100), 100),
          afterPct: Math.round((afterLoad / plant.monthlyCapacity) * 100),
          status: capacityStatus(afterLoad, plant.monthlyCapacity),
        };
      })
      .filter((x): x is PlantReleaseImpact => x !== null);
  }

  // ── Lookup helpers ────────────────────────────────────────────────────────────
  getPlantById(id: string): PlannerPlant | undefined {
    return this._plants().find((p) => p.id === id);
  }

  getSessionOverride(orderId: string): string {
    return this._session().overrides[orderId] ?? '';
  }

  // Re-export pure utils so templates/components don't need a separate import.
  readonly yearMonth = yearMonth;
  readonly capacityStatus = capacityStatus;
}
