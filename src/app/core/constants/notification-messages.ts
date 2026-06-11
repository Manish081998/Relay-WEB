/**
 * Central registry for all user-facing notification messages.
 * Organised by module → entity so every message has a clear owner.
 *
 * Usage:
 *   import { NOTIFICATION_MESSAGES as NM } from '../constants/notification-messages';
 *   notify.error(NM.DOCUMENTUM.DOCUMENT.LOAD_FAILED);
 *   notify.error(NM.http(err.status, err.error?.message));
 */
export const NOTIFICATION_MESSAGES = {
  // ── HTTP status codes ──────────────────────────────────────────────────────
  // Used exclusively by error.interceptor — do not use in feature stores.
  HTTP: {
    0: 'Network error — check your connection and try again.',
    400: 'Bad request — the submitted data was invalid.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    405: 'This operation is not allowed.',
    408: 'The request timed out. Please try again.',
    409: 'Conflict — the resource may already exist.',
    410: 'This resource is no longer available.',
    413: 'The uploaded content is too large.',
    415: 'Unsupported file type.',
    422: 'Validation failed — check your input and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'An internal server error occurred. Please try again.',
    502: 'Bad gateway — the server is temporarily unreachable.',
    503: 'Service unavailable. Please try again shortly.',
    504: 'Gateway timeout — the server took too long to respond.',
  } as Record<number, string>,

  // ── AUTH module ────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN_SUCCESS: 'Welcome back!',
    LOGIN_FAILED: 'Invalid email or password.',
    LOGOUT: 'You have been signed out.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED: 'You must be signed in to continue.',
    ACCESS_DENIED: 'You do not have access to this area.',
  },

  // ── DOCUMENTUM module ─────────────────────────────────────────────────────
  DOCUMENTUM: {
    DOCUMENT: {
      LOAD_FAILED: 'Failed to load document.',
      NOT_FOUND: 'Document not found.',
      UPDATE_SUCCESS: 'Document updated successfully.',
      UPDATE_FAILED: 'Failed to update document.',
    },
    ANNOTATION: {
      LOAD_FAILED: 'Failed to load annotation.',
      NOT_FOUND: 'Annotation not found.',
    },
    ORDER: {
      SEARCH_FAILED: 'Failed to search orders.',
    },
    USER: {
      LOAD_FAILED:     'Failed to load users.',
      UPDATE_SUCCESS:  'User updated successfully.',
      UPDATE_FAILED:   'Failed to update user.',
    },
  },

  // ── INTRANET module ───────────────────────────────────────────────────────
  INTRANET: {
    USER: {
      LOAD_FAILED: 'Failed to load user.',
      NOT_FOUND: 'User not found.',
      CREATE_SUCCESS: 'User created successfully.',
      CREATE_FAILED: 'Failed to create user.',
      UPDATE_SUCCESS: 'User updated successfully.',
      UPDATE_FAILED: 'Failed to update user.',
      DELETE_SUCCESS: 'User removed successfully.',
      DELETE_FAILED: 'Failed to remove user.',
    },
    EDGE_ORDER: {
      LOAD_FAILED:      'Failed to load edge orders.',
      UPDATE_SUCCESS:   'All changes submitted successfully.',
      UPDATE_FAILED:    'Failed to submit changes.',
      SUBMIT_SUCCESS:          'Order submitted successfully.',
      SUBMIT_FAILED:           'Failed to submit order.',
      PLANT_CODE_UPDATE_SUCCESS: 'Plant code updated successfully.',
      PLANT_CODE_UPDATE_FAILED:  'Failed to update plant code.',
    },
  },

  // ── PLANNER module ────────────────────────────────────────────────────────
  PLANNER: {
    LOAD_FAILED:     'Failed to load planner data.',
    STATE_RESTORED:  'Draft assignments restored from your previous session.',
    ALREADY_ASSIGNED: 'All selected orders are already confirmed — no changes made.',
    NO_SELECTION:    'No pending orders selected. Check one or more rows first.',
    BULK_NO_PLANT:   'Select a target plant before applying bulk assignment.',
  },

  // ── WEBTOOL module ────────────────────────────────────────────────────────
  WEBTOOL: {
    SELECTION: {
      LOAD_FAILED: 'Failed to load selection.',
      NOT_FOUND: 'Selection not found.',
    },
  },

  // ── General / cross-cutting ───────────────────────────────────────────────
  GENERAL: {
    UNEXPECTED: 'An unexpected error occurred.',
    NETWORK_ERROR: 'Network error — check your connection.',
    COPY_SUCCESS: 'Copied to clipboard.',
    SAVED: 'Changes saved.',
    DISCARDED: 'Changes discarded.',
    LOADING_FAILED: 'Failed to load data.',
  },
} as const;

/**
 * Resolves an HTTP status code to its mapped message.
 * Falls back to the raw server message, then to GENERAL.UNEXPECTED.
 * Use only in error.interceptor — stores should use domain messages.
 */
export function httpMessage(status: number, serverMessage?: string): string {
  return (
    NOTIFICATION_MESSAGES.HTTP[status] ?? serverMessage ?? NOTIFICATION_MESSAGES.GENERAL.UNEXPECTED
  );
}
