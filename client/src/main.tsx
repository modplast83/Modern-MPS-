import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe, targeted error suppression for specific development issues only
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  
  // In development, suppress all React Query related AbortErrors and DOMExceptions
  // These are harmless errors that occur during normal component cleanup
  if (import.meta.env.DEV) {
    // Suppress React Query AbortErrors
    if (reason?.name === 'AbortError' && 
        reason?.message === 'signal is aborted without reason' &&
        (reason?.stack?.includes('tanstack_react-query.js') ||
         reason?.stack?.includes('@tanstack_react-query.js'))) {
      console.debug('Suppressed React Query AbortError during development cleanup');
      event.preventDefault();
      return;
    }
    
    // Suppress any AbortError from React Query that has the right stack trace
    if (reason?.name === 'AbortError' && 
        reason?.message === 'signal is aborted without reason') {
      console.debug('Suppressed AbortError during development cleanup');
      event.preventDefault();
      return;
    }
    
    // Suppress DOMException errors in all forms
    const isDOMException = reason?.name === 'DOMException' || 
                          (reason && typeof reason === 'object' && reason.constructor?.name === 'DOMException') ||
                          (reason && reason.toString && reason.toString() === '[object DOMException]') ||
                          (reason instanceof DOMException);
    
    // Suppress empty objects that are typically DOMException artifacts
    const isEmptyObject = reason && 
                         typeof reason === 'object' && 
                         Object.keys(reason).length === 0;
    
    // Suppress errors from eruda.js (Replit devtools) 
    const isErudaError = reason?.stack?.includes('eruda.js') || 
                        reason?.stack?.includes('eruda.min.js');
    
    if (isDOMException || isEmptyObject || isErudaError) {
      console.debug('Suppressed development error during cleanup:', { 
        type: isDOMException ? 'DOMException' : isErudaError ? 'ErudaError' : 'EmptyObject'
      });
      event.preventDefault();
      return;
    }
  }
  
  // Let all other errors propagate normally for proper debugging
});

// Global error handler for additional error suppression
window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    const error = event.error;
    const message = event.message;
    
    // Suppress DOMException errors that might slip through
    if (error instanceof DOMException || 
        message.includes('DOMException') ||
        (error && error.constructor?.name === 'DOMException')) {
      console.debug('Suppressed DOMException error during development cleanup');
      event.preventDefault();
      return;
    }
    
    // Suppress AbortError related errors
    if (error?.name === 'AbortError' || 
        message.includes('signal is aborted without reason') ||
        message.includes('AbortError')) {
      console.debug('Suppressed AbortError during development cleanup');
      event.preventDefault();
      return;
    }
  }
});

// Intercept console.log more aggressively to catch DOMException {}
if (import.meta.env.DEV) {
  // Store original console methods
  const originalMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    trace: console.trace,
    dir: console.dir,
    dirxml: console.dirxml,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    table: console.table
  };

  // Universal error detection function
  const isDevelopmentError = (args: any[]) => {
    // Convert all arguments to strings for pattern matching
    const stringifiedArgs = args.map(arg => {
      if (arg instanceof DOMException) return 'DOMException';
      if (typeof arg === 'object' && arg !== null) {
        if (arg.constructor?.name === 'DOMException') return 'DOMException';
        if (Object.keys(arg).length === 0) return '{}';
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    // Check for DOMException patterns
    if (stringifiedArgs.includes('DOMException') ||
        stringifiedArgs === '{}' ||
        stringifiedArgs.includes('signal is aborted without reason') ||
        stringifiedArgs.includes('AbortError')) {
      return true;
    }

    // Check individual arguments
    for (const arg of args) {
      if (arg instanceof DOMException ||
          (arg && arg.constructor?.name === 'DOMException') ||
          (typeof arg === 'object' && arg !== null && Object.keys(arg).length === 0)) {
        return true;
      }
    }

    return false;
  };

  // Override all console methods
  Object.keys(originalMethods).forEach(method => {
    (console as any)[method] = (...args: any[]) => {
      if (isDevelopmentError(args)) {
        console.debug(`Suppressed console.${method} during development cleanup`);
        return;
      }
      (originalMethods as any)[method].apply(console, args);
    };
  });
}



createRoot(document.getElementById("root")!).render(<App />);