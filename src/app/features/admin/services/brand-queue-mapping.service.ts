import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { BrandQueueMappingApiResponse } from '../models/brand-mapping.model';

@Injectable()
export class BrandQueueMappingService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  getMapping(globalId: string, brandId: number, queueId: number): Observable<BrandQueueMappingApiResponse> {
    return this.api.get<BrandQueueMappingApiResponse>(
      `${this.env.apiBaseUrl}/api/documentum/queues/brand-queue-mapping`,
      { params: { globalId, brandId, queueId } },
    );
  }

  addMapping(globalId: string, brandId: number, queueIds: string): Observable<BrandQueueMappingApiResponse> {
    return this.api.get<BrandQueueMappingApiResponse>(
      `${this.env.apiBaseUrl}/api/documentum/queues/brand-queue-mapping`,
      { params: { globalId, actionType: 'ADD', brandId, queueId: queueIds } },
    );
  }

  removeMapping(globalId: string, brandId: number, queueIds: string): Observable<BrandQueueMappingApiResponse> {
    return this.api.get<BrandQueueMappingApiResponse>(
      `${this.env.apiBaseUrl}/api/documentum/queues/brand-queue-mapping`,
      { params: { globalId, actionType: 'REMOVE', brandId, queueId: queueIds } },
    );
  }
}
