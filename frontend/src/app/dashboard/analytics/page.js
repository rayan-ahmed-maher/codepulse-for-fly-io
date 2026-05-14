"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, Rocket, Check, X, Clock, Globe, Activity,
  TrendingUp, AlertTriangle, RefreshCw, ExternalLink, ChevronDown
} from "lucide-react";
import { api } from "@/lib/api";

const PAGE_SIZE = 20;     // rows shown per page
const FETCH_TIMEOUT = 15000; // 15 seconds
const RETRY_DELAY   = 2000;  // 2 seconds before auto-retry

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_COLORS = {
  vercel:     { bg: "rgba(0,0,0,0.6)",      border: "rgba(255,255,255,0.2)", text: "#ffffff" },
  netlify:    { bg: "rgba(0,173,188,0.15)", border: "rgba(0,173,188,0.3)",  text: "#00adbc" },
  cloudflare: { bg: "rgba(249,130,18,0.15)",border: "rgba(249,130,18,0.3)", text: "#f98212" },
  render:     { bg: "rgba(70,130,180,0.15)",border: "rgba(70,130,180,0.3)", text: "#5b8fd6" },
};

const STATUS_CONFIG = {
  READY:      { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "SUCCESS",   icon: Check },
  ready:      { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "SUCCESS",   icon: Check },
  success:    { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "SUCCESS",   icon: Check },
  FAILED:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "FAILED",    icon: X },
  failed:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "FAILED",    icon: X },
  error:      { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "FAILED",    icon: X },
  DEPLOYING:  { color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   label: "DEPLOYING", icon: Activity },
  deploying:  { color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   label: "DEPLOYING", icon: Activity },
  pending:    { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "PENDING",   icon: Clock },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStatusConfig(status) {
  return STATUS_CONFIG[status] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: status?.toUpperCase() ?? "UNKNOWN", icon: Activity };
}

