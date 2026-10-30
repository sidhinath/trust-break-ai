import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { assertRequiredEnv } from '@/lib/runtime-health'

assertRequiredEnv()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
