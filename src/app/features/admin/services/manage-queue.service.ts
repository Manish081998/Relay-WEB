import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { CreateQueueRequest, QueueDto, UpdateQueueRequest } from '../models/queue.model';

@Injectable()
export class ManageQueueService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  getAll(): Observable<QueueDto[]> {
    return this.api.get<QueueDto[]>(`${this.env.apiBaseUrl}/api/documentum/queues`);
  }

  update(body: UpdateQueueRequest): Observable<number> {
    return this.api.put<number>(`${this.env.apiBaseUrl}/api/documentum/queues`, body);
  }

  create(body: CreateQueueRequest): Observable<number> {
    return this.api.post<number>(`${this.env.apiBaseUrl}/api/documentum/queues`, body);
  }

  delete(queueId: number): Observable<void> {
    return this.api.delete<void>(`${this.env.apiBaseUrl}/api/documentum/queues/${queueId}`);
  }
}
