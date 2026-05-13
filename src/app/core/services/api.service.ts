import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../tokens/environment.token';

/** Options accepted by every request method. */
export interface RequestOptions {
  /** Query-string parameters appended to the URL. */
  params?: Record<string, string | number | boolean>;
  /** Per-request headers merged on top of the interceptor-injected ones. */
  headers?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly env  = inject(ENVIRONMENT);

  // ─── Standard JSON verbs ──────────────────────────────────────────────────

  get<T>(url: string, options?: RequestOptions): Observable<T> {
    return this.http.get<T>(this.url(url), this.jsonOptions(options));
  }

  post<T>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.post<T>(this.url(url), body, this.jsonOptions(options));
  }

  put<T>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.put<T>(this.url(url), body, this.jsonOptions(options));
  }

  patch<T>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.patch<T>(this.url(url), body, this.jsonOptions(options));
  }

  /** DELETE optionally accepts a body (e.g. bulk-delete by ID list). */
  delete<T>(url: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http.delete<T>(this.url(url), { ...this.jsonOptions(options), body });
  }

  /** HEAD — returns full HttpResponse so callers can inspect headers. */
  head(url: string, options?: RequestOptions): Observable<HttpResponse<void>> {
    return this.http.head<void>(this.url(url), {
      ...this.jsonOptions(options),
      observe: 'response',
    });
  }

  // ─── File upload ──────────────────────────────────────────────────────────

  upload<T>(url: string, form: FormData, options?: RequestOptions): Observable<T> {
    return this.http.post<T>(this.url(url), form, {
      params:  this.buildParams(options?.params),
      headers: options?.headers,
    });
  }

  // ─── File download ────────────────────────────────────────────────────────

  download(url: string, options?: RequestOptions): Observable<Blob> {
    return this.http.get(this.url(url), {
      ...this.jsonOptions(options),
      responseType: 'blob',
    });
  }

  // ─── Full response (body + headers + status) ──────────────────────────────

  getResponse<T>(url: string, options?: RequestOptions): Observable<HttpResponse<T>> {
    return this.http.get<T>(this.url(url), {
      ...this.jsonOptions(options),
      observe: 'response',
    });
  }

  postResponse<T>(url: string, body: unknown, options?: RequestOptions): Observable<HttpResponse<T>> {
    return this.http.post<T>(this.url(url), body, {
      ...this.jsonOptions(options),
      observe: 'response',
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Prepends apiBaseUrl. Passes absolute URLs (http/https) through unchanged. */
  private url(path: string): string {
    return path.startsWith('http') ? path : `${this.env.apiBaseUrl}${path}`;
  }

  private jsonOptions(options?: RequestOptions) {
    return {
      params:  this.buildParams(options?.params),
      headers: options?.headers,
    };
  }

  private buildParams(params?: Record<string, string | number | boolean>): HttpParams {
    let p = new HttpParams();
    if (!params) return p;
    for (const [k, v] of Object.entries(params)) {
      p = p.set(k, String(v));
    }
    return p;
  }
}
