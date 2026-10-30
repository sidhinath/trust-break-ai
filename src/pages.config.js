import Home from './pages/Home';
import LinkScanner from './pages/LinkScanner';
import MessageScanner from './pages/MessageScanner';
import Profile from './pages/Profile';
import ReportScam from './pages/ReportScam';
import ScamHeatmap from './pages/ScamHeatmap';
import ScreenshotScanner from './pages/ScreenshotScanner';
import Technology from './pages/Technology';
import PrivacyCenter from './pages/PrivacyCenter';
import VoiceScanner from './pages/VoiceScanner';
import QRScannerPage from './pages/QRScannerPage';
import BrowserShield from './pages/BrowserShield';
import BusinessModel from './pages/BusinessModel';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import CookiePolicy from './pages/CookiePolicy';
import RefundPolicy from './pages/RefundPolicy';
import ScanHub from './pages/ScanHub';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Threats from './pages/Threats';
import Scene from './Scene';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "ScanHub": ScanHub,
    "Threats": Threats,
    "Reports": Reports,
    "Settings": Settings,
    "LinkScanner": LinkScanner,
    "MessageScanner": MessageScanner,
    "ScreenshotScanner": ScreenshotScanner,
    "QRScanner": QRScannerPage,
    "VoiceScanner": VoiceScanner,
    "BrowserShield": BrowserShield,
    "ScamHeatmap": ScamHeatmap,
    "ReportScam": ReportScam,
    "BusinessModel": BusinessModel,
    "Technology": Technology,
    "PrivacyCenter": PrivacyCenter,
    "PrivacyPolicy": PrivacyPolicy,
    "Terms": Terms,
    "CookiePolicy": CookiePolicy,
    "RefundPolicy": RefundPolicy,
    "Profile": Profile,
    "Scene": Scene,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};