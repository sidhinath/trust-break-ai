import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, CheckCircle2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import SignInModal from '@/components/auth/SignInModal';

export default function OnboardingLanding({ onComplete, onGuest }) {
  const [authModal, setAuthModal] = useState(null); // null | 'signin' | 'signup'

  const handleSignIn = async () => {
    await triggerHaptic('medium');
    setAuthModal('signin');
  };

  const handleSignUp = async () => {
    await triggerHaptic('medium');
    setAuthModal('signup');
  };

  const handleGuest = async () => {
    await triggerHaptic('light');
    if (onGuest) onGuest();
    else if (onComplete) onComplete();
  };

  const handleAuthSuccess = () => {
    setAuthModal(null);
    if (onComplete) onComplete();
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 p-6 relative overflow-hidden select-none font-sans">
        {/* Subtle soft background gradients */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-50/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <header className="pt-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-slate-950">
              <img src="/logo-icon.svg" alt="TrustBreak AI Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-extrabold tracking-tight font-display text-slate-900">
              TrustBreak AI
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            Free Forever
          </span>
        </header>

        {/* Main Hero Content */}
        <main className="my-auto py-8 space-y-6 max-w-md mx-auto w-full relative z-10 text-center">

          {/* Animated Brand Shield */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-72 max-w-[300px] mx-auto rounded-3xl bg-white shadow-[0_20px_40px_rgba(37,99,235,0.12)] border border-slate-200/80 p-3 flex items-center justify-center"
          >
            <img src="/logo-with-text.svg" alt="TrustBreak AI" className="w-full h-auto object-contain rounded-2xl" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="space-y-3"
          >
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display text-slate-900">
              Your Digital Safety Layer
            </h1>
            <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-xs mx-auto">
              AI-powered protection against scams, phishing, and online threats — before you trust, click, or respond.
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-wrap items-center justify-center gap-2 pt-2"
          >
            {['Scan Messages', 'Inspect Links', 'Analyze Screenshots', 'Detect Deepfakes'].map((pill) => (
              <span
                key={pill}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                {pill}
              </span>
            ))}
          </motion.div>
        </main>

        {/* Footer CTAs */}
        <footer className="pb-6 max-w-md mx-auto w-full relative z-10 space-y-3">

          {/* Sign Up — Primary */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignUp}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(37,99,235,0.3)] transition-all"
          >
            <UserPlus className="w-5 h-5" />
            CREATE FREE ACCOUNT
          </motion.button>

          {/* Sign In — Secondary */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignIn}
            className="w-full h-12 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4 text-blue-600" />
            Sign In to Existing Account
          </motion.button>

          {/* Skip / Guest */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            type="button"
            onClick={handleGuest}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors pt-1 flex items-center gap-1.5 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Skip for Now — Browse as Guest
          </motion.button>

          <p className="text-center text-[10px] text-slate-400 pt-1">
            Free forever · No credit card required · GDPR compliant
          </p>
        </footer>
      </div>

      {/* Auth modal triggered by buttons above */}
      <SignInModal
        isOpen={!!authModal}
        initialMode={authModal}
        onClose={() => setAuthModal(null)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
