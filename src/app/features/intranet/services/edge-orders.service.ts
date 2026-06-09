import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints.constants';
import { EdgeOrderSearchParams, EdgeOrdersPagedResponse, EdiStatusResponse, GetOrderByGuidResponse, OrderUpdateSectionRequest, PlantCodeUpdateDto, SubmitOrderResponse, UpdatePlantCodeResponse } from '../models/edge-orders.model';

@Injectable()
export class EdgeOrdersService {
  private readonly api = inject(ApiService);

  searchEdgeOrders(params?: EdgeOrderSearchParams): Observable<EdgeOrdersPagedResponse> {
    const httpParams = params
      ? (Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ) as Record<string, string>)
      : undefined;

    return this.api.get<EdgeOrdersPagedResponse>(
      API_ENDPOINTS.INTRANET.EDGE_ORDERS_SEARCH,
      { params: httpParams },
    );
  }

  getOrderByGuid(orderGuid: string | undefined, repPo: string, userId: string): Observable<GetOrderByGuidResponse> {
    const params: Record<string, string> = { RepPo: repPo, UserId: userId };
    if (orderGuid) params['OrderGuid'] = orderGuid;
    return this.api.get<GetOrderByGuidResponse>(
      API_ENDPOINTS.INTRANET.GET_ORDER_BY_GUID,
      { params, headers: { 'X-Silent-Errors': '400', 'X-Skip-Cache': 'true' } },
    );
  }

  updateSection(
    orderGuid: string,
    sectionName: string,
    globalId: string,
    fileName: string,
    po: string,
    brand: string,
    req: OrderUpdateSectionRequest,
  ): Observable<void> {
    return this.api.put<void>(
      API_ENDPOINTS.INTRANET.UPDATE_ORDER_SECTION,
      req,
      { params: { orderGuid, sectionName, globalId, fileName, po, brand } },
    );
  }

  updatePlantCode(orderGuid: string, po: string, userId: string, dto: PlantCodeUpdateDto): Observable<UpdatePlantCodeResponse> {
    return this.api.put<UpdatePlantCodeResponse>(
      API_ENDPOINTS.INTRANET.UPDATE_PLANT_CODE,
      dto,
      { params: { orderGuid, po, userId } },
    );
  }

  getEdiStatus(po: string): Observable<EdiStatusResponse> {
    return this.api.get<EdiStatusResponse>(
      API_ENDPOINTS.INTRANET.GET_EDI_STATUS,
      { params: { repPo: po } },
    );
  }

  submitOrder(orderGuid: string, po: string, brand: string, userId: string): Observable<SubmitOrderResponse> {
    return this.api.post<SubmitOrderResponse>(
      `${API_ENDPOINTS.INTRANET.SUBMIT_ORDER}/${orderGuid}/submit`,
      {},
      { params: { po, brand, userId } },
    );
  }
}
