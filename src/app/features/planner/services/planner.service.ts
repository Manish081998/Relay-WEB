import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import {
  PlannerOrder,
  PlannerReleaseRequest,
  PlannerReleaseResponse,
} from '../models/planner-order.model';
import { PlannerPlant } from '../models/planner-plant.model';
import { MOCK_ORDERS, MOCK_PLANTS } from '../mock/planner-mock-data';

// Mock responses simulate backend latency.  To connect to the real API, replace
// each method body with the commented ApiService call — no store or component
// changes are required.

@Injectable()
export class PlannerService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  getOrders(): Observable<PlannerOrder[]> {
    // return this.api.get<PlannerOrder[]>(`${this.env.apiBaseUrl}${API_ENDPOINTS.PLANNER.ORDERS}`);
    return of(MOCK_ORDERS).pipe(delay(450));
  }

  getPlants(): Observable<PlannerPlant[]> {
    // return this.api.get<PlannerPlant[]>(`${this.env.apiBaseUrl}${API_ENDPOINTS.PLANNER.PLANTS}`);
    return of(MOCK_PLANTS).pipe(delay(200));
  }

  releaseOrders(request: PlannerReleaseRequest): Observable<PlannerReleaseResponse> {
    // return this.api.post<PlannerReleaseResponse>(`${this.env.apiBaseUrl}${API_ENDPOINTS.PLANNER.RELEASE}`, request);
    return of({ success: true, releasedIds: request.orderIds }).pipe(delay(300));
  }
}
