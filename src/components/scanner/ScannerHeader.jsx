import React from "react";
import { motion } from "framer-motion";

export default function ScannerHeader({ icon: Icon, title, description, color = "#00e5ff" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 pb-1">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{
          background: `${color}15`,
          border: `1px solid ${color}35`,
        }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display"
          style={{ color: 'var(--ghost-text)' }}>
          {title}
        </h1>
        <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-2xl"
          style={{ color: 'var(--ghost-text-dim)' }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}