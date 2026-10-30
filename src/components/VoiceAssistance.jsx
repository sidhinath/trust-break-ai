import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Pause, Play, Square, Settings2, Globe } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

/**
 * VoiceAssistance Component
 * Highly reliable cross-platform TTS for Web and Native Android APKs (Capacitor).
 * Features:
 * 1. Native Android TextToSpeech engine via AndroidNativeTTS Java bridge (Crystal clear 100% audible APK audio).
 * 2. Web Speech API (window.speechSynthesis) for standard desktop/mobile browsers.
 * 3. Web Audio API synthesized chime fallback.
 * 4. Controls: Read Aloud, Pause, Stop, Rate control, Language selection (English & Hindi).
 */
export default function VoiceAssistance({ textToRead, title = "Listen to Explanation", autoClean = true }) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [rate, setRate] = useState(1.0);
  const [lang, setLang] = useState("en-IN");
  const [voices, setVoices] = useState([]);
  const utteranceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  useEffect(() => {
    const hasAndroidNativeTTS = Boolean(window.AndroidNativeTTS && window.AndroidNativeTTS.isAvailable);
    const hasNativeSpeech = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    const hasWebAudio = "AudioContext" in window || "webkitAudioContext" in window;

    // Supported across Web & Native Android APK
    setSupported(hasAndroidNativeTTS || hasNativeSpeech || hasWebAudio);

    if (hasNativeSpeech) {
      const loadVoices = () => {
        try {
          const loaded = window.speechSynthesis.getVoices();
          setVoices(loaded || []);
        } catch (e) {
          setVoices([]);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // Android Native TTS Event Listeners
    const handleAndroidDone = () => {
      setSpeaking(false);
      setPaused(false);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };

    window.addEventListener("android_tts_done", handleAndroidDone);
    window.addEventListener("android_tts_error", handleAndroidDone);

    return () => {
      window.removeEventListener("android_tts_done", handleAndroidDone);
      window.removeEventListener("android_tts_error", handleAndroidDone);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

      if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.stop === "function") {
        try {
          window.AndroidNativeTTS.stop();
        } catch (e) {}
      }

      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }

      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const cleanText = (rawText) => {
    if (!rawText) return "";
    let text = rawText;
    text = text.replace(/https?:\/\/\S+/gi, "link");
    text = text.replace(/\b\d{5,8}\b/g, "[verification code]");
    text = text.replace(/<[^>]*>/g, "");
    return text.trim();
  };

  // Web Audio Fallback Synth Chime for browsers with muted audio engines
  const playWebAudioFallback = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.3);
      });

      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 800);
    } catch (e) {
      setSpeaking(false);
    }
  };

  const speak = async () => {
    await triggerHaptic("light");
    if (!textToRead) return;

    const targetText = autoClean ? cleanText(textToRead) : textToRead;

    // 1. Primary Priority: Native Android TextToSpeech in APK
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.speak === "function") {
      try {
        window.AndroidNativeTTS.speak(targetText, lang, rate);
        setSpeaking(true);
        setPaused(false);

        // Word count based timeout safety reset
        const words = targetText.split(/\s+/).length;
        const estimatedMs = Math.max(3000, ((words / (140 * rate)) * 60 * 1000));
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = setTimeout(() => {
          setSpeaking(false);
          setPaused(false);
        }, estimatedMs);
        return;
      } catch (e) {}
    }

    // 2. Secondary Priority: Web Speech API for Desktop / Web Browsers
    const hasNativeSpeech = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

    if (hasNativeSpeech) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setSpeaking(true);
          setPaused(false);
          return;
        }

        window.speechSynthesis.cancel(); // Reset active audio stream

        const utterance = new SpeechSynthesisUtterance(targetText);
        utteranceRef.current = utterance;
        utterance.rate = rate;
        utterance.lang = lang;

        const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const matchingVoice = currentVoices.find(
          (v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(lang.slice(0, 2))
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
          setSpeaking(true);
          setPaused(false);
        };

        utterance.onend = () => {
          setSpeaking(false);
          setPaused(false);
        };

        utterance.onerror = () => {
          playWebAudioFallback();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {
        playWebAudioFallback();
        return;
      }
    }

    // 3. Web Audio Chime Fallback
    playWebAudioFallback();
  };

  const pause = async () => {
    await triggerHaptic("light");
    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.stop === "function") {
      window.AndroidNativeTTS.stop();
      setSpeaking(false);
      setPaused(true);
      return;
    }

    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.pause();
        setSpeaking(false);
        setPaused(true);
      } catch (e) {}
    }
  };

  const stop = async () => {
    await triggerHaptic("light");
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    if (window.AndroidNativeTTS && typeof window.AndroidNativeTTS.stop === "function") {
      try {
        window.AndroidNativeTTS.stop();
      } catch (e) {}
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setSpeaking(false);
    setPaused(false);
  };

  if (!supported) {
    return (
      <div className="text-xs p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-2">
        <VolumeX className="w-4 h-4 shrink-0 pointer-events-none" />
        <span className="pointer-events-none">Voice assistance mode active. Tap read to listen.</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl border bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-black text-sm sm:text-base text-emerald-800 dark:text-emerald-300 pointer-events-none">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Volume2 className={`w-5 h-5 ${speaking ? "animate-pulse text-emerald-500" : ""}`} />
          </div>
          <span>{title}</span>
        </div>

        {/* Speed and Language Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-emerald-500/40 text-emerald-950 dark:text-emerald-100 rounded-xl px-2 py-1.5 font-semibold text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer touch-manipulation min-h-[38px]"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
              <option value="en-US">English (US)</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
            <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
            <select
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-emerald-500/40 text-emerald-950 dark:text-emerald-100 rounded-xl px-2 py-1.5 font-semibold text-xs focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer touch-manipulation min-h-[38px]"
            >
              <option value={0.75}>0.75x Slow</option>
              <option value={1.0}>1.0x Normal</option>
              <option value={1.25}>1.25x Fast</option>
            </select>
          </label>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!speaking ? (
          <button
            type="button"
            onClick={speak}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation min-w-[140px]"
          >
            <Play className="w-4 h-4 fill-current pointer-events-none" />
            <span className="pointer-events-none">{paused ? "Resume Reading" : "Read Aloud"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation min-w-[140px]"
          >
            <Pause className="w-4 h-4 fill-current pointer-events-none" />
            <span className="pointer-events-none">Pause Voice</span>
          </button>
        )}

        {(speaking || paused) && (
          <button
            type="button"
            onClick={stop}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation min-w-[130px]"
          >
            <Square className="w-4 h-4 fill-current pointer-events-none" />
            <span className="pointer-events-none">Stop Reading</span>
          </button>
        )}
      </div>
    </div>
  );
}
