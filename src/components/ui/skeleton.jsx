import React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Atomic Skeleton Component
 */
function Skeleton({ className, style, ...props }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading element..."
      className={cn("ghost-skeleton-glow border border-cyan-500/10", className)}
      style={{
        background: 'var(--ghost-surface-2)',
        borderColor: 'var(--ghost-skeleton-border)',
        ...style
      }}
      {...props}
    />
  );
}

/**
 * Page Header Skeleton
 */
function PageHeaderSkeleton({ hasButton = false, className }) {
  return (
    <div className={cn("space-y-3 pb-2", className)} role="status" aria-label="Loading page header">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-8 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-md" />
        </div>
        {hasButton && <Skeleton className="h-10 w-36 rounded-xl shrink-0" />}
      </div>
    </div>
  );
}

/**
 * Header Top Command Bar Skeleton
 */
function HeaderSkeleton() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 border-b backdrop-blur-xl transition-colors"
      style={{ background: 'var(--ghost-surface)', borderColor: 'var(--ghost-border)' }}
      role="status"
      aria-label="Loading top navigation bar">
      <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg hidden sm:block" />
          <Skeleton className="h-8 w-24 rounded-lg hidden md:block" />
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    </header>
  );
}

/**
 * Left Sidebar Navigation Skeleton
 */
function SidebarSkeleton() {
  return (
    <aside
      className="hidden md:flex flex-col w-64 fixed top-14 left-0 bottom-0 border-r z-30 p-4 space-y-6 overflow-y-auto"
      style={{ background: 'var(--ghost-surface)', borderColor: 'var(--ghost-border)' }}
      role="status"
      aria-label="Loading navigation sidebar">
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </aside>
  );
}

/**
 * Metric Card Skeleton (Security Score, Threats Detected, Total Scans)
 */
function MetricCardSkeleton({ count = 3, className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)} role="status" aria-label="Loading metrics">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="ghost-card p-5 space-y-3 min-h-[120px] flex flex-col justify-between"
          style={{ background: 'var(--ghost-surface)' }}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="w-6 h-6 rounded-md" />
          </div>
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Scanner Card Skeleton (Grid item for Message, Link, Screenshot, QR, Voice, Browser Shield)
 */
function ScannerCardSkeleton({ count = 6, className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", className)} role="status" aria-label="Loading scanners list">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="ghost-card p-4 flex items-center justify-between min-h-[76px]"
          style={{ background: 'var(--ghost-surface)' }}>
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-36 rounded-sm" />
            </div>
          </div>
          <Skeleton className="w-4 h-4 rounded-full shrink-0 ml-2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Threat Row Skeleton & Threat List Skeleton
 */
function ThreatRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border"
      style={{ background: 'var(--ghost-surface-2)', borderColor: 'var(--ghost-border)' }}>
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-48 rounded-sm" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-12 h-4 rounded-md hidden sm:block" />
      </div>
    </div>
  );
}

