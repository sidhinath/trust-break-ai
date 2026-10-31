import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { pagesConfig } from './pages.config'
import { HashRouter, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import AppErrorBoundary from '@/components/AppErrorBoundary'
import OnboardingLanding from '@/components/auth/OnboardingLanding'
import SplashScreen from '@/components/auth/SplashScreen'
import SignInModal from '@/components/auth/SignInModal'

const Router = HashRouter;

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// Inner app — has access to AuthContext
function AppInner() {
  const {
    loading,
    hasSeenOnboarding,
    completeOnboarding,
    continueAsGuest,
    authModalOpen,
    authModalMode,
    closeAuthModal,
  } = useAuth();

  // Show splash while Supabase resolves session
  if (loading) {
    return <SplashScreen />;
  }

  // First-visit onboarding — shown until user signs in, signs up, or skips
  if (!hasSeenOnboarding) {
    return (
      <OnboardingLanding
        onComplete={completeOnboarding}
        onGuest={() => {
          continueAsGuest();
          completeOnboarding();
        }}
      />
    );
  }

  return (
    <>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />

      {/* Global auth modal — opened via useAuth().openSignIn() / openSignUp() from anywhere */}
      <SignInModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={closeAuthModal}
        onSuccess={closeAuthModal}
      />
    </>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

export default App
