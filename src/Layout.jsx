import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import UserModal from "@/components/auth/UserModal";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { App as CapacitorApp } from "@capacitor/app";
import { triggerHaptic } from "@/lib/haptics";
import { 
  MessageSquareWarning, Link2, Image, Map, AlertTriangle, User, Home, 
  Menu, X, Cpu, Lock, HeartHandshake, Sun, Moon, Mic, QrCode, Shield,
  FileText, Settings, ArrowLeft
} from "lucide-react";
import SeniorModeToggleSwitch from "@/components/SeniorModeToggleSwitch";
import { ConstellationField } from "@/shaders/constellation-field/ConstellationField";

const detectionNav = [
  { name: "Command Center", page: "Home", icon: Home },
  { name: "Universal Scanner", page: "ScanHub", icon: QrCode },
  { name: "Message Scanner", page: "MessageScanner", icon: MessageSquareWarning },
  { name: "Link Inspector", page: "LinkScanner", icon: Link2 },
  { name: "Vision Screenshot", page: "ScreenshotScanner", icon: Image },
  { name: "Voice & Audio Scam", page: "VoiceScanner", icon: Mic },
];

const intelligenceNav = [
  { name: "Threat Radar", page: "ScamHeatmap", icon: Map },
  { name: "Scan History Logs", page: "Reports", icon: FileText },
  { name: "Browser Shield & Ext", page: "BrowserShield", icon: Shield },
  { name: "Report Threat", page: "ReportScam", icon: AlertTriangle },
];

