export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/GenerateToken',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },
  DOCUMENTUM: {
    ORDERS_SEARCH: '/api/documentum/orders/search',
    QUEUES: '/api/documentum/queues',
    BRAND_QUEUE_MAPPING: '/api/documentum/queues/brand-queue-mapping',
  },
  INTRANET: {
    USERS: '/api/users',
    EDGE_ORDERS_SEARCH:  '/api/intranet/edge-orders/SearchEdgeOrders',
    GET_ORDER_BY_GUID:   '/api/intranet/edge-orders/GetOrderByGuid',
  },
  WEBTOOL: {
    SELECTIONS: '/api/selections',
  },
} as const;
