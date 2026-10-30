import React, { useRef, useState, useEffect, useCallback } from "react";
import { QrCode, Camera, Upload, X, AlertCircle, RefreshCw, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * QRScanner — Feature 5
 *
 * Supports:
 * 1. Live camera scanning via navigator.mediaDevices.getUserMedia + jsQR
 * 2. Uploaded image decoding via HTMLCanvasElement + jsQR
 * Calls onDecoded(payload) on detection, onError(message) on failure.
 */
export default function QRScanner({ onDecoded, onError }) {
  const [mode, setMode] = useState("camera"); // "camera" | "upload"
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [preview, setPreview] = useState(null);
  const [decoding, setDecoding] = useState(false);
  const [localError, setLocalError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fileRef = useRef(null);
  const isScanningRef = useRef(false);

  // Stop camera tracks and scanning loop
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Scan frame from video element using jsQR
  const scanFrame = useCallback(async (jsQR) => {
    if (!isScanningRef.current || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            // QR code detected!
            stopCamera();
            onDecoded?.(code.data);
            return;
          }
        } catch {
          // Frame read error, continue scanning
        }
      }
    }

    if (isScanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR));
    }
  }, [onDecoded, stopCamera]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError("");
    setLocalError("");
    stopCamera();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser environment. Please upload an image instead.");
      return;
    }

    try {
      const { default: jsQR } = await import("jsqr");

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // critical for iOS
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        animationFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR));
      }
    } catch (err) {
      console.warn("Camera init failed:", err);
      stopCamera();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in browser settings or upload an image.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on this system. Please use the Upload Image option.");
      } else {
        setCameraError(`Unable to start camera: ${err.message || "Unknown error"}. You can upload an image instead.`);
      }
    }
  }, [scanFrame, stopCamera]);

  // Handle mode switch
  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera]);

  // File upload decoder
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLocalError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLocalError("Image exceeds 10MB limit.");
      return;
    }

    setLocalError("");
    setPreview(URL.createObjectURL(file));
    setDecoding(true);

    try {
      const { default: jsQR } = await import("jsqr");

      const img = new Image();
      img.src = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Image could not be loaded"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (!code || !code.data) {
        const msg = "No QR code detected in this image. Please try a clearer photo.";
        setLocalError(msg);
        onError?.(msg);
      } else {
        onDecoded?.(code.data);
      }
    } catch (err) {
      const msg = `QR decode failed: ${err?.message || "Unknown error"}`;
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setDecoding(false);
    }
  };

  const clearUpload = () => {
    setPreview(null);
    setLocalError("");
    setDecoding(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Mode Switch Tabs */}
      <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--ghost-border)" }}>
        <button
          type="button"
          onClick={() => { setMode("camera"); setLocalError(""); }}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            mode === "camera"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "hover:bg-violet-500/10 text-slate-400"
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Live Camera
        </button>

        <button
          type="button"
          onClick={() => { setMode("upload"); setCameraError(""); }}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            mode === "upload"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
              : "hover:bg-violet-500/10 text-slate-400"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Image
        </button>
      </div>

      {/* Mode 1: Camera Scanner */}
      {mode === "camera" && (
        <div className="space-y-3">
          <div
            className="relative rounded-2xl overflow-hidden border bg-black aspect-video sm:aspect-[4/3] max-h-[380px] mx-auto flex items-center justify-center"
            style={{ borderColor: "var(--ghost-border)" }}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />

            {/* Viewfinder Target & Scanner Line Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 border-2 border-violet-400/80 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-violet-400" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-violet-400" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-violet-400" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-violet-400" />

                  {/* Animated laser scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-[11px] font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-violet-200 border border-violet-500/30">
                    Align QR code within viewfinder
                  </span>
                </div>
              </div>
            )}

            {!cameraActive && !cameraError && (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <span className="text-xs">Initializing camera feed...</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              {cameraActive ? "Live camera active · Scanning continuously" : "Camera inactive"}
            </span>

            {cameraActive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="gap-1.5 text-xs text-rose-400 hover:text-rose-300"
              >
                <StopCircle className="w-3.5 h-3.5" /> Stop Camera
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="gap-1.5 text-xs text-violet-400 hover:text-violet-300"
              >
                <Camera className="w-3.5 h-3.5" /> Start Camera
              </Button>
            )}
          </div>

          {cameraError && (
            <div className="ghost-card p-4 border-rose-500/30 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <span className="text-xs font-medium" style={{ color: "var(--ghost-text-dim)" }}>
                  {cameraError}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="text-xs shrink-0"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: File Upload */}
      {mode === "upload" && (
        <div className="space-y-3">
          {!preview ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:border-violet-500 hover:bg-violet-500/5 group"
              style={{ borderColor: "var(--ghost-border)", background: "var(--ghost-surface-2)" }}
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 text-violet-400" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-sm font-bold block" style={{ color: "var(--ghost-text)" }}>
                  Upload an image containing a QR code
                </span>
                <span className="text-xs block" style={{ color: "var(--ghost-text-dim)" }}>
                  PNG, JPG, WebP up to 10MB · Auto-decoded + Threat Analysis
                </span>
              </div>
            </button>
          ) : (
            <div
              className="relative rounded-2xl overflow-hidden border p-2"
              style={{ background: "var(--ghost-surface-2)", borderColor: "var(--ghost-border)" }}
            >
              <img
                src={preview}
                alt="QR Preview"
                className="w-full rounded-xl max-h-72 object-contain bg-black/20 mx-auto"
              />
              <button
                type="button"
                onClick={clearUpload}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-rose-500 text-white flex items-center justify-center transition-colors border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          {decoding && (
            <div className="flex items-center gap-2 text-xs text-violet-400 font-medium p-3 rounded-xl border border-violet-500/20 bg-violet-500/10">
              <QrCode className="w-4 h-4 animate-pulse" />
              Decoding QR code image...
            </div>
          )}

          {localError && !decoding && (
            <div className="ghost-card p-4 border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <span className="text-xs font-medium" style={{ color: "var(--ghost-text-dim)" }}>
                {localError}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
