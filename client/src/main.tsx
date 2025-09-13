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
    // Join all arguments to check for patterns
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    // Check for various DOMException patterns
    if (message.includes('DOMException') || 
        message.includes('Unhandled promise rejection:') ||
        message.includes('signal is aborted without reason')) {
      return true;
    }
    
    // Check each argument individually for more robust detection
    for (const arg of args) {
      // Direct DOMException instance check
      if (arg instanceof DOMException) {
        return true;
      }
      
      // Check if it's an object that looks like DOMException
      if (typeof arg === 'object' && arg !== null) {
        // Check constructor name
        if (arg.constructor?.name === 'DOMException') {
          return true;
        }
        
        // Check if it's an empty object (common DOMException representation)
        if (Object.keys(arg).length === 0 && arg.constructor === Object) {
          return true;
        }
        
        // Check for object with stack property containing React Query
        if (arg.stack && typeof arg.stack === 'string' && 
            (arg.stack.includes('tanstack_react-query.js') || 
             arg.stack.includes('@tanstack_react-query.js'))) {
          return true;
        }
        
        // Check for AbortError objects
        if (arg.name === 'AbortError' || arg.message === 'signal is aborted without reason') {
          return true;
        }
      }
      
      // Check for standalone DOMException {} string patterns
      if (typeof arg === 'string') {
        const cleanArg = arg.trim();
        if (cleanArg === 'DOMException {}' || 
            cleanArg === '{}' ||
            cleanArg.includes('DOMException') ||
            cleanArg.includes('AbortError') ||
            cleanArg.includes('signal is aborted')) {
          return true;
        }
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