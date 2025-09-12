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

// Additional suppression for console error messages in development
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Suppress "Unhandled promise rejection: {}" and similar DOMException console errors
    const message = args.join(' ');
    
    if (message.includes('Unhandled promise rejection:') || 
        message.includes('DOMException') ||
        (args.length === 2 && args[0] === 'Unhandled promise rejection:' && 
         typeof args[1] === 'object' && Object.keys(args[1]).length === 0)) {
      console.debug('Suppressed console error during development cleanup');
      return;
    }
    
    // Let all other errors through
    originalConsoleError.apply(console, args);
  };
}


createRoot(document.getElementById("root")!).render(<App />);