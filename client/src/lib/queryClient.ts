import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function parseError(res: Response) {
  try {
    const text = await res.text();
    if (!text) return res.statusText;

    try {
      const json = JSON.parse(text);
      return json.error || json.message || text;
    } catch {
      return text;
    }
  } catch {
    return res.statusText;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const now = Date.now();

  // Use cached token if it's still valid (expires in 5 minutes)
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {};
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Session error in getAuthHeaders:', error);
      // Clear cache on error
      cachedToken = null;
      tokenExpiry = null;
      return {};
    }
    const token = data.session?.access_token;

    // Cache the token for 5 minutes
    cachedToken = token || null;
    tokenExpiry = token ? now + (5 * 60 * 1000) : null;

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  } catch (err) {
    console.error('Failed to get session in getAuthHeaders:', err);
    // Clear cache on error
    cachedToken = null;
    tokenExpiry = null;
    return {};
  }
}

// Export function to clear cached token (useful during logout)
export function clearAuthCache() {
  cachedToken = null;
  tokenExpiry = null;
}

/* --------------------------------------------------
   Fetch wrapper (mutations & manual requests)
-------------------------------------------------- */

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  // In development, use the full backend URL
  const baseUrl = import.meta.env.DEV ? 'http://localhost:10000' : '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(message);
  }

  return res.json();
}

/* --------------------------------------------------
   React Query default fetcher
-------------------------------------------------- */

type UnauthorizedBehavior = "throw" | "returnNull";

export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();

    // In development, use the full backend URL
    const baseUrl = import.meta.env.DEV ? 'http://localhost:10000' : '';
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    const res = await fetch(fullUrl, {
      headers: {
        ...authHeaders,
      },
      credentials: "include",
    });

    if (res.status === 401 && on401 === "returnNull") {
      return null as T;
    }

    if (!res.ok) {
      const message = await parseError(res);
      throw new Error(message);
    }

    return res.json();
  };

/* --------------------------------------------------
   Query Client
-------------------------------------------------- */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),

      // ✅ sane defaults (NO request storms)
      staleTime: 60 * 1000,          // 1 minute
      gcTime: 5 * 60 * 1000,         // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
});
