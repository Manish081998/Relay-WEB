export type PlannerOrderStatus = 'pending' | 'released';

export interface PlannerOrder {
  id: string;
  product: string;
  sku: string;
  qty: number;
  unit: string;
  shipDate: string;
  region: string;
  recommendedPlant: string;
  allowedPlants: string[];
  status: PlannerOrderStatus;
  notes: string;
}

// ── API request / response shapes ─────────────────────────────────────────────
// When the backend is live, PlannerService.getOrders() returns Observable<PlannerOrdersResponse>
// instead of Observable<PlannerOrder[]>.  Update only the service method — stores
// and components remain unchanged.

export interface PlannerOrdersRequest {
  pageNumber?: number;
  pageSize?: number;
  region?: string;
  status?: PlannerOrderStatus;
}

export interface PlannerOrdersResponse {
  items: PlannerOrder[];
  totalCount: number;
}

export interface PlannerReleaseRequest {
  orderIds: string[];
}

export interface PlannerReleaseResponse {
  success: boolean;
  releasedIds: string[];
  failedIds?: string[];
}
