import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Safe, targeted error suppression for specific devtools issues only
// This only handles the specific "signal is aborted without reason" from eruda.js
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
  
  // Let all other errors (including React Query AbortErrors) propagate normally
  // This preserves proper error handling and debugging capabilities
});

createRoot(document.getElementById("root")!).render(<App />);