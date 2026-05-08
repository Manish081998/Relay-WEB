import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { OrderSearchRequest, OrderSearchResponse } from '../models/order.model';

@Injectable()
export class OrdersService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  search(request: OrderSearchRequest): Observable<OrderSearchResponse> {
    const params: Record<string, string | number | boolean> = {
      pageNumber: request.pageNumber,
      pageSize:   request.pageSize,
    };
    if (request.repPO)          params['repPO']          = request.repPO;
    if (request.accountNumber)  params['accountNumber']  = request.accountNumber;
    if (request.brand)          params['brand']          = request.brand;
    if (request.repUserName)    params['repUserName']    = request.repUserName;
    if (request.jobNumber)      params['jobNumber']      = request.jobNumber;
    if (request.orderDateFrom)  params['orderDateFrom']  = request.orderDateFrom;
    if (request.orderDateTo)    params['orderDateTo']    = request.orderDateTo;

    return this.api.get<OrderSearchResponse>(
      `${this.env.apiBaseUrl}/api/documentum/orders/search`,
      { params },
    );
  }
}
