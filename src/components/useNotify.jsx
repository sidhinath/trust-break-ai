import { useEffect, useCallback } from "react";

export function useNotify() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const notify = useCallback((riskLevel, scanType) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (riskLevel !== "scam" && riskLevel !== "suspicious") return;

    const isScam = riskLevel === "scam";
    const typeLabel = scanType.charAt(0).toUpperCase() + scanType.slice(1);

    new Notification(isScam ? "Scam Detected!" : "Suspicious Content Detected", {
      body: isScam
        ? `GhostNet flagged your ${typeLabel} scan as a SCAM. Do not interact with it.`
        : `GhostNet flagged your ${typeLabel} scan as suspicious. Review with caution.`,
      icon: "/favicon.ico",
      tag: `ghostnet-${riskLevel}-${Date.now()}`,
    });
  }, []);

  return notify;
}