/**
 * STORAGE_KEYS
 *
 * Centralised localStorage key names used by SessionService.
 * Never hardcode these strings directly in a service or component —
 * always import and reference from here so that a key rename is a
 * one-line change in this file rather than a search-and-replace
 * across the entire codebase.
 *
 * TOKEN    — stores the JWT returned by the .NET API after login.
 *            Read by AuthInterceptor on every outgoing HTTP request
 *            to attach the Authorization: Bearer <token> header.
 *
 * DEV_USER — stores a fake AppUser object written by loginDev() in
 *            AuthService. Only used in development to bypass the real
 *            login flow. This key should never be set in UAT or prod
 *            because the env banner warns and the real login is used.
 */
export const STORAGE_KEYS = {
  TOKEN:         'relay_token',
  REFRESH_TOKEN: 'relay_refresh_token',
  EXPIRES_AT:    'relay_expires_at',
  USER:          'relay_user',
  DEV_USER:      'relay_dev_user',
} as const;

/**
 * CACHE_TTL_MS
 *
 * Time-to-live presets (in milliseconds) for the in-memory HTTP GET cache
 * managed by CacheInterceptor.
 *
 * HOW THE CACHE WORKS
 * ─────────────────────────────────────────────────────────────────────────
 * Every GET request is automatically cached for MEDIUM (2 min) by default.
 * You only need to touch these values when the default is wrong for your
 * specific API call.
 *
 * To override the TTL on a single request, pass an X-Cache-TTL header:
 *
 *   this.api.get<Role[]>('/roles', {
 *     headers: { 'X-Cache-TTL': String(CACHE_TTL_MS.LONG) }
 *   });
 *
 * To skip the cache entirely (e.g. after saving a record):
 *
 *   this.api.get<Document>(`/documents/${id}`, {
 *     headers: { 'X-Skip-Cache': 'true' }
 *   });
 *
 * To evict a cached URL so the next call re-fetches from the API:
 *
 *   invalidateCache('/documents');   // one specific URL
 *   invalidateCache();               // clear everything
 *
 * WHEN TO USE EACH VALUE
 * ─────────────────────────────────────────────────────────────────────────
 * SHORT  (30 s)  — data that changes frequently and the user expects to
 *                  see fresh on the next action. Examples: notifications,
 *                  task statuses, approval queues, anything with a live
 *                  badge count.
 *
 * MEDIUM (2 min) — DEFAULT. Most list and detail pages are fine here.
 *                  You do not need to set any header; the interceptor
 *                  applies MEDIUM automatically.
 *
 * LONG   (10 min) — data that almost never changes between page visits.
 *                   Examples: dropdown options (roles, document types,
 *                   departments), country/region lists, feature flags.
 *                   Safe to cache longer because a stale value here is
 *                   low-risk and a re-fetch would just return the same
 *                   data anyway.
 */
export const CACHE_TTL_MS = {
  SHORT:  30_000,
  MEDIUM: 120_000,
  LONG:   600_000,
} as const;
