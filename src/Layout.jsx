import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { listScanHistory } from "@/lib/data";
import { useAuth } from "@/lib/AuthContext";
import UserModal from "@/components/auth/UserModal";
import ProfileMenu from "@/components/auth/ProfileMenu";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { App as CapacitorApp } from "@capacitor/app";
import { triggerHaptic } from "@/lib/haptics";
import { 
  MessageSquareWarning, Link2, Image, Map, AlertTriangle, User, Home, 
  Menu, X, Cpu, Lock, HeartHandshake, Sun, Moon, Mic, QrCode, Shield,
  FileText, Settings, ArrowLeft, UserPlus
} from "lucide-react";
import SeniorModeToggleSwitch from "@/components/SeniorModeToggleSwitch";
import { ConstellationField } from "@/shaders/constellation-field/ConstellationField";

const detectionNav = [
  { name: "Command Center", page: "Home", icon: Home },
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

// Pages that require a signed-in Supabase account. Keep this in sync with the
// pages wrapped in <ProtectedPage>. Guests are intercepted here and prompted
// before they navigate; direct URL access is still blocked by ProtectedPage.
const PROTECTED_ROUTES = {
  MessageScanner: "Message Scanner",
  LinkScanner: "Link Inspector",
  ScreenshotScanner: "Vision Screenshot Scanner",
  QRScanner: "QR Code Inspector",
  VoiceScanner: "Voice & Audio Scam Detector",
  BrowserShield: "Browser Shield",
  ScamHeatmap: "Scam Heatmap",
  ReportScam: "Report a Scam",
  Reports: "Scan History Reports",
  Settings: "Security Settings",
  Profile: "Security Profile",
  PrivacyCenter: "Privacy Center",
};

const governanceNav = [
  { name: "Security & Settings", page: "Settings", icon: Settings },
  { name: "Architecture & Technology", page: "Technology", icon: Cpu },
  { name: "Privacy Sovereignty", page: "PrivacyCenter", icon: Lock },
  { name: "Security Profile", page: "Profile", icon: User },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [familyMode, setFamilyMode] = useState(() => {
    try {
      return document.body.classList.contains("family-safety-mode") || localStorage.getItem("trustbreak_senior_mode") === "true";
    } catch {
      return false;
    }
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [policyMenuOpen, setPolicyMenuOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(null); // { feature } | null
  const pendingPageRef = useRef(null);
  const { user, isAuthenticated, openSignIn, openSignUp, signOut } = useAuth();
  const { data: sidebarScans = [] } = useQuery({
    queryKey: ["scanHistory"],
    queryFn: () => listScanHistory(20),
    enabled: isAuthenticated,
  });

  // Helper: get avatar initials
  const getInitials = (u) => {
    const name = u?.user_metadata?.full_name || u?.email || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return '?';
  };
  const navigate = useNavigate();
  const location = useLocation();

  // ── Protected-route gate ───────────────────────────────────────────────────
  // Guests can browse public pages freely. When they click a link that points
  // at a protected route we intercept it (capture phase, before react-router
  // handles the click) and show the login prompt. After a successful sign-in
  // the pending destination is resumed automatically.
  const handleProtectedLinkClick = (event) => {
    if (isAuthenticated) return;
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor) return;

    const href = anchor.getAttribute("href") || "";
    const match = href.match(/^#\/?([^/?#]+)/);
    if (!match) return;

    const page = decodeURIComponent(match[1]);
    const feature = PROTECTED_ROUTES[page];
    if (!feature) return;

    event.preventDefault();
    event.stopPropagation();
    setMobileMenuOpen(false);
    setPolicyMenuOpen(false);
    pendingPageRef.current = page;
    setLoginPrompt({ feature });
  };

  useEffect(() => {
    if (!isAuthenticated || !pendingPageRef.current) return;
    const pendingPage = pendingPageRef.current;
    pendingPageRef.current = null;
    setLoginPrompt(null);
    navigate(createPageUrl(pendingPage));
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const syncSeniorMode = () => {
      const active = document.body.classList.contains("family-safety-mode") || localStorage.getItem("trustbreak_senior_mode") === "true";
      setFamilyMode(active);
      if (active) {
        document.body.classList.add("family-safety-mode");
      } else {
        document.body.classList.remove("family-safety-mode");
      }
    };
    syncSeniorMode();

    window.addEventListener("trustbreak_senior_mode_change", syncSeniorMode);
    window.addEventListener("storage", syncSeniorMode);
    return () => {
      window.removeEventListener("trustbreak_senior_mode_change", syncSeniorMode);
      window.removeEventListener("storage", syncSeniorMode);
    };
  }, []);

  const toggleFamilyMode = () => {
    const next = !familyMode;
    setFamilyMode(next);
    try {
      localStorage.setItem("trustbreak_senior_mode", next ? "true" : "false");
    } catch {}
    if (next) {
      document.body.classList.add("family-safety-mode");
    } else {
      document.body.classList.remove("family-safety-mode");
    }
    window.dispatchEvent(new Event("trustbreak_senior_mode_change"));
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
                navigate(createPageUrl(isUrl ? "LinkScanner" : "MessageScanner"), {
                  state: { sharedContent: sharedText.trim() }
                });
              }
            } catch (e) {
              if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
                navigate(createPageUrl("LinkScanner"), { state: { sharedContent: urlStr } });
              } else if (urlStr.length > 5) {
                navigate(createPageUrl("MessageScanner"), { state: { sharedContent: urlStr } });
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
    const saved = localStorage.getItem("trustbreak_sidebar_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem("trustbreak_sidebar_open", JSON.stringify(next));
      return next;
    });
  };

  const handleExitCurrentTab = () => {
    triggerHaptic('light').catch(() => {});
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(createPageUrl("Home"));
  };

  // Initialize theme from localStorage or default to light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("trustbreak_theme") || "light";
  });

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme = localStorage.getItem("trustbreak_theme") || "light";
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

    window.addEventListener("trustbreak_theme_change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("trustbreak_theme_change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    triggerHaptic('light').catch(() => {});
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
    localStorage.setItem("trustbreak_theme", next);
    window.dispatchEvent(new Event("trustbreak_theme_change"));
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPageName]);

  const bottomNavItems = [
    { name: "Home", page: "Home", icon: Home },
    { name: "Scan", page: "MessageScanner", icon: MessageSquareWarning },
    { name: "Threats", page: "Threats", icon: Map },
    { name: "Reports", page: "Reports", icon: FileText },
    { name: "Settings", page: "Settings", icon: Settings },
  ];

  const securityToolLinks = [
    { label: "Scan Message", page: "MessageScanner", icon: MessageSquareWarning },
    { label: "Scan Link / URL", page: "LinkScanner", icon: Link2 },
    { label: "Scan Screenshot", page: "ScreenshotScanner", icon: Image },
    { label: "QR Code Inspector", page: "QRScanner", icon: QrCode },
    { label: "Voice & Audio Scam", page: "VoiceScanner", icon: Mic },
    { label: "Browser Shield & Ext", page: "BrowserShield", icon: Shield },
    { label: "Threat Intelligence", page: "ScamHeatmap", icon: Map },
    { label: "Report Scam Threat", page: "ReportScam", icon: AlertTriangle },
  ];

  const policyLinks = [
    { label: "Privacy Policy", page: "PrivacyPolicy" },
    { label: "Terms of Service", page: "Terms" },
    { label: "Cookie Policy", page: "CookiePolicy" },
    { label: "Refund Policy", page: "RefundPolicy" },
    { label: "Data Sovereignty", page: "PrivacyCenter" },
    { label: "Pricing & Business", page: "BusinessModel" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 relative" onClickCapture={handleProtectedLinkClick} style={{ background: 'var(--tb-bg)', color: 'var(--tb-text)' }}>
        {/* ThreeUI Ambient Living Particle Drift Field */}
        <div className="fixed inset-0 pointer-events-none tb-decorative z-0 overflow-hidden opacity-25 dark:opacity-35 transition-opacity">
          <ConstellationField
            mode={theme === 'light' ? 'light' : 'dark'}
            speed={0.65}
            size={0.9}
            density={0.75}
            opacity={0.45}
          />
        </div>

        {/* Public Page Header */}
        <header className="tb-header sticky top-0 z-50 h-16 border-b backdrop-blur-xl transition-colors duration-300"
          style={{ background: 'var(--tb-surface)', borderColor: 'var(--tb-border)' }}>
          <div className="flex items-center justify-between gap-1 sm:gap-3 h-full px-2 sm:px-6 max-w-7xl mx-auto w-full">
            {currentPageName !== "Home" && (
              <button
                type="button"
                onClick={handleExitCurrentTab}
                className="mr-1 sm:mr-2 h-8 w-8 sm:w-auto shrink-0 rounded-lg border px-0 sm:px-2.5 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.14em] touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:border-emerald-400 hover:text-emerald-400"
                style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text-dim)' }}
              >
                <X className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            )}

            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
              <Link to="/" className="touch-manipulation tb-touch-target flex items-center gap-1 sm:gap-2.5 min-w-0 group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-lg overflow-hidden border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center bg-slate-950">
                  <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-[13px] sm:text-lg font-black tracking-tight font-display whitespace-nowrap shrink-0" style={{ color: 'var(--tb-text)' }}>
                  TrustBreak AI
                </span>
              </Link>

              <div className="relative hidden lg:block">
                <button
                  type="button"
                  aria-label="Open policy menu"
                  onClick={() => setPolicyMenuOpen((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:border-emerald-400"
                  style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text)' }}
                >
                  <div className="flex flex-col items-center justify-center gap-[3px]">
                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                  </div>
                </button>

                {policyMenuOpen && (
                  <div className="absolute left-0 top-12 z-50 min-w-[260px] rounded-2xl border p-2 shadow-2xl backdrop-blur-xl"
                    style={{ background: 'var(--tb-surface)', borderColor: 'var(--tb-border)' }}>
                    <div className="mb-2 px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--tb-text-dim)' }}>
                      Security Scanners & Tools
                    </div>
                    <div className="grid gap-1">
                      {securityToolLinks.map(({ label, page, icon: Icon }) => (
                        <Link
                          key={page}
                          to={createPageUrl(page)}
                          onClick={() => setPolicyMenuOpen(false)}
                          className={`flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] rounded-xl px-3 py-2 text-left text-xs font-bold transition-transform duration-75 active:scale-95 ${currentPageName === page ? 'text-emerald-500' : 'hover:text-emerald-500'}`}
                          style={{ color: currentPageName === page ? 'var(--tb-text)' : 'var(--tb-text-dim)' }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="my-2 h-px w-full" style={{ background: 'var(--tb-border)' }} />
                    <div className="grid gap-1">
                      {policyLinks.map(({ label, page }) => (
                        <Link
                          key={page}
                          to={createPageUrl(page)}
                          onClick={() => setPolicyMenuOpen(false)}
                          className={`touch-manipulation min-h-[44px] min-w-[44px] rounded-xl px-3 py-2 text-left text-xs font-bold transition-transform duration-75 active:scale-95 ${currentPageName === page ? 'text-emerald-500' : 'hover:text-emerald-500'}`}
                          style={{ color: currentPageName === page ? 'var(--tb-text)' : 'var(--tb-text-dim)' }}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="w-6 h-8 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 shrink-0"
                style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text)' }}>
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />}
              </button>

              <SeniorModeToggleSwitch variant="header" />

              {isAuthenticated ? (
                /* Authenticated — show profile pill + dropdown menu */
                <ProfileMenu
                  user={user}
                  onOpenModal={() => setShowUserModal(true)}
                  onSignOut={signOut}
                  labelMode="name"
                  currentPageName={currentPageName}
                />
              ) : (
                /* Guest — show Sign In + Sign Up */
                <div className="relative z-50 flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light').catch(() => {}); openSignIn(); }}
                    className="tb-auth-button relative z-50 h-8 sm:h-9 px-1 sm:px-3 rounded-lg sm:rounded-xl text-[13px] sm:text-sm font-bold border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:border-emerald-400 hover:text-emerald-300 shrink-0 cursor-pointer"
                    style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text-dim)', touchAction: 'manipulation' }}
                  >
                    <span className="pointer-events-none">Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light').catch(() => {}); openSignUp(); }}
                    style={{ touchAction: 'manipulation' }}
                    className="tb-auth-button relative z-50 h-8 sm:h-9 px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-[13px] sm:text-sm font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-slate-950 shadow-sm touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:brightness-110 shrink-0 cursor-pointer"
                  >
                    <span className="pointer-events-none">Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Public Content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full relative z-10">
          {children}

          {/* Footer */}
          <footer className="mt-16 pt-8 pb-12 border-t text-xs space-y-4" style={{ borderColor: 'var(--tb-border)', color: 'var(--tb-text-dim)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold font-display text-sm text-emerald-600 dark:text-emerald-400">
                <div className="w-5 h-5 rounded overflow-hidden bg-slate-950 border border-emerald-500/30">
                  <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
                </div>
                TrustBreak AI Cyber Defense Systems
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-[11px]">
                <Link to="/PrivacyPolicy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
                <Link to="/Terms" className="hover:text-emerald-500 transition-colors">Terms of Service</Link>
                <Link to="/CookiePolicy" className="hover:text-emerald-500 transition-colors">Cookie Policy</Link>
                <Link to="/PrivacyCenter" className="hover:text-emerald-500 transition-colors">Data Sovereignty</Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono border-t pt-4" style={{ borderColor: 'var(--tb-border)' }}>
              <p>© 2026 TrustBreak AI · Built for Digital Safety &amp; Privacy (DPDP Act 2023 Aligned)</p>
              <p>Security &amp; Privacy Contact: support@trustbreak.ai | Greater Noida, UP, India</p>
            </div>
          </footer>
        </main>

        <CookieConsentBanner />

        <UserModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          user={user}
        />

        <LoginRequiredModal
          isOpen={!!loginPrompt}
          feature={loginPrompt?.feature}
          onClose={() => {
            pendingPageRef.current = null;
            setLoginPrompt(null);
          }}
          onSignIn={() => {
            setLoginPrompt(null);
            openSignIn();
          }}
          onSignUp={() => {
            setLoginPrompt(null);
            openSignUp();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 relative" onClickCapture={handleProtectedLinkClick}
      style={{ background: 'var(--tb-bg)', color: 'var(--tb-text)' }}>
      
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
      <header className="tb-header fixed top-0 left-0 right-0 z-50 h-14 border-b backdrop-blur-xl transition-colors duration-300"
        style={{
          background: 'var(--tb-surface)',
          borderColor: 'var(--tb-border)'
        }}>
        <div className="flex items-center justify-between gap-1 sm:gap-3 h-full px-2 sm:px-6 max-w-7xl mx-auto w-full">
          
          <div className="flex items-center gap-1 sm:gap-3 min-w-0">
            {/* UI Back Button for Secondary Pages */}
            {currentPageName !== "Home" && (
              <button
                type="button"
                onClick={handleExitCurrentTab}
                aria-label="Go Back"
                title="Go Back"
                className="relative z-50 h-8 w-8 sm:h-9 sm:w-auto sm:px-2.5 rounded-lg sm:rounded-xl border flex items-center justify-center gap-1 sm:gap-1.5 touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 cursor-pointer hover:border-emerald-400 shrink-0"
                style={{
                  background: 'var(--tb-surface-2)',
                  borderColor: 'var(--tb-border)',
                  color: 'var(--tb-text)',
                  touchAction: 'manipulation',
                }}>
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 group-hover:-translate-x-0.5 transition-transform pointer-events-none" />
                <span className="text-xs font-bold hidden sm:inline pointer-events-none">Back</span>
              </button>
            )}

            {/* Brand Logo with updated logo-icon.svg asset */}
            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
              <Link to={createPageUrl("Home")} className="flex items-center gap-1 sm:gap-2.5 min-w-0 group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-lg overflow-hidden border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform flex items-center justify-center bg-slate-950">
                  <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] sm:text-lg font-black tracking-tight font-display whitespace-nowrap shrink-0"
                    style={{ color: 'var(--tb-text)' }}>
                    TrustBreak AI
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    PRO DEFENSE
                  </span>
                </div>
              </Link>

              {/* Desktop & Tablet Sidebar Open/Close Toggle Button placed beside the brand */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light').catch(() => {});
                  toggleSidebar();
                }}
                aria-label={sidebarOpen ? "Close Sidebar Navigation" : "Open Sidebar Navigation"}
                title={sidebarOpen ? "Close Sidebar Navigation" : "Open Sidebar Navigation"}
                className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 cursor-pointer hover:border-emerald-400 shrink-0"
                style={{
                  background: 'var(--tb-surface-2)',
                  borderColor: 'var(--tb-border)',
                  color: 'var(--tb-text)'
                }}>
                <Menu className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform pointer-events-none" />
              </button>
            </div>
          </div>

          {/* Right Header Utility Controls */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            
            {/* Theme Toggle Button — moves into the mobile drawer below 400px */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="hidden min-[400px]:flex w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl items-center justify-center border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 cursor-pointer hover:border-emerald-400 shrink-0"
              style={{
                background: 'var(--tb-surface-2)',
                borderColor: 'var(--tb-border)',
                color: 'var(--tb-text)'
              }}>
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 pointer-events-none" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 pointer-events-none" />
              )}
            </button>

            {/* Senior Safety Mode Physical Toggle Switch — also in the mobile drawer */}
            <SeniorModeToggleSwitch variant="header" className="max-[399px]:hidden" />

            {/* Auth controls — authenticated or guest */}
            {isAuthenticated ? (
              /* Authenticated: profile pill + dropdown menu */
              <ProfileMenu
                user={user}
                onOpenModal={() => setShowUserModal(true)}
                onSignOut={signOut}
                labelMode="email"
                currentPageName={currentPageName}
              />
            ) : (
              /* Guest: Sign In + Sign Up buttons */
              <div className="relative z-50 flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light').catch(() => {}); openSignIn(); }}
                  className="tb-auth-button relative z-50 h-8 sm:h-9 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[13px] sm:text-sm font-bold border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:border-emerald-400 hover:text-emerald-300 shrink-0 cursor-pointer"
                  style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text-dim)', touchAction: 'manipulation' }}
                >
                  <span className="pointer-events-none">Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light').catch(() => {}); openSignUp(); }}
                  style={{ touchAction: 'manipulation' }}
                  className="tb-auth-button relative z-50 h-8 sm:h-9 px-2 sm:px-3.5 rounded-lg sm:rounded-xl text-[13px] sm:text-sm font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-slate-950 shadow-sm touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:brightness-110 shrink-0 cursor-pointer"
                >
                  <span className="pointer-events-none">Sign Up</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light').catch(() => {});
                setMobileMenuOpen((prev) => !prev);
              }}
              className="relative z-50 md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 shrink-0 cursor-pointer"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              style={{
                background: 'var(--tb-surface-2)',
                borderColor: 'var(--tb-border)',
                color: 'var(--tb-text)',
                touchAction: 'manipulation',
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
        <div className="fixed inset-0 z-[60] md:hidden flex flex-col backdrop-blur-2xl transition-all duration-300"
          style={{ background: theme === 'dark' ? 'rgba(6,11,20,0.98)' : 'rgba(248,250,252,0.98)' }}>
          
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: 'var(--tb-border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 shadow-sm flex items-center justify-center bg-slate-950">
                <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-base font-display" style={{ color: 'var(--tb-text)' }}>
                TrustBreak AI Navigation
              </span>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 rounded-xl border flex items-center justify-center touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 hover:bg-slate-500/20"
              style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text)' }}>
              <X className="w-5 h-5 text-emerald-400" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Senior Mode Toggle Inside Drawer */}
            <div className="p-3 rounded-2xl border space-y-2" style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold" style={{ color: 'var(--tb-text)' }}>
                    Senior & Family Safety Mode
                  </span>
                </div>
                <button
                  onClick={toggleFamilyMode}
                  className={`text-[10px] font-mono font-black uppercase px-3 py-1 rounded-full border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 ${
                    familyMode
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-700/50 text-slate-300 border-slate-600"
                  }`}>
                  {familyMode ? "ENABLED" : "DISABLED"}
                </button>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--tb-text-dim)' }}>
                Enlarges touch targets and converts risk analysis into simplified plain English.
              </p>
            </div>

            {/* Appearance toggle — header icon is hidden on screens below 400px */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95"
              style={{ background: 'var(--tb-surface-2)', borderColor: 'var(--tb-border)', color: 'var(--tb-text)' }}
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-emerald-500" />
                )}
                Appearance
              </span>
              <span className="text-[10px] font-mono font-black tracking-wider" style={{ color: 'var(--tb-text-dim)' }}>
                {theme === 'dark' ? 'DARK' : 'LIGHT'}
              </span>
            </button>

            <span className="font-display text-[13px] font-bold uppercase tracking-wider px-2 block mt-6 mb-2 text-emerald-400">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 ${active ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'hover:bg-slate-500/10'}`}
                  style={{ color: active ? undefined : 'var(--tb-text)' }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}

            <span className="font-display text-[13px] font-bold uppercase tracking-wider px-2 block mt-6 mb-2 text-emerald-400">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 ${active ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'hover:bg-slate-500/10'}`}
                  style={{ color: active ? undefined : 'var(--tb-text)' }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}

            <span className="font-display text-[13px] font-bold uppercase tracking-wider px-2 block mt-6 mb-2 text-emerald-400">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 ${active ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'hover:bg-slate-500/10'}`}
                  style={{ color: active ? undefined : 'var(--tb-text)' }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.name}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <button
                onClick={() => { setMobileMenuOpen(false); setShowUserModal(true); }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-[9px] font-black text-slate-950">
                  {getInitials(user)}
                </div>
                View Account Details
              </button>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); openSignIn(); }}
                  className="tb-auth-button flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-bold text-xs touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 border border-slate-600 bg-slate-800 text-slate-200 hover:border-emerald-400"
                >
                  <User className="w-3.5 h-3.5" /> Sign In
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); openSignUp(); }}
                  className="tb-auth-button flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-bold text-xs touch-manipulation min-h-[44px] min-w-[44px] transition-transform duration-75 active:scale-95 bg-gradient-to-r from-emerald-400 to-blue-500 text-slate-950"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Desktop Toggleable Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-14 bottom-0 flex-col bg-white dark:bg-[#070c16] border-r border-slate-200 dark:border-slate-800 z-30 py-3 overflow-y-auto no-scrollbar justify-between backdrop-blur-xl transition-transform duration-300 ${
          sidebarOpen ? "w-72 2xl:w-80 px-3" : "w-16 px-2"
        }`}
      >
        <nav className="flex flex-col gap-3">
          {[
            { title: "DETECTION SUITES", items: detectionNav },
            { title: "INTELLIGENCE & BUSINESS", items: intelligenceNav },
            { title: "ARCHITECTURE & TRUST", items: governanceNav },
          ].map((section, sectionIdx) => (
            <div key={section.title} className={`space-y-0.5 ${sectionIdx > 0 ? "pt-1" : ""}`}>
              {sidebarOpen && (
                <span
                  className={`font-display text-[11px] font-bold uppercase tracking-wider px-3 block ${
                    sectionIdx === 0 ? "mt-1" : "mt-2.5"
                  } mb-1.5 text-emerald-600 dark:text-emerald-400`}
                >
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = currentPageName === item.page;
                const isHistory = item.page === "Reports";
                const isBrowserShield = item.page === "BrowserShield";

                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    title={item.name}
                    className={`group flex items-center gap-3 py-2 rounded-lg touch-manipulation min-h-[38px] text-[15px] transition-all duration-150 active:scale-[0.98] ${
                      sidebarOpen ? "px-3 justify-between" : "px-0 justify-center"
                    } ${
                      active
                        ? "border-l-[3px] border-emerald-500 dark:border-emerald-400 bg-gradient-to-r from-emerald-500/15 to-transparent font-bold text-slate-950 dark:text-white"
                        : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white hover:translate-x-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                        }`}
                      />
                      {sidebarOpen && <span className="truncate">{item.name}</span>}
                    </div>

                    {sidebarOpen && isHistory && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700/80 shrink-0">
                        {sidebarScans.length}
                      </span>
                    )}

                    {sidebarOpen && isBrowserShield && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Posture Badge & Compact Legal Links */}
        {sidebarOpen ? (
          <div className="mt-4 pt-2 space-y-2.5 shrink-0">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10 space-y-1 shadow-[inset_0_1px_0_rgba(16,185,129,0.12)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Autonomous Defense
                </span>
              </div>
              <p className="text-[12px] leading-snug text-slate-600 dark:text-slate-300">
                Groq LPU + Gemini Vision telemetry active
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-2">
              <Link
                to={createPageUrl("PrivacyPolicy")}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                to={createPageUrl("Terms")}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10 mt-4 shrink-0"
            title="Autonomous Cyber Defense Active"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
          </div>
        )}
      </aside>

      {/* Main Content Viewport - Dynamically adjusts padding based on sidebar state */}
      <main className={`relative z-10 pt-16 pb-24 md:pb-8 flex-1 w-full overflow-x-hidden ${
        sidebarOpen ? 'md:pl-72 2xl:pl-80' : 'md:pl-16'
      }`}>
        <div className="max-w-5xl lg:max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 w-full">
          {children}

          {/* Transparent Legal Footer */}
          <footer className="mt-16 pt-8 pb-12 border-t text-xs space-y-4" style={{ borderColor: 'var(--tb-border)', color: 'var(--tb-text-dim)' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold font-display text-sm text-emerald-600 dark:text-emerald-400">
                <div className="w-5 h-5 rounded overflow-hidden bg-slate-950 border border-emerald-500/30">
                  <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
                </div>
                TrustBreak AI Cyber Defense Systems
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-[11px]">
                <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
                <Link to={createPageUrl("Terms")} className="hover:text-emerald-500 transition-colors">Terms of Service</Link>
                <Link to={createPageUrl("CookiePolicy")} className="hover:text-emerald-500 transition-colors">Cookie Policy</Link>
                <Link to={createPageUrl("PrivacyCenter")} className="hover:text-emerald-500 transition-colors">Data Sovereignty</Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono border-t pt-4" style={{ borderColor: 'var(--tb-border)' }}>
              <p>
                © 2026 TrustBreak AI · Built for Digital Safety &amp; Privacy (DPDP Act 2023 Aligned)
              </p>
              <p>
                Security &amp; Privacy Contact: support@trustbreak.ai | Greater Noida, UP, India
              </p>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors duration-300"
        style={{
          background: theme === 'dark' ? 'rgba(6,11,20,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: 'var(--tb-border)'
        }}>
        <div className="flex items-center justify-around py-2 px-1">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`touch-manipulation min-h-[44px] min-w-[44px] flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-transform duration-75 active:scale-95 ${
                  active ? 'text-emerald-500 font-bold' : 'font-medium'
                }`}
                style={{ color: active ? undefined : 'var(--tb-text-dim)' }}>
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

      {/* Guest → protected route prompt (global auth modal lives in App) */}
      <LoginRequiredModal
        isOpen={!!loginPrompt}
        feature={loginPrompt?.feature}
        onClose={() => {
          pendingPageRef.current = null;
          setLoginPrompt(null);
        }}
        onSignIn={() => {
          setLoginPrompt(null);
          openSignIn();
        }}
        onSignUp={() => {
          setLoginPrompt(null);
          openSignUp();
        }}
      />

      {/* Cookie & Storage Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}


