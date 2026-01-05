import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        // Try to parse as JSON first
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || text;
        } catch {
          // If not JSON, use the raw text
          errorMessage = text;
        }
      }
    } catch (e) {
      // If parsing fails, use statusText
    }
    throw new Error(errorMessage);
  }
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...authHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: 'no-store',
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(queryKey.join("/") as string, {
      headers: {
        ...authHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      credentials: "include",
      cache: 'no-store',
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when returning to tab
      refetchOnReconnect: true, // Refetch when reconnecting
      staleTime: 0, // Data is immediately considered stale
      gcTime: 0, // Don't keep unused data in memory (was cacheTime in v4)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
