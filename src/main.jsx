import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { assertRequiredEnv } from '@/lib/runtime-health'

assertRequiredEnv()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register Service Worker for PWA installability & offline shell
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[TrustBreak SW] Registered with scope:', registration.scope);
      },
      (error) => {
        console.warn('[TrustBreak SW] Registration failed:', error);
      }
    );
  });
}



