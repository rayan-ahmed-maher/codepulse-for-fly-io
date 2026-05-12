"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

function timeAgo(isoString) {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function TrendingDashboard({ onSearchDomain }) {
  const [keywords,   setKeywords]   = useState([]);
  const [tlds,       setTlds]       = useState([]);
  const [available,  setAvailable]  = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pulse,      setPulse]      = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [kw, tl, av] = await Promise.all([
        api.getTrendingKeywords().catch(() => ({ keywords: [] })),
        api.getTrendingTlds().catch(() => ({ tlds: [] })),
        api.getTrendingAvailable().catch(() => ({ domains: [] })),
      ]);
      setKeywords(kw.keywords || []);
      setTlds(tl.tlds || []);
      setAvailable(av.domains || []);
    } catch {}
    setRefreshing(false);
    setPulse(true);
    setTimeout(() => setPulse(false), 800);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const maxKwCount = keywords[0]?.count || 1;
  const maxTldCount = tlds[0]?.count || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{
        marginBottom: 28, position: "relative",
        background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "22px 20px",
        backdropFilter: "blur(12px)",
        border: "1px solid transparent",
        backgroundClip: "padding-box",
        boxShadow: pulse ? "0 0 0 1px rgba(0,212,255,0.4)" : "0 0 0 1px rgba(255,255,255,0.06)",
        transition: "box-shadow 0.4s ease",
      }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
          <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#fff" }}>🔥 TRENDING RIGHT NOW</span>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>Live · updates every 30s</span>
        </div>
        <button onClick={load} disabled={refreshing}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem" }}>
          <RefreshCw size={12} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>

        {/* Column 1: Hot Keywords */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00D4FF", letterSpacing: 1, marginBottom: 12 }}>HOT KEYWORDS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {keywords.length === 0 && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>Loading…</span>}
            {keywords.map((kw, i) => {
              const size = 0.72 + (kw.count / maxKwCount) * 0.22;
              return (
                <motion.button key={kw.keyword} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.08, boxShadow: "0 0 12px rgba(0,212,255,0.4)" }}
                  onClick={() => onSearchDomain(kw.keyword)}
                  style={{
                    padding: "4px 12px", borderRadius: 999, fontSize: `${size}rem`, fontWeight: 600,
                    background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)",
                    color: "#00D4FF", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}>
                  <TrendingUp size={10} />
                  {kw.keyword}
                  <span style={{ fontSize: "0.62rem", opacity: 0.6 }}>{kw.count}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Popular TLDs */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#FF2D9B", letterSpacing: 1, marginBottom: 12 }}>POPULAR EXTENSIONS</div>
          {tlds.length === 0 && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>Loading…</span>}
          {tlds.map((t, i) => (
            <motion.div key={t.tld} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{t.tld}</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{t.count} searches</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(t.count / maxTldCount) * 100}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + i * 0.08 }}
                  style={{ height: "100%", background: "linear-gradient(90deg, #FF2D9B, #a855f7)", borderRadius: 4 }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Column 3: Just Found Available */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#10b981", letterSpacing: 1, marginBottom: 12 }}>JUST FOUND AVAILABLE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {available.length === 0 && <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>No recent results…</span>}
            <AnimatePresence>
              {available.slice(0, 6).map((d) => (
                <motion.div key={d.domain}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8,
                    background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                  }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{d.domain}</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                      ₹{d.price_inr?.toLocaleString("en-IN")}/yr · {timeAgo(d.searched_at)}
                    </div>
                  </div>
                  <button onClick={() => onSearchDomain(d.domain.split(".")[0])}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}>
                    <Zap size={10} style={{ marginRight: 3 }} />Search
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
