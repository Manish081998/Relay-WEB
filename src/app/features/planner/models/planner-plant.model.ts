import { PlannerOrder } from './planner-order.model';

export type CapacityStatus = 'ok' | 'warn' | 'over';

export interface PlannerPlant {
  id:              string;
  name:            string;
  location:        string;
  region:          string;
  monthlyCapacity: number;
}

export interface PlannerPlantsResponse {
  items: PlannerPlant[];
}

// Keyed by plantId → monthKey (format: "YYYY-MM") → load in units
export interface PlantMonthlyLoad {
  [plantId: string]: { [monthKey: string]: number };
}

export interface MonthBreakdown {
  monthKey:          string;
  monthLabel:        string;
  releasedLoad:      number;
  pendingLoad:       number;
  projectedLoad:     number;
  relPct:            number;
  projPct:           number;
  freeUnits:         number;
  status:            CapacityStatus;
  projStatus:        CapacityStatus;
  pendingOrdersList: PlannerOrder[];
}

export interface PlantCapacitySummary {
  plant:             PlannerPlant;
  monthlyBreakdown:  MonthBreakdown[];
  worstStatus:       CapacityStatus;
  pendingOrders:     PlannerOrder[];
  pendingQty:        number;
}

export interface PlantReleaseImpact {
  plant:      PlannerPlant;
  beforeLoad: number;
  afterLoad:  number;
  beforePct:  number;
  afterPct:   number;
  status:     CapacityStatus;
}
