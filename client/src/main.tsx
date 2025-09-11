import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global handler for React Query AbortError unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  // Check if this is a React Query cancellation error
  if (event.reason?.name === 'QueryCancellationError' || 
      (event.reason?.name === 'AbortError' && 
       (event.reason?.message?.includes('signal is aborted') || 
        event.reason?.message === 'Query cancelled'))) {
    // Suppress the unhandled rejection warning for query cancellations
    event.preventDefault();
    console.debug('Suppressed React Query cancellation error:', event.reason?.message || 'Query cancelled');
    return;
  }
  
  // Let other unhandled rejections bubble up normally
});

createRoot(document.getElementById("root")!).render(<App />);
