import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Create a single instance to prevent multiple React contexts
let globalQueryClient: QueryClient | undefined;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      const text = await res.text();
      if (text) {
        // Try to parse as JSON first for better error messages
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || text;
        } catch (jsonError) {
          // JSON parsing failed, use text as-is
          errorMessage = text;
          console.warn('Failed to parse error response as JSON:', jsonError);
        }
      }
    } catch (textError) {
      // If we can't read the response, use statusText
      console.warn('Failed to read error response text:', textError);
      errorMessage = res.statusText;
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
  }
): Promise<Response> {
  try {
    const { method = 'GET', body } = options || {};
    
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Ensure all promise rejections are properly thrown
    console.warn('API request error:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      try {
        return await res.json();
      } catch (jsonError) {
        console.warn('Failed to parse response as JSON:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      // Ensure all promise rejections are properly thrown
      console.warn('Query function error:', error);
      throw error;
    }
  };

export function getQueryClient(): QueryClient {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: getQueryFn({ on401: "throw" }),
          refetchInterval: false,
          refetchOnWindowFocus: false,
          staleTime: 30000, // 30 seconds instead of Infinity to prevent stale data
          retry: (failureCount, error) => {
            // Retry network errors up to 2 times, but not auth or client errors
            if (failureCount > 2) return false;
            if (error instanceof Error) {
              // Don't retry auth errors (401, 403) or client errors (4xx)
              if (error.message.includes('401') || error.message.includes('403')) {
                return false;
              }
              // Don't retry on validation errors (400)
              if (error.message.includes('400')) {
                return false;
              }
              // Don't retry on 404 or other client errors
              if (error.message.includes('404') || error.message.includes('422')) {
                return false;
              }
            }
            return true;
          },
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
        mutations: {
          retry: (failureCount, error) => {
            // Only retry network errors for mutations, and max 1 retry
            if (failureCount > 1) return false;
            if (error instanceof Error && !error.message.includes('Network')) {
              return false;
            }
            return true;
          },
        },
      },
    });
  }
  return globalQueryClient;
}

export const queryClient = getQueryClient();