function ThreatListSkeleton({ count = 5, className }) {
  return (
    <div className={cn("ghost-card p-4 space-y-3", className)} role="status" aria-label="Loading recent threat activity">
      {Array.from({ length: count }).map((_, i) => (
        <ThreatRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Chart Skeleton Container
 */
function ChartSkeleton({ height = 280, className }) {
  return (
    <div
      className={cn("ghost-card p-5 space-y-4 flex flex-col justify-between", className)}
      style={{ minHeight: `${height}px`, background: 'var(--ghost-surface)' }}
      role="status"
      aria-label="Loading chart data">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const heights = ['h-16', 'h-24', 'h-32', 'h-20', 'h-28', 'h-36', 'h-14', 'h-24', 'h-32', 'h-40', 'h-20', 'h-28'];
          return (
            <Skeleton key={i} className={cn("w-full rounded-t-md", heights[i % heights.length])} />
          );
        })}
      </div>
      <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--ghost-border)' }}>
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}

/**
 * Form Skeleton (Inputs, Textareas, File Dropzones, Buttons)
 */
function FormSkeleton({ hasUpload = false, className }) {
  return (
    <div className={cn("ghost-card p-6 space-y-5", className)} style={{ background: 'var(--ghost-surface)' }} role="status" aria-label="Loading form">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      {hasUpload && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/**
 * Contextual Scanner Skeleton (For AI Analysis Tools)
 */
function ScannerSkeleton({ className }) {
  return (
    <div className={cn("space-y-6", className)} role="status" aria-label="Loading AI Scanner interface">
      <PageHeaderSkeleton hasButton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <FormSkeleton hasUpload />
        </div>
        <div className="space-y-5">
          <SkeletonScannerResult />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile & Settings Skeleton
 */
function ProfileSkeleton({ className }) {
  return (
    <div className={cn("space-y-6", className)} role="status" aria-label="Loading security profile">
      <PageHeaderSkeleton />
      <div className="ghost-card p-6 flex items-center gap-5" style={{ background: 'var(--ghost-surface)' }}>
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-64 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
      </div>
      <MetricCardSkeleton count={3} />
      <FormSkeleton />
    </div>
  );
}

/**
 * Data Table Skeleton
 */
function TableSkeleton({ rows = 5, className }) {
  return (
    <div className={cn("ghost-card p-5 space-y-4", className)} style={{ background: 'var(--ghost-surface)' }} role="status" aria-label="Loading table">
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--ghost-border)' }}>
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--ghost-border)' }}>
          <Skeleton className="h-4 w-1/4 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Complete Dashboard Skeleton (For Command Center Initial Load)
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-6" role="status" aria-label="Loading GhostNet Command Center">
      {/* 1-Click Judge & Presentation Demo Bar Placeholder */}
      <div className="ghost-card p-3 flex items-center justify-between gap-3 overflow-x-auto" style={{ background: 'var(--ghost-surface)' }}>
        <Skeleton className="h-4 w-36 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg text-nowrap" />
        </div>
      </div>

      {/* Security Score Header Card Placeholder */}
      <div className="ghost-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[160px]" style={{ background: 'var(--ghost-surface)' }}>
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Skeleton className="w-24 h-24 rounded-2xl" />
          <Skeleton className="w-24 h-24 rounded-2xl" />
        </div>
      </div>

      {/* Scanners Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <ScannerCardSkeleton count={8} />
      </div>

      {/* Intelligence & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded" />
          <ChartSkeleton height={260} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded" />
          <ThreatListSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * App Shell Skeleton (Full Application Layout Skeleton)
 */
function AppShellSkeleton() {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--ghost-bg)', color: 'var(--ghost-text)' }}>
      <HeaderSkeleton />
      <div className="flex flex-1 pt-14">
        <SidebarSkeleton />
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}

/**
 * Backward Compatible Components
 */
function SkeletonCard({ className, children }) {
  return (
    <div className={cn("ghost-card p-5 space-y-3 min-h-[140px]", className)} style={{ background: 'var(--ghost-surface)' }}>
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="h-8 w-2/3 rounded" />
      <Skeleton className="h-3 w-full rounded" />
      {children}
    </div>
  );
}

function SkeletonRows({ count = 3 }) {
  return <ThreatListSkeleton count={count} />;
}

function SkeletonStats() {
  return <MetricCardSkeleton count={3} />;
}

function SkeletonScannerResult() {
  return (
    <div className="ghost-card p-6 space-y-5" style={{ background: 'var(--ghost-surface)' }} role="status" aria-label="Loading analysis result">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </div>
        <Skeleton className="w-20 h-7 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <Skeleton className="h-3 w-4/6 rounded" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export {
  Skeleton,
  PageHeaderSkeleton,
  HeaderSkeleton,
  SidebarSkeleton,
  MetricCardSkeleton,
  ScannerCardSkeleton,
  ThreatRowSkeleton,
  ThreatListSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ScannerSkeleton,
  ProfileSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  AppShellSkeleton,
  SkeletonCard,
  SkeletonRows,
  SkeletonStats,
  SkeletonScannerResult
};
