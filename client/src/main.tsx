import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Targeted error suppression for React Query AbortErrors only
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  
  // In development, suppress only React Query related AbortErrors
  // These are harmless errors that occur during normal component cleanup
  if (import.meta.env.DEV) {
    // Only suppress AbortErrors from React Query with specific stack traces
    if (reason?.name === 'AbortError' && 
        reason?.message === 'signal is aborted without reason' &&
        (reason?.stack?.includes('tanstack_react-query.js') ||
         reason?.stack?.includes('@tanstack_react-query.js'))) {
      console.debug('Suppressed React Query AbortError during development cleanup');
      event.preventDefault();
      return;
    }
  }
  
  // Let all other errors propagate normally for proper debugging
});



createRoot(document.getElementById("root")!).render(<App />);