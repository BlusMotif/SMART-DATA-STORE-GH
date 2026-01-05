// API configuration for different environments
// In production (Render), frontend and backend are on the same domain
// In development, they might be on different ports
import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:10000' : '';

export const api = {
  // In development, use localhost:10000
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

  // Get access token from Supabase session
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    cache: 'no-store',
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = errorData.error || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
    console.error('API Error:', { endpoint, status: response.status, error: errorData });
    throw new Error(errorMessage);
  }

  return response.json();
}