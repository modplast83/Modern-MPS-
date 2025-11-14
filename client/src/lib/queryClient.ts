import {
  QueryClient,
  QueryFunction,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";

// Create a single instance
let globalQueryClient: QueryClient | undefined;

// Global 401 handler
let recentLogoutTime = 0;
let logoutCount = 0;
const LOGOUT_COOLDOWN = 5000;
const MAX_RAPID_LOGOUTS = 3;

function handle401Error() {
  const now = Date.now();

  if (typeof window !== "undefined" && window.location.pathname === "/login") return;

  if (now - recentLogoutTime < LOGOUT_COOLDOWN) {
    logoutCount++;
    if (logoutCount >= MAX_RAPID_LOGOUTS) return;
    return;
  }

  recentLogoutTime = now;
  logoutCount = 0;

  localStorage.removeItem("mpbf_user");

  if (typeof window !== "undefined") {
    window.location.reload();
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      handle401Error();
      const error = new Error("انتهت صلاحية الجلسة. يتم إعادة التوجيه...");
      (error as any).status = 401;
      throw error;
    }

    let message = res.statusText || "خطأ غير معروف";

    try {
      const clone = res.clone();
      const text = await clone.text();

      if (text.trim()) {
        try {
          const obj = JSON.parse(text);
          message = obj.message || obj.error || obj.detail || text;
        } catch {
          message = text.length > 200 ? text.slice(0, 200) + "..." : text;
        }
      }
    } catch {
      message = getStatusMessage(res.status);
    }

    const error = new Error(`${res.status}: ${message}`);
    (error as any).status = res.status;
    throw error;
  }
}

function getStatusMessage(code: number): string {
  switch (code) {
    case 400: return "البيانات غير صحيحة.";
    case 401: return "انتهت الجلسة.";
    case 403: return "غير مصرح.";
    case 404: return "غير موجود.";
    case 409: return "تعارض البيانات.";
    case 422: return "البيانات غير صالحة.";
    case 429: return "طلبات كثيرة جداً.";
    case 500: return "خطأ في الخادم.";
    case 503: return "الخدمة غير متاحة.";
    default:  return `خطأ ${code}`;
  }
}

export async function apiRequest(
  url: string,
  options?: { method?: string; body?: string; timeout?: number }
): Promise<Response> {
  const { method = "GET", body, timeout = 30000 } = options || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    if (error.name === "AbortError") {
      const timeoutErr = new Error("انتهت مهلة الاتصال");
      (timeoutErr as any).type = "timeout";
      throw timeoutErr;
    }

    if (error.message.includes("Failed to fetch")) {
      const netErr = new Error("خطأ في الشبكة");
      (netErr as any).type = "network";
      throw netErr;
    }

    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T | undefined> =>

  async ({ queryKey, signal }) => {
    try {
      let url = queryKey[0] as string;

      if (queryKey.length > 1) {
        const rest = queryKey.slice(1);
        const last = rest[rest.length - 1];

        if (typeof last === "object" && last !== null && !Array.isArray(last)) {
          // Query params object
          const pathParts = rest
            .slice(0, -1)
            .filter((value: unknown) => value !== undefined && value !== null && value !== "")
            .map((value) => encodeURIComponent(String(value as string | number)));

          if (pathParts.length > 0) url += "/" + pathParts.join("/");

          const params = new URLSearchParams();
          Object.entries(last).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              params.append(key, String(value));
            }
          });

          const qs = params.toString();
          if (qs) url += (url.includes("?") ? "&" : "?") + qs;
        } else {
          // Path segments only
          const seg = rest
            .filter((value: unknown) => value !== undefined && value !== null && value !== "")
            .map((value) => encodeURIComponent(String(value as string | number)));

          if (seg.length > 0) url += "/" + seg.join("/");
        }
      }

      const res = await fetch(url, { credentials: "include", signal });

      if (options.on401 === "returnNull" && res.status === 401)
        return undefined;

      await throwIfResNotOk(res);

      const type = res.headers.get("content-type");

      if (!type?.includes("application/json")) {
        if (res.status === 204) return undefined;

        const txt = await res.text();
        if (!txt.trim()) return undefined;

        throw new Error("Malformed response");
      }

      return (await res.json()) as T;
    } catch (error: any) {
      if (error.name === "AbortError") {
        const silent = new Error("Query cancelled");
        (silent as any).silent = true;
        throw silent;
      }
      throw error;
    }
  };

export function getQueryClient(): QueryClient {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: getQueryFn({ on401: "throw" }),
          refetchOnWindowFocus: false,
          refetchOnReconnect: "always",
          refetchOnMount: true,
          refetchInterval: false,
          staleTime: 2 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          retry: (count, error: any) => {
            if (count > 1) return false;
            if (error?.name === "AbortError") return false;
            if (error?.status >= 400 && error?.status < 500) return false;
            if (error?.type === "timeout") return false;
            return true;
          },
          retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10000),
        },
        mutations: {
          retry: false,
        },
      },
      queryCache: new QueryCache({
        onError: (error: any) => {
          if (error?.status === 401) {
            handle401Error();
            return;
          }
          if (error?.silent || error?.name === "AbortError") return;
        },
      }),
      mutationCache: new MutationCache({
        onError: (error: any) => {
          if (error?.status === 401) {
            handle401Error();
            return;
          }
          if (error?.silent || error?.name === "AbortError") return;
        },
      }),
    });
  }

  return globalQueryClient;
}

export const queryClient = getQueryClient();
