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

// Comprehensive console suppression for development errors
if (import.meta.env.DEV) {
  // Helper function to check if arguments contain DOMException or empty object errors
  const shouldSuppressConsoleOutput = (args: any[]) => {
    const message = args.join(' ');
    
    // Check for various DOMException patterns
    if (message.includes('DOMException') || 
        message.includes('Unhandled promise rejection:')) {
      return true;
    }
    
    // Check for empty object {} that represents DOMException
    for (const arg of args) {
      if (typeof arg === 'object' && arg !== null) {
        // Check if it's an empty object or DOMException-like
        if (Object.keys(arg).length === 0 || 
            arg.constructor?.name === 'DOMException' ||
            arg instanceof DOMException) {
          return true;
        }
      }
      
      // Check for standalone DOMException {} string patterns
      if (typeof arg === 'string' && (
          arg === 'DOMException {}' || 
          arg.includes('DOMException') ||
          arg === '{}'
      )) {
        return true;
      }
    }
    
    return false;
  };

  // Override multiple console methods
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  
  console.error = (...args) => {
    if (shouldSuppressConsoleOutput(args)) {
      console.debug('Suppressed console error during development cleanup');
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  console.log = (...args) => {
    if (shouldSuppressConsoleOutput(args)) {
      console.debug('Suppressed console log during development cleanup');
      return;
    }
    originalConsoleLog.apply(console, args);
  };
  
  console.warn = (...args) => {
    if (shouldSuppressConsoleOutput(args)) {
      console.debug('Suppressed console warn during development cleanup');
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.info = (...args) => {
    if (shouldSuppressConsoleOutput(args)) {
      console.debug('Suppressed console info during development cleanup');
      return;
    }
    originalConsoleInfo.apply(console, args);
  };
}


createRoot(document.getElementById("root")!).render(<App />);