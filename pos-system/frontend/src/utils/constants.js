export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  VOID: 'void',
  REFUNDED: 'refunded',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  PRODUCTS: {
    BASE: '/products',
    BARCODE: (barcode) => `/products/barcode/${barcode}`,
    SEARCH: '/products/search',
    INVENTORY: (id) => `/products/${id}/inventory`,
  },
  TRANSACTIONS: {
    BASE: '/transactions',
    DETAIL: (id) => `/transactions/${id}`,
    VOID: (id) => `/transactions/${id}/void`,
    RECEIPT: (id) => `/transactions/${id}/receipt`,
  },
  REPORTS: {
    DAILY: '/reports/daily',
    MONTHLY: '/reports/monthly',
    PRODUCTS: '/reports/products',
    INVENTORY: '/reports/inventory',
    REVENUE: '/reports/revenue',
  },
};

export const CURRENCY = 'USD';
export const TAX_RATE = 10; // 10%
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm:ss';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';