function getPlatformStyle(platform) {
  return PLATFORM_COLORS[platform?.toLowerCase()] ?? { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#818cf8" };
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function isSuccess(status) {
  return ["READY", "ready", "success"].includes(status);
}

function isFailed(status) {
  return ["FAILED", "failed", "error"].includes(status);
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SkeletonCard({ height = 96 }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{ height, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    />
  );
}

function StatCard({ icon: Icon, label, value, color, glow, delay = 0, suffix = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px ${glow}` }}
      className="glass-panel"
      style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, borderLeft: `3px solid ${color}` }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </div>
      <div>
        <div style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, color: "var(--text-primary)" }}>
          {value ?? "—"}<span style={{ fontSize: "1rem", color: "var(--text-tertiary)", fontWeight: 500 }}>{suffix}</span>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 4 }}>{label}</div>
      </div>
    </motion.div>
  );
}

function PlatformBar({ platform, count, max }) {
  const style = getPlatformStyle(platform);
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div style={{ width: 80, fontSize: "0.78rem", textAlign: "right", color: "var(--text-secondary)", textTransform: "capitalize", flexShrink: 0 }}>{platform}</div>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ height: "100%", background: style.text, boxShadow: `0 0 8px ${style.text}66`, borderRadius: 4 }}
        />
      </div>
      <div style={{ width: 24, fontSize: "0.8rem", fontWeight: 700, color: style.text, flexShrink: 0 }}>{count}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  const isPulsing = ["DEPLOYING", "deploying"].includes(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, fontSize: "0.7rem", fontWeight: 700 }}>
      {isPulsing ? (
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <Icon size={11} />
        </motion.div>
      ) : (
        <Icon size={11} />
      )}
      {cfg.label}
    </span>
  );
}

function PlatformBadge({ platform }) {
  const style = getPlatformStyle(platform);
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, background: style.bg, border: `1px solid ${style.border}`, color: style.text, fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize" }}>
      {platform || "—"}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ── Fetch helper with timeout ──────────────────────────────────────────────
async function fetchWithTimeout(promise, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const result = await promise;
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export default function AnalyticsPage() {
  const [deployments, setDeployments] = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [retrying, setRetrying]       = useState(false);
  const [error, setError]             = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);
  const attemptRef = useRef(0);

  const fetchData = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
      setError(null);
      setRetrying(false);
      attemptRef.current = 0;
    } else {
      setRetrying(true);
    }

    attemptRef.current += 1;

    try {
      const [deployList, statsData] = await Promise.all([
        fetchWithTimeout(api.getDeployList(), FETCH_TIMEOUT),
        fetchWithTimeout(api.getStats(),      FETCH_TIMEOUT),
      ]);

      const raw = Array.isArray(deployList)
        ? deployList
        : deployList?.deployments ?? deployList?.data ?? [];

      const sorted = [...raw].sort((a, b) => {
        const ta = new Date(a.created_at || a.timestamp || 0).getTime();
        const tb = new Date(b.created_at || b.timestamp || 0).getTime();
        return tb - ta;
      });

      setDeployments(sorted);
      setStats(statsData);
      setLastRefreshed(new Date());
      setError(null);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      // Auto-retry once after 2s before showing error
      if (attemptRef.current < 2) {
        setRetrying(true);
        setTimeout(() => fetchData(true), RETRY_DELAY);
        return;
      }
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived Stats ──────────────────────────────────────────────────────────
  const totalDeployments = deployments.length;
  const successCount = deployments.filter(d => isSuccess(d.status)).length;
  const failedCount  = deployments.filter(d => isFailed(d.status)).length;
  const successRate  = totalDeployments > 0 ? Math.round((successCount / totalDeployments) * 100) : 0;

  // Most used platform
  const platformCounts = deployments.reduce((acc, d) => {
    const p = d.platform?.toLowerCase() || "unknown";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const platformEntries = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
  const topPlatform = platformEntries[0]?.[0] ?? "—";
  const maxPlatformCount = platformEntries[0]?.[1] ?? 1;

  // ── Loading / Retry skeleton ───────────────────────────────────────────────
  const renderLoading = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {retrying && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-tertiary)", fontSize: "0.8rem" }}
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <RefreshCw size={13} />
          </motion.div>
          Retrying connection...
        </motion.div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} height={90} />)}
      </div>
      <SkeletonCard height={48} />
      {[...Array(5)].map((_, i) => <SkeletonCard key={i} height={52} />)}
      <SkeletonCard height={130} />
    </div>
  );

  // ── Error State (only shown after both attempts fail) ─────────────────────
  const renderError = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="glass-panel"
      style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
    >
      <AlertTriangle size={40} color="#ef4444" style={{ opacity: 0.7 }} />
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ef4444" }}>Failed to Load Analytics</h3>
      <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", maxWidth: 400 }}>{error}</p>
      <button className="btn btn-primary" onClick={() => fetchData()} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <RefreshCw size={14} /> Retry
      </button>
    </motion.div>
  );

  // ── Empty State ────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
      style={{ padding: "64px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
    >
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 72, height: 72, borderRadius: 18, background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Rocket size={36} color="var(--color-cyan-info)" />
      </motion.div>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>No Deployments Yet</h2>
      <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem", maxWidth: 420, lineHeight: 1.7 }}>
        Deploy your first project from the Command Center — your analytics will appear here automatically.
      </p>
    </motion.div>
  );

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="main-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="text-gradient" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart2 size={26} color="var(--color-cyan-info)" />
            Analytics
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginTop: 4 }}>
            Real-time deployment metrics &amp; history
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastRefreshed && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
              Updated {timeAgo(lastRefreshed)}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <motion.div animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}>
              <RefreshCw size={13} />
            </motion.div>
            Refresh
          </motion.button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <AnimatePresence mode="wait">
          {(loading || retrying) ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderLoading()}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderError()}
            </motion.div>
          ) : totalDeployments === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderEmpty()}
            </motion.div>
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* ── SECTION 1: Overview Stats ──────────────────────────────── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 20, background: "var(--color-cyan-info)", borderRadius: 2 }} />
                  <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-secondary)", margin: 0 }}>Deployment Overview</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
                  <StatCard icon={Rocket}     label="Total Deployments" value={totalDeployments}    color="#6366f1" glow="rgba(99,102,241,0.3)"  delay={0} />
                  <StatCard icon={Check}      label="Successful"        value={successCount}         color="#10b981" glow="rgba(16,185,129,0.3)"  delay={0.05} />
                  <StatCard icon={X}          label="Failed"            value={failedCount}          color="#ef4444" glow="rgba(239,68,68,0.3)"   delay={0.1} />
                  <StatCard icon={TrendingUp} label="Success Rate"      value={successRate}          color="#06b6d4" glow="rgba(6,182,212,0.3)"   delay={0.15} suffix="%" />
                  <StatCard icon={Globe}      label="Top Platform"      value={topPlatform}          color="#f98212" glow="rgba(249,130,18,0.3)"  delay={0.2} />
                  <StatCard icon={Activity}   label="Active / Pending"  value={deployments.filter(d => !isSuccess(d.status) && !isFailed(d.status)).length} color="#a855f7" glow="rgba(168,85,247,0.3)" delay={0.25} />
                </div>
              </div>

              {/* ── SECTION 2: Deployment History Table ───────────────────── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 20, background: "var(--color-violet-accent)", borderRadius: 2 }} />
                  <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-secondary)", margin: 0 }}>Deployment History</h2>
                  <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                    {Math.min(visibleCount, totalDeployments)} of {totalDeployments} records
                  </span>
                </div>

                <div className="glass-panel" style={{ overflow: "hidden", padding: 0 }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr 1.2fr", gap: 12, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                    {["Project", "Platform", "Status", "URL", "Time"].map((h) => (
                      <div key={h} style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-tertiary)" }}>{h}</div>
                    ))}
                  </div>

                  {/* Rows — paginated */}
                  <div>
                    {deployments.slice(0, visibleCount).map((d, i) => (
                      <motion.div
                        key={d.tracking_id || d.id || i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i, 10) * 0.025 }}
                        style={{
                          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr 1.2fr",
                          gap: 12, padding: "14px 20px",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          alignItems: "center",
                          transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseOut={(e)  => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.project_name || d.name || d.tracking_id?.slice(0, 16) || "Unnamed Project"}
                        </div>
                        <div><PlatformBadge platform={d.platform} /></div>
                        <div><StatusBadge status={d.status} /></div>
                        <div style={{ overflow: "hidden" }}>
                          {d.url ? (
                            <a href={d.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-cyan-info)", fontSize: "0.78rem", textDecoration: "none", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                            >
                              <ExternalLink size={11} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{d.url.replace(/^https?:\/\//, "")}</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>—</span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}
                          title={formatDate(d.created_at || d.timestamp)}
                        >
                          {timeAgo(d.created_at || d.timestamp)}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More */}
                  {visibleCount < totalDeployments && (
                    <motion.button
                      whileHover={{ background: "rgba(255,255,255,0.05)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                      style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", color: "var(--color-cyan-info)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      <ChevronDown size={14} />
                      Load {Math.min(PAGE_SIZE, totalDeployments - visibleCount)} more
                    </motion.button>
                  )}
                </div>
              </div>

              {/* ── SECTION 3: Platform Breakdown ─────────────────────────── */}
              {platformEntries.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 3, height: 20, background: "var(--color-emerald-neon)", borderRadius: 2 }} />
                    <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-secondary)", margin: 0 }}>Platform Breakdown</h2>
                  </div>
                  <div className="glass-panel" style={{ padding: "24px 28px" }}>
                    {platformEntries.map(([platform, count]) => (
                      <PlatformBar key={platform} platform={platform} count={count} max={maxPlatformCount} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── SECTION 4: Recent Activity Timeline ───────────────────── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 20, background: "var(--color-amber-warning)", borderRadius: 2 }} />
                  <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-secondary)", margin: 0 }}>Recent Activity</h2>
                </div>

                <div style={{ position: "relative", paddingLeft: 20 }}>
                  {/* Cyan spine */}
                  <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: "linear-gradient(180deg, var(--color-cyan-info), transparent)", borderRadius: 2 }} />

                  {deployments.slice(0, 10).map((d, i) => {
                    const cfg = getStatusConfig(d.status);
                    return (
                      <motion.div
                        key={d.id || i}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: 16 }}
                      >
                        {/* Timeline dot */}
                        <div style={{
                          position: "absolute", left: -16, top: 4,
                          width: 10, height: 10, borderRadius: "50%",
                          background: cfg.color,
                          boxShadow: `0 0 6px ${cfg.color}`,
                          border: "2px solid rgba(0,0,0,0.6)",
                          zIndex: 1
                        }} />

                        <div className="glass-panel" style={{ flex: 1, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {d.project_name || d.name || "Deployment"}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              <PlatformBadge platform={d.platform} />
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                            <StatusBadge status={d.status} />
                            <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                              {timeAgo(d.created_at || d.timestamp)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
