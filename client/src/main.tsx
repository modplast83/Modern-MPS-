import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe, targeted error suppression for specific development issues only
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  
  // Only suppress very specific eruda.js devtools errors that don't affect functionality
  if (reason?.name === 'AbortError' && 
      reason?.message === 'signal is aborted without reason' &&
      (reason?.stack?.includes('eruda.js') || reason?.stack?.includes('eruda.min.js'))) {
    event.preventDefault();
    return;
  }
  
  // Handle DOMException errors that originate specifically from eruda.js devtools
  if (reason?.name === 'DOMException' &&
      (reason?.stack?.includes('eruda.js') || reason?.stack?.includes('eruda.min.js'))) {
    event.preventDefault();
    return;
  }
  
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
  
  // Let all other errors propagate normally for proper debugging
});

// DEBUG: Instrument fetch to catch /api requests in development
if (import.meta.env.DEV) {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    const resolvedUrl = new URL(url, location.href);
    
    if (resolvedUrl.pathname === '/api') {
      console.error('🚨 FOUND IT! Fetch request to /api detected:', {
        url,
        resolvedUrl: resolvedUrl.href,
        stack: new Error().stack,
        input,
        init
      });
      debugger; // This will pause execution so we can examine the call stack
    }
    
    return originalFetch.apply(this, arguments as any);
  };
  
  console.log('🔍 Fetch instrumentation active - will catch /api requests');
}

createRoot(document.getElementById("root")!).render(<App />);