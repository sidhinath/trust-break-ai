import React from "react";
import { Mic } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";
import VoiceScanner from "../components/VoiceScanner";

export default function VoiceScannerPage() {
  return (
    <div className="space-y-6">
      <ScannerHeader
        icon={Mic}
        title="Voice & Deepfake Call Scam Detector"
        description="Inspect audio recordings and voicemails for voice cloning, synthesized vocoders, social engineering coercion, and financial traps"
        color="#06b6d4"
      />

      <VoiceScanner />
    </div>
  );
}
