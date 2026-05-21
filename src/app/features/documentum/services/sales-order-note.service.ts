import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ENVIRONMENT } from '../../../core/tokens/environment.token';
import { SalesOrderNoteDto, AddSalesOrderNoteRequest } from '../models/note.model';

@Injectable()
export class SalesOrderNoteService {
  private readonly api = inject(ApiService);
  private readonly env = inject(ENVIRONMENT);

  private base = `${this.env.apiBaseUrl}/api/documentum/sales-order-notes`;

  /** Get all notes for an order — always fetches fresh (skips HTTP cache) */
  getByOrderSeq(orderSeq: number): Observable<SalesOrderNoteDto[]> {
    return this.api.get<SalesOrderNoteDto[]>(`${this.base}/${orderSeq}`, {
      headers: { 'X-Skip-Cache': 'true' },
    });
  }

  /** Add a new note */
  add(request: AddSalesOrderNoteRequest): Observable<number> {
    return this.api.post<number>(this.base, request);
  }
}
