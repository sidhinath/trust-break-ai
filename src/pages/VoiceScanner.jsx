import React from "react";
import { Mic } from "lucide-react";
import ScannerHeader from "../components/scanner/ScannerHeader";
import VoiceScanner from "../components/VoiceScanner";
import ProtectedPage from "@/components/auth/ProtectedPage";

export default function VoiceScannerPage() {
  return (
    <ProtectedPage feature="Voice & Audio Scam Detector">
      <div className="space-y-6">
        <ScannerHeader
          icon={Mic}
          title="Voice & Deepfake Call Scam Detector"
          description="Inspect audio recordings and voicemails for voice cloning, synthesized vocoders, social engineering coercion, and financial traps"
          color="#06b6d4"
        />

        <VoiceScanner />
      </div>
    </ProtectedPage>
  );
}