const governanceNav = [
  { name: "Security & Settings", page: "Settings", icon: Settings },
  { name: "Architecture & Technology", page: "Technology", icon: Cpu },
  { name: "Privacy Sovereignty", page: "PrivacyCenter", icon: Lock },
  { name: "Privacy Policy", page: "PrivacyPolicy", icon: Shield },
  { name: "Terms of Service", page: "Terms", icon: FileText },
  { name: "Security Profile", page: "Profile", icon: User },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [familyMode, setFamilyMode] = useState(() => {
    try {
      return document.body.classList.contains("family-safety-mode") || localStorage.getItem("ghostnet_senior_mode") === "true";
    } catch {
      return false;
    }
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncSeniorMode = () => {
      const active = document.body.classList.contains("family-safety-mode") || localStorage.getItem("ghostnet_senior_mode") === "true";
      setFamilyMode(active);
      if (active) {
        document.body.classList.add("family-safety-mode");
      } else {
        document.body.classList.remove("family-safety-mode");
      }
    };
    syncSeniorMode();

    window.addEventListener("ghostnet_senior_mode_change", syncSeniorMode);
    window.addEventListener("storage", syncSeniorMode);
    return () => {
      window.removeEventListener("ghostnet_senior_mode_change", syncSeniorMode);
      window.removeEventListener("storage", syncSeniorMode);
    };
  }, []);

  const toggleFamilyMode = () => {
    const next = !familyMode;
    setFamilyMode(next);
    try {
      localStorage.setItem("ghostnet_senior_mode", next ? "true" : "false");
    } catch {}
    if (next) {
      document.body.classList.add("family-safety-mode");
    } else {
      document.body.classList.remove("family-safety-mode");
    }
    window.dispatchEvent(new Event("ghostnet_senior_mode_change"));
  };

  // Capacitor Android Hardware Back Button Handler & Android Share Sheet App Launch Listener
  useEffect(() => {
    let backListener;
    let urlListener;
    
    const bindCapacitorEvents = async () => {
      try {
        backListener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
          if (location.pathname !== "/" && location.pathname !== "/Home") {
            navigate(-1);
          } else {
            CapacitorApp.minimizeApp();
          }
        });

        urlListener = await CapacitorApp.addListener("appUrlOpen", (data) => {
          const urlStr = data?.url;
          if (urlStr) {
            try {
              const urlObj = new URL(urlStr);
              const sharedText = urlObj.searchParams.get("text") || urlObj.searchParams.get("url") || urlObj.searchParams.get("share_text");
              if (sharedText) {
                const isUrl = /^https?:\/\//i.test(sharedText.trim());
                navigate(createPageUrl("ScanHub"), {
                  state: { activeTab: isUrl ? "url" : "message", sharedContent: sharedText.trim() }
                });
              }
            } catch (e) {
              if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
                navigate(createPageUrl("ScanHub"), { state: { activeTab: "url", sharedContent: urlStr } });
              } else if (urlStr.length > 5) {
                navigate(createPageUrl("ScanHub"), { state: { activeTab: "message", sharedContent: urlStr } });
              }
            }
          }
        });
      } catch (e) {
        // Web fallback
      }
    };
    bindCapacitorEvents();

    return () => {
      if (backListener && backListener.remove) backListener.remove();
      if (urlListener && urlListener.remove) urlListener.remove();
    };
  }, [location.pathname, navigate]);

  // Desktop sidebar toggle state (stored in localStorage)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("ghostnet_sidebar_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem("ghostnet_sidebar_open", JSON.stringify(next));
      return next;
    });
  };

  // Initialize theme from localStorage or default to light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("ghostnet_theme") || "light";
  });

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("ghostnet_theme") || "light";
      setTheme(savedTheme);
      const root = document.documentElement;
      const body = document.body;
      if (savedTheme === "dark") {
        root.classList.add("dark");
        body.classList.add("dark");
        root.classList.remove("light");
        body.classList.remove("light");
      } else {
        root.classList.remove("dark");
        body.classList.remove("dark");
        root.classList.add("light");
        body.classList.add("light");
      }
    };
    syncTheme();

    window.addEventListener("ghostnet_theme_change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("ghostnet_theme_change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = async () => {
    await triggerHaptic('light');
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    const body = document.body;
    if (next === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
      root.classList.remove("light");
      body.classList.remove("light");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
      root.classList.add("light");
      body.classList.add("light");
    }
    localStorage.setItem("ghostnet_theme", next);
    window.dispatchEvent(new Event("ghostnet_theme_change"));
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPageName]);

  const bottomNavItems = [
    { name: "Home", page: "Home", icon: Home },
    { name: "Scan", page: "ScanHub", icon: QrCode },
    { name: "Threats", page: "Threats", icon: Map },
    { name: "Reports", page: "Reports", icon: FileText },
    { name: "Settings", page: "Settings", icon: Settings },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 relative" style={{ background: 'var(--ghost-bg)', color: 'var(--ghost-text)' }}>
        {/* ThreeUI Ambient Living Particle Drift Field */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-25 dark:opacity-35 transition-opacity">
          <ConstellationField
            mode={theme === 'light' ? 'light' : 'dark'}
            speed={0.65}
            size={0.9}
            density={0.75}
            opacity={0.45}
          />
        </div>

        {/* Public Page Header */}
        <header className="sticky top-0 z-40 h-16 border-b backdrop-blur-xl transition-colors duration-300"
          style={{ background: 'var(--ghost-surface)', borderColor: 'var(--ghost-border)' }}>
          <div className="flex items-center justify-between h-full px-4 sm:px-6 max-w-7xl mx-auto w-full">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center justify-center bg-slate-950">
                <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight font-display" style={{ color: 'var(--ghost-text)' }}>
                TrustBreak AI
              </span>
            </Link>

            {/* Center Policy Nav Links */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-bold">
              <Link to="/PrivacyPolicy" className={`transition-colors ${currentPageName === 'PrivacyPolicy' ? 'text-cyan-500 font-extrabold' : 'hover:text-cyan-500'}`} style={{ color: currentPageName === 'PrivacyPolicy' ? undefined : 'var(--ghost-text-dim)' }}>
                Privacy Policy
              </Link>
              <Link to="/Terms" className={`transition-colors ${currentPageName === 'Terms' ? 'text-cyan-500 font-extrabold' : 'hover:text-cyan-500'}`} style={{ color: currentPageName === 'Terms' ? undefined : 'var(--ghost-text-dim)' }}>
                Terms of Service
              </Link>
              <Link to="/CookiePolicy" className={`transition-colors ${currentPageName === 'CookiePolicy' ? 'text-cyan-500 font-extrabold' : 'hover:text-cyan-500'}`} style={{ color: currentPageName === 'CookiePolicy' ? undefined : 'var(--ghost-text-dim)' }}>
                Cookie Policy
              </Link>
              <Link to="/RefundPolicy" className={`transition-colors ${currentPageName === 'RefundPolicy' ? 'text-cyan-500 font-extrabold' : 'hover:text-cyan-500'}`} style={{ color: currentPageName === 'RefundPolicy' ? undefined : 'var(--ghost-text-dim)' }}>
                Refund Policy
              </Link>
              <Link to="/PrivacyCenter" className={`transition-colors ${currentPageName === 'PrivacyCenter' ? 'text-cyan-500 font-extrabold' : 'hover:text-cyan-500'}`} style={{ color: currentPageName === 'PrivacyCenter' ? undefined : 'var(--ghost-text-dim)' }}>
                Data Sovereignty
              </Link>
              <Link to="/BusinessModel" className={`transition-colors ${currentPageName === 'BusinessModel' ? 'text-cyan-500 font-extrabold' : 'hover:text-cyan-500'}`} style={{ color: currentPageName === 'BusinessModel' ? undefined : 'var(--ghost-text-dim)' }}>
                Pricing & Business
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
              </button>

              <SeniorModeToggleSwitch variant="header" />

              <Link
                to="/"
                className="h-9 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-sm transition-all hover:scale-105">
                Sign In / Workspace →
              </Link>
            </div>
          </div>
        </header>

        {/* Main Public Content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full relative z-10">
          {children}

          {/* Footer */}
          <footer className="mt-16 pt-8 pb-12 border-t text-xs space-y-4" style={{ borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-dim)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold font-display text-sm text-cyan-600 dark:text-cyan-400">
                <div className="w-5 h-5 rounded overflow-hidden bg-slate-950 border border-cyan-500/30">
                  <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
                </div>
                TrustBreak AI Cyber Defense Systems
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-[11px]">
                <Link to="/PrivacyPolicy" className="hover:text-cyan-500 transition-colors">Privacy Policy</Link>
                <Link to="/Terms" className="hover:text-cyan-500 transition-colors">Terms of Service</Link>
                <Link to="/CookiePolicy" className="hover:text-cyan-500 transition-colors">Cookie Policy</Link>
                <Link to="/RefundPolicy" className="hover:text-cyan-500 transition-colors">Refund Policy</Link>
                <Link to="/PrivacyCenter" className="hover:text-cyan-500 transition-colors">Data Sovereignty</Link>
                <Link to="/BusinessModel" className="hover:text-cyan-500 transition-colors">Pricing</Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono border-t pt-4" style={{ borderColor: 'var(--ghost-border)' }}>
              <p>© 2026 TrustBreak.ai. India DPDP Act 2023 & GDPR Compliant Data Fiduciary.</p>
              <p>Grievance Officer: dpo@trustbreak.ai | Bengaluru, KA, India</p>
            </div>
          </footer>
        </main>

        <CookieConsentBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 relative"
      style={{ background: 'var(--ghost-bg)', color: 'var(--ghost-text)' }}>
      
      {/* ThreeUI Ambient Living Particle Drift Field */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-25 dark:opacity-35 transition-opacity">
        <ConstellationField
          mode={theme === 'light' ? 'light' : 'dark'}
          speed={0.65}
          size={0.9}
          density={0.75}
          opacity={0.45}
        />
      </div>
      
      {/* Top Command Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b backdrop-blur-xl transition-colors duration-300"
        style={{
          background: 'var(--ghost-surface)',
          borderColor: 'var(--ghost-border)'
        }}>
        <div className="flex items-center justify-between h-full px-3 sm:px-6 max-w-7xl mx-auto w-full">
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* UI Back Button for Secondary Pages */}
            {currentPageName !== "Home" && (
              <button
                type="button"
                onClick={async () => {
                  await triggerHaptic('light');
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate(createPageUrl("Home"));
                  }
                }}
                aria-label="Go Back"
                title="Go Back"
                className="h-9 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-cyan-400 active:scale-95 shrink-0"
                style={{
                  background: 'var(--ghost-surface-2)',
                  borderColor: 'var(--ghost-border)',
                  color: 'var(--ghost-text)'
                }}>
                <ArrowLeft className="w-4 h-4 text-cyan-500 group-hover:-translate-x-0.5 transition-transform pointer-events-none" />
                <span className="text-xs font-bold hidden sm:inline pointer-events-none">Back</span>
              </button>
            )}

            {/* Brand Logo with updated logo-icon.svg asset */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/40 shadow-[0_0_12px_rgba(0,229,255,0.3)] group-hover:scale-105 transition-transform flex items-center justify-center bg-slate-950">
                <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight font-display"
                  style={{ color: 'var(--ghost-text)' }}>
                  TrustBreak AI
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                  PRO DEFENSE
                </span>
              </div>
            </Link>

            {/* Desktop & Tablet Sidebar Open/Close Toggle Button */}
            <button
              type="button"
              onClick={async () => {
                await triggerHaptic('light');
                toggleSidebar();
              }}
              aria-label={sidebarOpen ? "Close Sidebar Navigation" : "Open Sidebar Navigation"}
              title={sidebarOpen ? "Close Sidebar Navigation" : "Open Sidebar Navigation"}
              className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center border transition-all cursor-pointer hover:border-cyan-400 active:scale-95 shrink-0"
              style={{
                background: 'var(--ghost-surface-2)',
                borderColor: 'var(--ghost-border)',
                color: 'var(--ghost-text)'
              }}>
              <Menu className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform pointer-events-none" />
            </button>
          </div>

          {/* Right Header Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer hover:border-cyan-400 active:scale-95 shrink-0"
              style={{
                background: 'var(--ghost-surface-2)',
                borderColor: 'var(--ghost-border)',
                color: 'var(--ghost-text)'
              }}>
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 pointer-events-none" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600 pointer-events-none" />
              )}
            </button>

            {/* Senior Safety Mode Physical Toggle Switch */}
            <SeniorModeToggleSwitch variant="header" />

            {/* Operator Email Badge */}
            {user?.email && (
              <span className="hidden lg:inline-flex text-xs font-mono font-medium px-2.5 py-1 rounded-full border max-w-[170px] truncate"
                style={{
                  background: 'var(--ghost-surface-2)',
                  borderColor: 'var(--ghost-border)',
                  color: 'var(--ghost-text-dim)'
                }}>
                {user.email}
              </span>
            )}

            {/* User Details Icon (Opens User Login Modal) */}
            <button
              type="button"
              onClick={async () => {
                await triggerHaptic('light');
                setShowUserModal(true);
              }}
              title="Click to view User Login Details & Operator Session"
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:border-cyan-400 group relative cursor-pointer active:scale-95 shrink-0"
              style={{
                background: 'var(--ghost-surface-2)',
                borderColor: 'var(--ghost-border)'
              }}>
              <User className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform pointer-events-none" />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse pointer-events-none" />
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={async () => {
                await triggerHaptic('light');
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center border cursor-pointer active:scale-95 shrink-0"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              style={{
                background: 'var(--ghost-surface-2)',
                borderColor: 'var(--ghost-border)',
                color: 'var(--ghost-text)'
              }}>
              {mobileMenuOpen ? (
                <X className="w-4 h-4 pointer-events-none" />
              ) : (
                <Menu className="w-4 h-4 pointer-events-none" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer with Explicit Close & Senior Mode Controls */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col backdrop-blur-2xl transition-all duration-300"
          style={{ background: theme === 'dark' ? 'rgba(6,11,20,0.98)' : 'rgba(248,250,252,0.98)' }}>
          
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: 'var(--ghost-border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/40 shadow-sm flex items-center justify-center bg-slate-950">
                <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-base font-display" style={{ color: 'var(--ghost-text)' }}>
                TrustBreak AI Navigation
              </span>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:bg-slate-500/20"
              style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)', color: 'var(--ghost-text)' }}>
              <X className="w-5 h-5 text-cyan-400" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Senior Mode Toggle Inside Drawer */}
            <div className="p-3 rounded-2xl border space-y-2" style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold" style={{ color: 'var(--ghost-text)' }}>
                    Senior & Family Safety Mode
                  </span>
                </div>
                <button
                  onClick={toggleFamilyMode}
                  className={`text-[10px] font-mono font-black uppercase px-3 py-1 rounded-full border transition-all ${
                    familyMode
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-700/50 text-slate-300 border-slate-600"
                  }`}>
                  {familyMode ? "ENABLED" : "DISABLED"}
                </button>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--ghost-text-dim)' }}>
                Enlarges touch targets and converts risk analysis into simplified plain English.
              </p>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider px-2 block" style={{ color: 'var(--ghost-text-muted)' }}>
              Detection Suites
            </span>
            {detectionNav.map(item => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30' : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: active ? undefined : 'var(--ghost-text)' }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}

            <span className="text-[10px] font-bold uppercase tracking-wider px-2 pt-2 block" style={{ color: 'var(--ghost-text-muted)' }}>
              Intelligence & Radar
            </span>
            {intelligenceNav.map(item => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30' : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: active ? undefined : 'var(--ghost-text)' }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}

            <span className="text-[10px] font-bold uppercase tracking-wider px-2 pt-2 block" style={{ color: 'var(--ghost-text-muted)' }}>
              Governance & Architecture
            </span>
            {governanceNav.map(item => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30' : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: active ? undefined : 'var(--ghost-text)' }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowUserModal(true);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <User className="w-4 h-4" /> View User Login Details
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Toggleable Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-14 bottom-0 flex-col border-r z-30 py-4 overflow-y-auto no-scrollbar justify-between backdrop-blur-xl transition-all duration-300 ${
        sidebarOpen ? 'w-64 px-3' : 'w-16 px-2'
      }`}
        style={{
          background: 'var(--ghost-surface)',
          borderColor: 'var(--ghost-border)'
        }}>
        
        <nav className="flex flex-col gap-4">
          
          {/* Detection */}
          <div className="space-y-1">
            {sidebarOpen && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 block mb-1"
                style={{ color: 'var(--ghost-text-muted)' }}>
                Detection Suites
              </span>
            )}
            {detectionNav.map(item => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  title={item.name}
                  className={`flex items-center gap-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                    sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'
                  } ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,229,255,0.12)]'
                      : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: active ? undefined : 'var(--ghost-text-dim)' }}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Intelligence & Business */}
          <div className="space-y-1 pt-1">
            {sidebarOpen && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 block mb-1"
                style={{ color: 'var(--ghost-text-muted)' }}>
                Intelligence & Business
              </span>
            )}
            {intelligenceNav.map(item => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  title={item.name}
                  className={`flex items-center gap-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                    sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'
                  } ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,229,255,0.12)]'
                      : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: active ? undefined : 'var(--ghost-text-dim)' }}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Architecture */}
          <div className="space-y-1 pt-1">
            {sidebarOpen && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 block mb-1"
                style={{ color: 'var(--ghost-text-muted)' }}>
                Architecture & Trust
              </span>
            )}
            {governanceNav.map(item => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  title={item.name}
                  className={`flex items-center gap-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                    sidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'
                  } ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,229,255,0.12)]'
                      : 'hover:bg-slate-500/10'
                  }`}
                  style={{ color: active ? undefined : 'var(--ghost-text-dim)' }}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>

        </nav>

        {/* Sidebar Footer Posture Badge */}
        {sidebarOpen ? (
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-1 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Autonomous Defense
              </span>
            </div>
            <p className="text-[11px] leading-normal" style={{ color: 'var(--ghost-text-dim)' }}>
              Groq LPU + Gemini Vision telemetry active
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center p-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 mt-4" title="Autonomous Cyber Defense Active">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
          </div>
        )}
      </aside>

      {/* Main Content Viewport - Dynamically adjusts padding based on sidebar state */}
      <main className={`relative z-10 pt-16 pb-24 md:pb-8 flex-1 w-full overflow-x-hidden transition-all duration-300 ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-16'
      }`}>
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          {children}

          {/* Transparent Legal Footer */}
          <footer className="mt-16 pt-8 pb-12 border-t text-xs space-y-4" style={{ borderColor: 'var(--ghost-border)', color: 'var(--ghost-text-dim)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold font-display text-sm text-cyan-600 dark:text-cyan-400">
                <div className="w-5 h-5 rounded overflow-hidden bg-slate-950 border border-cyan-500/30">
                  <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
                </div>
                TrustBreak AI Cyber Defense Systems
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-[11px]">
                <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-cyan-500 transition-colors">Privacy Policy</Link>
                <Link to={createPageUrl("Terms")} className="hover:text-cyan-500 transition-colors">Terms of Service</Link>
                <Link to={createPageUrl("CookiePolicy")} className="hover:text-cyan-500 transition-colors">Cookie Policy</Link>
                <Link to={createPageUrl("RefundPolicy")} className="hover:text-cyan-500 transition-colors">Refund Policy</Link>
                <Link to={createPageUrl("PrivacyCenter")} className="hover:text-cyan-500 transition-colors">Data Sovereignty</Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono border-t pt-4" style={{ borderColor: 'var(--ghost-border)' }}>
              <p>
                © 2026 TrustBreak.ai. India DPDP Act 2023 & GDPR Compliant Data Fiduciary.
              </p>
              <p>
                Grievance Officer: dpo@trustbreak.ai | Bengaluru, KA, India
              </p>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors duration-300"
        style={{
          background: theme === 'dark' ? 'rgba(6,11,20,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: 'var(--ghost-border)'
        }}>
        <div className="flex items-center justify-around py-2 px-1">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-all ${
                  active ? 'text-cyan-500 font-bold' : 'font-medium'
                }`}
                style={{ color: active ? undefined : 'var(--ghost-text-dim)' }}>
                <Icon className="w-4 h-4" />
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Login Details Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={user}
      />

      {/* Cookie & Storage Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}
