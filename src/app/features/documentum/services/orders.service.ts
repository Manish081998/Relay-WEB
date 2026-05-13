import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { DropdownOption } from '../models/order.model';
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
    if (request.salesOrderNumber) params['salesOrderNumber'] = request.salesOrderNumber;
    if (request.repPO)            params['repPO']            = request.repPO;
    if (request.accountNumber)    params['accountNumber']    = request.accountNumber;
    if (request.productType)      params['productType']      = request.productType;
    if (request.region)           params['region']           = request.region;
    if (request.priority)         params['priority']         = request.priority;
    if (request.brand)            params['brand']            = request.brand;
    if (request.captureDateFrom)  params['captureDateFrom']  = request.captureDateFrom;
    if (request.captureDateTo)    params['captureDateTo']    = request.captureDateTo;
    if (request.jobName)          params['jobName']          = request.jobName;
    if (request.queueName)        params['queueName']        = request.queueName;
    if (request.packageOwner)     params['packageOwner']     = request.packageOwner;

    return this.api.get<OrderSearchResponse>(
      `${this.env.apiBaseUrl}/api/documentum/orders/search`,
      { params },
    );
  }

  getBrands(): Observable<DropdownOption[]> {
    return this.api.get<string[]>(
      `${this.env.apiBaseUrl}/api/documentum/orders/brands`,
    ).pipe(
      map(brands => brands.map(b => ({ label: b, value: b }))),
    );
  }

  getQueuesByBrand(brandName: string): Observable<DropdownOption[]> {
    return this.api.get<string[]>(
      `${this.env.apiBaseUrl}/api/documentum/orders/queues`,
      { params: { brandName } },
    ).pipe(
      map(queues => queues.map(q => ({ label: q, value: q }))),
    );
  }

  getProductTypes(): Observable<DropdownOption[]> {
    return this.api.get<string[]>(
      `${this.env.apiBaseUrl}/api/documentum/orders/product-types`,
    ).pipe(
      map(types => types.map(t => ({ label: t, value: t }))),
    );
  }
}
