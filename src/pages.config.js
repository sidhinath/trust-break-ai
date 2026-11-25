import Home from './pages/Home';
import __Layout from './Layout.jsx';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

// Home is eager-loaded so the initial mobile paint is instant. Every other
// route is code-split with React.lazy + Suspense (see App.jsx) so route
// switching never has to parse the whole app up front.
//
// Imports MUST be written inline (not passed as a variable) so Vite/Rollup can
// statically analyse them and emit real per-route chunks. A dynamic
// `import(variable)` stays unresolved in the production bundle and 404s.
//
// lazyWithRetry retries a failed chunk fetch once, then performs a single
// guarded hard reload — recovering mobile clients that cached the previous
// build manifest after a new Vercel deployment.
export const PAGES = {
    "Home": Home,
    "Threats": lazyWithRetry(() => import('./pages/Threats')),
    "Reports": lazyWithRetry(() => import('./pages/Reports')),
    "Settings": lazyWithRetry(() => import('./pages/Settings')),
    "LinkScanner": lazyWithRetry(() => import('./pages/LinkScanner')),
    "MessageScanner": lazyWithRetry(() => import('./pages/MessageScanner')),
    "ScreenshotScanner": lazyWithRetry(() => import('./pages/ScreenshotScanner')),
    "QRScanner": lazyWithRetry(() => import('./pages/QRScannerPage')),
    "VoiceScanner": lazyWithRetry(() => import('./pages/VoiceScanner')),
    "BrowserShield": lazyWithRetry(() => import('./pages/BrowserShield')),
    "ScamHeatmap": lazyWithRetry(() => import('./pages/ScamHeatmap')),
    "ReportScam": lazyWithRetry(() => import('./pages/ReportScam')),
    "BusinessModel": lazyWithRetry(() => import('./pages/BusinessModel')),
    "Technology": lazyWithRetry(() => import('./pages/Technology')),
    "PrivacyCenter": lazyWithRetry(() => import('./pages/PrivacyCenter')),
    "PrivacyPolicy": lazyWithRetry(() => import('./pages/PrivacyPolicy')),
    "Terms": lazyWithRetry(() => import('./pages/Terms')),
    "CookiePolicy": lazyWithRetry(() => import('./pages/CookiePolicy')),
    "RefundPolicy": lazyWithRetry(() => import('./pages/RefundPolicy')),
    "Profile": lazyWithRetry(() => import('./pages/Profile')),
    "Scene": lazyWithRetry(() => import('./Scene')),
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
