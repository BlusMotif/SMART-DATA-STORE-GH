// API configuration for different environments
// In production (Render), frontend and backend are on the same domain
// In development, they might be on different ports
import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = {
  // Use VITE_API_BASE_URL for full URLs in both dev and prod
  baseURL: API_BASE_URL,

  // Helper to build full API URLs
  buildUrl: (endpoint: string) => {
    if (API_BASE_URL) {
      // Use full URL from environment
      return `${API_BASE_URL}${endpoint}`;
    } else {
      // Fallback to relative URLs
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
    profile: () => api.buildUrl('/api/profile'),
    transactions: () => api.buildUrl('/api/agent/transactions'),
    transactionsStats: () => api.buildUrl('/api/agent/transactions/stats'),
    withdrawals: () => api.buildUrl('/api/agent/withdrawals'),
    storefront: () => api.buildUrl('/api/agent/storefront'),
    pricing: () => api.buildUrl('/api/agent/pricing'),
  },

  checkout: {
    initialize: () => api.buildUrl('/api/checkout/initialize'),
  },

  wallet: {
    topup: {
      initialize: () => api.buildUrl('/api/wallet/topup/initialize'),
      verify: (reference: string) => api.buildUrl(`/api/wallet/topup/verify/${reference}`),
    },
    pay: () => api.buildUrl('/api/wallet/pay'),
  },

  transactions: {
    verify: (reference: string) => api.buildUrl(`/api/transactions/verify/${reference}`),
  },

  store: (role: string, slug: string) => api.buildUrl(`/api/store/${role}/${slug}`),
};

// Lock to prevent duplicate 401 auto-logout attempts
let autoLogoutInProgress = false;

// API request utility
export async function apiRequest(endpoint: string, options: RequestInit & { disableAutoLogout?: boolean } = {}): Promise<any> {
  const { disableAutoLogout, ...fetchOptions } = options;
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
      ...fetchOptions.headers,
    },
    cache: 'no-store',
    ...fetchOptions,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = errorData.error || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
    console.error('API Error:', { endpoint, status: response.status, error: errorData });
    
    // If unauthorized, sign out the user (unless disabled)
    if (response.status === 401 && !disableAutoLogout && !autoLogoutInProgress) {
      autoLogoutInProgress = true;
      try {
        await supabase.auth.signOut();
        window.location.href = '/login';
      } catch (error) {
        console.error('Auto-logout failed:', error);
        // Force redirect even if signOut fails
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}