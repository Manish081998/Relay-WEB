export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/GenerateToken',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },
  DOCUMENTUM: {
    DOCUMENTS: '/api/documents',
    ANNOTATIONS: '/api/annotations',
    ORDERS_SEARCH: '/api/documentum/orders/search',
    QUEUES: '/api/documentum/queues',
  },
  INTRANET: {
    USERS: '/api/users',
    EDGE_ORDERS_SEARCH: '/api/intranet/edge-orders/SearchEdgeOrders',
  },
  WEBTOOL: {
    SELECTIONS: '/api/selections',
  },
} as const;
