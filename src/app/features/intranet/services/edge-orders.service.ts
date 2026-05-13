import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { EdgeOrderDto, EdgeOrderSearchParams } from '../models/edge-orders.model';

@Injectable()
export class EdgeOrdersService {
  private readonly api = inject(ApiService);

  searchEdgeOrders(params?: EdgeOrderSearchParams): Observable<EdgeOrderDto[]> {
    return this.api.get<EdgeOrderDto[]>(
      API_ENDPOINTS.INTRANET.EDGE_ORDERS_SEARCH,
      { params: params as Record<string, string> | undefined },
    );
  }
}
