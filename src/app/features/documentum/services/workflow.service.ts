import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { WorkflowState, WorkflowHistoryItem, WorkflowActionResult, BulkAcquireResult } from '../models/workflow.model';

@Injectable()
export class WorkflowService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  private base(orderSeq: number): string {
    return `${this.env.apiBaseUrl}/api/documentum/workflow/${orderSeq}`;
  }

  getState(orderSeq: number): Observable<WorkflowState> {
    return this.api.get<WorkflowState>(`${this.base(orderSeq)}/state`, {
      headers: { 'X-Skip-Cache': 'true' },
    });
  }

  getHistory(orderSeq: number): Observable<WorkflowHistoryItem[]> {
    return this.api.get<WorkflowHistoryItem[]>(`${this.base(orderSeq)}/history`, {
      headers: { 'X-Skip-Cache': 'true' },
    });
  }

  acquire(orderSeq: number, displayName: string): Observable<WorkflowActionResult> {
    return this.api.post<WorkflowActionResult>(`${this.base(orderSeq)}/acquire`, { displayName });
  }

  unassign(orderSeq: number, displayName: string): Observable<WorkflowActionResult> {
    return this.api.post<WorkflowActionResult>(`${this.base(orderSeq)}/unassign`, { displayName });
  }

  complete(orderSeq: number, destinationQueueId: number, displayName: string): Observable<WorkflowActionResult> {
    return this.api.post<WorkflowActionResult>(
      `${this.base(orderSeq)}/complete`,
      { destinationQueueId, displayName },
    );
  }

  bulkAcquire(orderSeqs: number[], displayName: string): Observable<BulkAcquireResult> {
    return this.api.post<BulkAcquireResult>(
      `${this.env.apiBaseUrl}/api/documentum/workflow/bulk-acquire`,
      { orderSeqs, displayName },
    );
  }
}
