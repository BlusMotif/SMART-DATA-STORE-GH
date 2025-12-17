import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for debugging
window.onerror = function (msg, src, line, col, err) {
  console.error("GLOBAL ERROR:", msg, src, line, col, err);
  return false; // Let the error propagate
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('SW registration failed: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
