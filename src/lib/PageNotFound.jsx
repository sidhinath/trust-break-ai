import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Ghost, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: 'var(--ghost-bg)' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float"
        style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
        <Ghost className="w-10 h-10" style={{ color: 'var(--ghost-neon)' }} />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">404</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ghost-text-dim)' }}>
        This page has ghosted you
      </p>
      <Link to={createPageUrl("Home")}>
        <Button className="rounded-xl px-6" style={{ background: 'var(--ghost-neon)', color: '#000' }}>
          <Home className="w-4 h-4 mr-2" /> Back to Safety
        </Button>
      </Link>
    </div>
  );
}