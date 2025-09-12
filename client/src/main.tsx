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


createRoot(document.getElementById("root")!).render(<App />);