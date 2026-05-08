export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:   '/api/GenerateToken',
    REFRESH: '/api/auth/refresh',
    LOGOUT:  '/api/auth/logout',
  },
  DOCUMENTS:     '/api/documents',
  ANNOTATIONS:   '/api/annotations',
  ORDERS_SEARCH: '/api/documentum/orders/search',
  USERS:         '/api/users',
  SELECTIONS:    '/api/selections',
} as const;
