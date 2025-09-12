import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Create a single instance to prevent multiple React contexts
let globalQueryClient: QueryClient | undefined;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText || 'Unknown error';
    
    try {
      // Clone the response to avoid consuming the body stream
      const responseClone = res.clone();
      const text = await responseClone.text();
      
      if (text.trim()) {
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorData.detail || text;
        } catch {
          // If JSON parsing fails, use the raw text if it's meaningful
          errorMessage = text.length > 200 ? text.substring(0, 200) + '...' : text;
        }
      }
    } catch {
      // If we can't read the response body, use status-based error messages
      errorMessage = getStatusMessage(res.status);
    }
    
    const error = new Error(`${res.status}: ${errorMessage}`);
    (error as any).status = res.status;
    (error as any).statusText = res.statusText;
    throw error;
  }
}

function getStatusMessage(status: number): string {
  switch (status) {
    case 400: return 'Bad request - invalid data submitted';
    case 401: return 'Unauthorized - please log in again';
    case 403: return 'Forbidden - insufficient permissions';
    case 404: return 'Not found - resource does not exist';
    case 409: return 'Conflict - data conflicts with existing records';
    case 422: return 'Invalid data - please check your input';
    case 429: return 'Too many requests - please try again later';
    case 500: return 'Server error - please try again later';
    case 502: return 'Gateway error - service temporarily unavailable';
    case 503: return 'Service unavailable - please try again later';
    case 504: return 'Timeout - please try again later';
    default: return `Error ${status} - unexpected error occurred`;
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    timeout?: number;
  }
): Promise<Response> {
  const { method = 'GET', body, timeout = 30000 } = options || {};
  
  try {
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
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
    // Handle specific error types with meaningful messages
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout - please try again');
      (timeoutError as any).type = 'timeout';
      throw timeoutError;
    }
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network error - please check your connection');
      (networkError as any).type = 'network';
      throw networkError;
    }
    
    // Re-throw error as-is
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    try {
      const url = queryKey.join("/") as string;
      
      const res = await fetch(url, {
        credentials: "include",
        signal, // Let React Query handle cancellation properly
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      // Handle empty responses gracefully
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (res.status === 204) return null; // No Content
        const text = await res.text();
        if (!text.trim()) return null; // Empty response
        throw new Error('Invalid response - expected JSON');
      }
      
      try {
        const data = await res.json();
        return data;
      } catch (jsonError) {
        throw new Error('Invalid response - malformed data');
      }
      
    } catch (error: any) {
      // Handle AbortError gracefully during query cancellation
      if (error.name === 'AbortError') {
        // If signal was aborted, this is normal during component cleanup
        // Log debug info but don't create console noise
        console.debug('Query cancelled during cleanup:', queryKey);
        throw error; // Still throw to signal cancellation to React Query
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      // Re-throw all other errors as-is for proper error handling
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
          staleTime: 30000, // 30 seconds
          gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
          retry: (failureCount, error: any) => {
            // Don't retry after 3 attempts
            if (failureCount > 2) return false;
            
            // Never retry AbortError (query cancellation)
            if (error?.name === 'AbortError') return false;
            
            // Don't retry client errors (4xx) - these need user action
            if (error?.status >= 400 && error?.status < 500) return false;
            
            // Don't retry timeout errors more than once
            if (error?.type === 'timeout') return failureCount < 1;
            
            // Retry network errors and server errors (5xx) up to 3 times
            if (error?.type === 'network' || (error?.status >= 500)) return true;
            
            // For all other errors, retry once
            return failureCount < 1;
          },
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          // Remove dangerous throwOnError - let React Query handle errors naturally
        },
        mutations: {
          retry: (failureCount, error: any) => {
            // Only retry mutations once to avoid duplicate operations
            if (failureCount > 0) return false;
            
            // Don't retry client errors for mutations
            if (error?.status >= 400 && error?.status < 500) return false;
            
            // Only retry network errors and server errors (5xx) for mutations
            if (error?.type === 'network' || (error?.status >= 500)) return true;
            
            return false;
          },
          retryDelay: 1000, // Short delay for mutations
        },
      },
    });
  }
  return globalQueryClient;
}

export const queryClient = getQueryClient();