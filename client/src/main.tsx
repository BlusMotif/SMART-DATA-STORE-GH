import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker disabled to prevent caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('Unregistered service worker');
      });
    });
  });
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <App />
  );
}
