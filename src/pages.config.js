import Home from './pages/Home';
import { lazy } from 'react';
import __Layout from './Layout.jsx';

// Home is eager-loaded so the initial mobile paint is instant. Every other
// route is code-split with React.lazy + Suspense (see App.jsx) so route
// switching never has to parse the whole app up front.
const lazyPage = (p) => lazy(() => import(p));

export const PAGES = {
    "Home": Home,
    "Threats": lazyPage('./pages/Threats'),
    "Reports": lazyPage('./pages/Reports'),
    "Settings": lazyPage('./pages/Settings'),
    "LinkScanner": lazyPage('./pages/LinkScanner'),
    "MessageScanner": lazyPage('./pages/MessageScanner'),
    "ScreenshotScanner": lazyPage('./pages/ScreenshotScanner'),
    "QRScanner": lazyPage('./pages/QRScannerPage'),
    "VoiceScanner": lazyPage('./pages/VoiceScanner'),
    "BrowserShield": lazyPage('./pages/BrowserShield'),
    "ScamHeatmap": lazyPage('./pages/ScamHeatmap'),
    "ReportScam": lazyPage('./pages/ReportScam'),
    "BusinessModel": lazyPage('./pages/BusinessModel'),
    "Technology": lazyPage('./pages/Technology'),
    "PrivacyCenter": lazyPage('./pages/PrivacyCenter'),
    "PrivacyPolicy": lazyPage('./pages/PrivacyPolicy'),
    "Terms": lazyPage('./pages/Terms'),
    "CookiePolicy": lazyPage('./pages/CookiePolicy'),
    "RefundPolicy": lazyPage('./pages/RefundPolicy'),
    "Profile": lazyPage('./pages/Profile'),
    "Scene": lazyPage('./Scene'),
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};

