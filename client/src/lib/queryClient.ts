import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

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
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
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

  const res = await fetch(url, {
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

    const res = await fetch(queryKey[0] as string, {
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
