import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";

// Create a single instance to prevent multiple React contexts
let globalQueryClient: QueryClient | undefined;

// Global 401 handler - automatically logout user and redirect to login
function handle401Error() {
  // Clear user data from localStorage
  localStorage.removeItem('mpbf_user');
  
  // Force reload to redirect to login through AuthProvider
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 errors globally - automatically logout user
    if (res.status === 401) {
      console.warn('Session expired - logging out user');
      handle401Error();
      // Still throw the error for proper error handling
      const error = new Error('انتهت صلاحية جلستك. جاري إعادة التوجيه...');
      (error as any).status = 401;
      (error as any).statusText = res.statusText;
      throw error;
    }
    
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
    case 400: return 'البيانات المُرسلة غير صحيحة. يرجى مراجعة المدخلات.';
    case 401: return 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.';
    case 403: return 'ليس لديك صلاحية للوصول إلى هذا المورد.';
    case 404: return 'المورد المطلوب غير موجود.';
    case 409: return 'تعارض في البيانات. قد يكون المورد موجود مسبقاً.';
    case 422: return 'البيانات غير صالحة. يرجى التحقق من صحة المدخلات.';
    case 429: return 'طلبات كثيرة جداً. يرجى المحاولة مرة أخرى بعد قليل.';
    case 500: return 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.';
    case 502: return 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى.';
    case 503: return 'الخدمة غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.';
    case 504: return 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.';
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
    // Handle specific error types with meaningful messages
    if (error.name === 'AbortError') {
      const timeoutError = new Error('انتهت مهلة الطلب - يرجى المحاولة مرة أخرى');
      (timeoutError as any).type = 'timeout';
      throw timeoutError;
    }
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('خطأ في الشبكة - يرجى التحقق من اتصال الإنترنت');
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
        // Silently handle query cancellation without any logging
        throw error; // Still throw to signal cancellation to React Query
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('خطأ في الشبكة - يرجى التحقق من اتصال الإنترنت');
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
          refetchOnMount: true,
          refetchOnReconnect: 'always',
          // Increase staleTime to reduce unnecessary refetches
          staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh longer
          gcTime: 10 * 60 * 1000, // 10 minutes garbage collection - keep data longer
          // Prevent excessive retries that can cause cancellation issues
          retry: (failureCount, error: any) => {
            // Don't retry after 2 attempts (reduced from 3)
            if (failureCount > 1) return false;
            
            // Never retry AbortError (query cancellation)
            if (error?.name === 'AbortError') return false;
            
            // Don't retry client errors (4xx) - these need user action
            if (error?.status >= 400 && error?.status < 500) return false;
            
            // Don't retry timeout errors
            if (error?.type === 'timeout') return false;
            
            // Only retry network errors and server errors (5xx) once
            if (error?.type === 'network' || (error?.status >= 500)) return failureCount < 1;
            
            // Don't retry other errors to prevent cascading cancellations
            return false;
          },
          retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 10000), // Faster exponential backoff, max 10s
          // Disable automatic background refetching that can cause cancellations
          refetchIntervalInBackground: false,
        },
        mutations: {
          retry: (failureCount, error: any) => {
            // Don't retry mutations at all to avoid duplicate operations
            return false;
          },
          // Remove retryDelay for mutations since we're not retrying
        },
      },
      // Add global query error handling with 401 support
      queryCache: new QueryCache({
        onError: (error, query) => {
          // Handle 401 errors globally
          if (error && (error as any).status === 401) {
            console.warn('401 error in query - handling logout:', query.queryKey);
            handle401Error();
            return;
          }
          
          // Completely suppress AbortErrors during development - no propagation at all
          if (import.meta.env.DEV && error?.name === 'AbortError') {
            // Do not let AbortErrors propagate or log anything - complete silence
            return;
          }
          // Let other errors propagate normally
        },
        onSettled: (data, error, query) => {
          // Additional catch for AbortError at settled phase
          if (import.meta.env.DEV && error?.name === 'AbortError') {
            return; // Suppress completely
          }
        }
      }),
      // Add mutation cache error handling with 401 support
      mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
          // Handle 401 errors globally in mutations
          if (error && (error as any).status === 401) {
            console.warn('401 error in mutation - handling logout:', mutation.options.mutationKey);
            handle401Error();
            return;
          }
          
          // Silently handle AbortErrors during development
          if (import.meta.env.DEV && error?.name === 'AbortError') {
            // Silently handle mutation cancellation without any logging
            return;
          }
          // Let other errors propagate normally
        },
      }),
    });
  }
  return globalQueryClient;
}

export const queryClient = getQueryClient();

// Complete AbortError suppression for development - Multiple layers
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleDebug = console.debug;
  const originalConsoleLog = console.log;
  
  // Enhanced AbortError detection - covers all patterns
  const isAbortError = (reason: any) => {
    if (!reason) return false;
    
    // Direct AbortError check
    if (reason?.name === 'AbortError' || 
        reason?.constructor?.name === 'AbortError') {
      return true;
    }
    
    // Message-based detection
    if (reason?.message && typeof reason.message === 'string') {
      const message = reason.message.toLowerCase();
      if (message.includes('signal is aborted') ||
          message.includes('operation was aborted') ||
          message.includes('aborted without reason') ||
          message.includes('convert value to \'abortsignal\'')) {
        return true;
      }
    }
    
    // Stack-based detection
    if (reason?.stack && typeof reason.stack === 'string') {
      if (reason.stack.includes('AbortError') ||
          reason.stack.includes('Object.cancel') ||
          reason.stack.includes('react-query')) {
        return true;
      }
    }
    
    // String-based detection for text arguments
    if (typeof reason === 'string') {
      const str = reason.toLowerCase();
      return str.includes('aborterror') || 
             str.includes('signal is aborted') ||
             str.includes('aborted without reason');
    }
    
    return false;
  };
  
  // Multiple unhandled rejection handlers for maximum coverage
  window.addEventListener('unhandledrejection', (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, { capture: true });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (isAbortError(event.reason)) {
      event.preventDefault();
      return false;
    }
  }, { capture: false });
  
  // Comprehensive console filtering
  console.error = (...args) => {
    const hasAbortError = args.some(arg => isAbortError(arg) || 
      (typeof arg === 'string' && (
        arg.includes('AbortError') || 
        arg.includes('signal is aborted') ||
        arg.includes('Failed to convert value to \'AbortSignal\'') ||
        arg.includes('Unhandled promise rejection')
      ))
    );
    
    if (!hasAbortError) {
      originalConsoleError(...args);
    }
  };
  
  console.warn = (...args) => {
    const hasAbortError = args.some(arg => isAbortError(arg) ||
      (typeof arg === 'string' && (
        arg.includes('AbortError') || 
        arg.includes('signal is aborted')
      ))
    );
    
    if (!hasAbortError) {
      originalConsoleWarn(...args);
    }
  };
  
  // Also filter debug and log messages
  console.debug = (...args) => {
    const hasAbortError = args.some(arg => isAbortError(arg) ||
      (typeof arg === 'string' && (
        arg.includes('Query cancelled during cleanup') ||
        arg.includes('Suppressed React Query AbortError')
      ))
    );
    
    if (!hasAbortError) {
      originalConsoleDebug(...args);
    }
  };
  
  console.log = (...args) => {
    const hasAbortError = args.some(arg => isAbortError(arg) ||
      (typeof arg === 'string' && arg.includes('AbortError'))
    );
    
    if (!hasAbortError) {
      originalConsoleLog(...args);
    }
  };
}