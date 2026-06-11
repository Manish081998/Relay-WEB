import { PlannerOrder } from './planner-order.model';
import { CapacityStatus, PlannerPlant } from './planner-plant.model';

// Enriched order row consumed by OrdersComponent.
// Combines the raw PlannerOrder with session-derived state (override, release
// status, selection) and the computed capacity signal for the effective plant.
export interface PlannerOrderRow extends PlannerOrder {
  overridePlant:  string;
  effectivePlant: string;
  isModified:     boolean;
  isReleased:     boolean;
  currentNote:    string;
  capStatus:      CapacityStatus;
  isSelected:     boolean;
}

// Row shape consumed by ReleasedOrdersComponent.
export interface ReleasedOrderRow {
  order:         PlannerOrder;
  assignedPlant: string;
  plant:         PlannerPlant | undefined;
  monthKey:      string;
  monthLabel:    string;
  monthLoad:     number;
  utilPct:       number;
  capStatus:     CapacityStatus;
  releasedAt:    string;
}

// Single item displayed in the release-confirmation modal.
export interface ReleaseConfirmItem {
  order:     PlannerOrder;
  plant:     string;
  plantName: string;
  projPct:   number;
  capStatus: CapacityStatus;
}
