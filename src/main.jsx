import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { assertRequiredEnv } from '@/lib/runtime-health'
import { checkForPwaUpdates, registerPwa } from '@/lib/pwaUpdate'

assertRequiredEnv()

// Register before render. The update controller attaches controllerchange and
// performs a single guarded reload when a newly deployed worker takes over.
registerPwa()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Revalidate /sw.js whenever a standalone PWA is resumed from the background.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void checkForPwaUpdates()
})



