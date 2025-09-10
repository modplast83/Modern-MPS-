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
    case 400: return 'طلب غير صحيح - البيانات المرسلة غير صالحة';
    case 401: return 'غير مصرح - يرجى تسجيل الدخول مرة أخرى';
    case 403: return 'ممنوع - ليس لديك صلاحية للوصول';
    case 404: return 'غير موجود - الموقع المطلوب غير موجود';
    case 409: return 'تعارض - البيانات متعارضة';
    case 422: return 'بيانات غير صالحة - يرجى مراجعة البيانات المدخلة';
    case 429: return 'كثرة الطلبات - يرجى المحاولة لاحقاً';
    case 500: return 'خطأ في الخادم - يرجى المحاولة لاحقاً';
    case 502: return 'خطأ في البوابة - الخدمة غير متوفرة مؤقتاً';
    case 503: return 'الخدمة غير متوفرة - يرجى المحاولة لاحقاً';
    case 504: return 'انتهت مهلة الاتصال - يرجى المحاولة لاحقاً';
    default: return `خطأ ${status} - حدث خطأ غير متوقع`;
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
    // Handle specific error types
    if (error.name === 'AbortError') {
      const timeoutError = new Error('انتهت مهلة الطلب - يرجى المحاولة لاحقاً');
      (timeoutError as any).type = 'timeout';
      throw timeoutError;
    }
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('خطأ في الاتصال - يرجى فحص الاتصال بالإنترنت');
      (networkError as any).type = 'network';
      throw networkError;
    }
    
    // Re-throw error with additional context
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
        signal, // Support query cancellation
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
        throw new Error('استجابة غير صالحة - النوع المتوقع JSON');
      }
      
      try {
        const data = await res.json();
        return data;
      } catch (jsonError) {
        throw new Error('استجابة غير صالحة - البيانات المستلمة تالفة');
      }
      
    } catch (error: any) {
      // Handle specific error types for better user experience
      if (error.name === 'AbortError') {
        // Query was cancelled - this is normal when components unmount
        // Don't treat as an unhandled error, just re-throw silently
        throw error;
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('خطأ في الاتصال - يرجى فحص الاتصال بالإنترنت');
      }
      
      // Re-throw with context
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
          retry: (failureCount, error: any) => {
            // Don't retry after 3 attempts
            if (failureCount > 2) return false;
            
            // Don't retry client errors (4xx)
            if (error?.status >= 400 && error?.status < 500) return false;
            
            // Don't retry auth errors specifically
            if (error?.status === 401 || error?.status === 403) return false;
            
            // Don't retry validation errors
            if (error?.status === 400 || error?.status === 422) return false;
            
            // Don't retry timeout errors immediately
            if (error?.type === 'timeout') return failureCount < 1;
            
            // Only retry network errors and server errors (5xx)
            if (error?.type === 'network' || (error?.status >= 500)) return true;
            
            // For all other errors, only retry once
            return failureCount < 1;
          },
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
        mutations: {
          retry: (failureCount, error: any) => {
            // Only retry mutations once to avoid duplicate operations
            if (failureCount > 1) return false;
            
            // Don't retry client errors (mutations should fail fast on validation errors)
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
