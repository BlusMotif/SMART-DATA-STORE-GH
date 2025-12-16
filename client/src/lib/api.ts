// API configuration for different environments
// In production (Render), frontend and backend are on the same domain
// In development, they might be on different ports
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

export const api = {
  // In development, use localhost:5000
  // In production (Render), use relative URLs (same domain)
  baseURL: API_BASE_URL,

  // Helper to build full API URLs
  buildUrl: (endpoint: string) => {
    if (API_BASE_URL) {
      // Development: use full URL with localhost
      return `${API_BASE_URL}${endpoint}`;
    } else {
      // Production: use relative URLs (same domain)
      return endpoint;
    }
  },

  // Common API endpoints
  auth: {
    me: () => api.buildUrl('/api/auth/me'),
    login: () => api.buildUrl('/api/auth/login'),
    register: () => api.buildUrl('/api/auth/register'),
    logout: () => api.buildUrl('/api/auth/logout'),
  },

  products: {
    dataBundles: () => api.buildUrl('/api/products/data-bundles'),
    dataBundle: (id: string) => api.buildUrl(`/api/products/data-bundles/${id}`),
    resultCheckers: () => api.buildUrl('/api/products/result-checkers/stock'),
    resultCheckerInfo: (productId: string, year: number) => api.buildUrl(`/api/products/result-checkers/info/${productId}/${year}`),
  },

  agent: {
    register: () => api.buildUrl('/api/agent/register'),
    profile: () => api.buildUrl('/api/agent/profile'),
    transactions: () => api.buildUrl('/api/agent/transactions'),
    transactionsStats: () => api.buildUrl('/api/agent/transactions/stats'),
    withdrawals: () => api.buildUrl('/api/agent/withdrawals'),
    storefront: () => api.buildUrl('/api/agent/storefront'),
    pricing: () => api.buildUrl('/api/agent/pricing'),
  },

  checkout: {
    initialize: () => api.buildUrl('/api/checkout/initialize'),
  },

  transactions: {
    verify: (reference: string) => api.buildUrl(`/api/transactions/verify/${reference}`),
  },

  store: (slug: string) => api.buildUrl(`/api/store/${slug}`),
};

// API request utility
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = api.buildUrl(endpoint);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}