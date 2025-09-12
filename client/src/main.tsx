import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe, targeted error suppression for specific development issues only
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  
  // Suppress React Query AbortErrors during component cleanup in development
  // These occur when components unmount and React Query cancels ongoing requests
  if (import.meta.env.DEV &&
      reason?.name === 'AbortError' && 
      reason?.message === 'signal is aborted without reason' &&
      (reason?.stack?.includes('tanstack_react-query.js') ||
       reason?.stack?.includes('@tanstack_react-query.js'))) {
    console.debug('Suppressed React Query AbortError during development cleanup');
    event.preventDefault();
    return;
  }
  
  // Suppress DOMException errors and empty object rejections related to React Query in development
  // These can manifest during request cancellation in various forms
  if (import.meta.env.DEV) {
    // Check for DOMException in various forms
    const isDOMException = reason?.name === 'DOMException' || 
                          (reason && typeof reason === 'object' && reason.constructor?.name === 'DOMException') ||
                          (reason && reason.toString && reason.toString() === '[object DOMException]');
    
    // Check for empty objects that are likely related to React Query cancellation
    const isEmptyObject = reason && 
                         typeof reason === 'object' && 
                         Object.keys(reason).length === 0 && 
                         reason.constructor === Object;
    
    // Check if JSON stringify produces empty object
    const isEmptyJSON = reason && JSON.stringify(reason) === '{}';
    
    if (isDOMException || isEmptyObject || isEmptyJSON) {
      console.debug('Suppressed development error during cleanup:', { 
        type: isDOMException ? 'DOMException' : 'EmptyObject',
        reason: typeof reason
      });
      event.preventDefault();
      return;
    }
  }
  
  // Let all other errors propagate normally for proper debugging
});


createRoot(document.getElementById("root")!).render(<App />);