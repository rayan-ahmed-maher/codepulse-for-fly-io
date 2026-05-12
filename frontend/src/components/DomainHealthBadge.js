"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Globe, Camera, Play, Loader2, ExternalLink, User } from "lucide-react";
import { api } from "@/lib/api";

const PLATFORM_ICONS = { Twitter: User, GitHub: Globe, Instagram: Camera, YouTube: Play };

function CircularScore({ score }) {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 71 ? "#10b981" : score >= 41 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="100" height="100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeOut" }}
        strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="20" fontWeight="800">{score}</text>
      <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">/100</text>
    </svg>
  );
}

function HealthModal({ data, domain, onClose }) {
  const { categories, verdict, verdict_color, score } = data;
  const cat = categories;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "rgba(10,16,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "32px 28px", maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>Domain Health Report</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{domain}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="rgba(255,255,255,0.4)" /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <CircularScore score={score} />
          <div style={{ marginTop: 12, padding: "6px 20px", borderRadius: 999, background: `${verdict_color}18`, border: `1px solid ${verdict_color}40`, color: verdict_color, fontWeight: 800, fontSize: "0.88rem", letterSpacing: 1 }}>
            {verdict}
          </div>
        </div>

        {/* Spam */}
        <Row icon="🛡" label={cat.spam.label} status={cat.spam.status} note={cat.spam.note}
          points={cat.spam.points} max={cat.spam.max}
          statusColor={cat.spam.status === "Clean" ? "#10b981" : "#ef4444"} />

        {/* Age */}
        <Row icon="📅" label={cat.age.label} status={cat.age.status} note=""
          points={cat.age.points} max={cat.age.max} statusColor="#00D4FF" />

        {/* SEO */}
        <Row icon="🔍" label={cat.seo.label} status={`${cat.seo.mentions} mentions`} note={cat.seo.note}
          points={cat.seo.points} max={cat.seo.max} statusColor="#a855f7" />

        {/* Social */}
        <div style={{ marginBottom: 14, padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>📱 Social Handles</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(cat.social.platforms || []).map(p => {
              const Icon = PLATFORM_ICONS[p.platform] || Shield;
              const avail = p.available;
              return (
                <div key={p.platform} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                  borderRadius: 8, fontSize: "0.72rem", fontWeight: 700,
                  background: avail === true ? "rgba(16,185,129,0.1)" : avail === false ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${avail === true ? "#10b98140" : avail === false ? "#ef444440" : "rgba(255,255,255,0.1)"}`,
                  color: avail === true ? "#10b981" : avail === false ? "#ef4444" : "rgba(255,255,255,0.4)",
                }}>
                  <Icon size={12} /> {p.platform}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ icon, label, status, note, points, max, statusColor }) {
  return (
    <div style={{ marginBottom: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>{icon} {label}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: statusColor }}>{status}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(points / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: statusColor, borderRadius: 4 }} />
      </div>
      {note && <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{note}</div>}
    </div>
  );
}

export default function DomainHealthBadge({ domain }) {
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(null);
  const [showModal, setShow]    = useState(false);

  const handleCheck = async (e) => {
    e.stopPropagation();
    if (data) { setShow(true); return; }
    setLoading(true);
    try {
      const result = await api.checkDomainHealth(domain);
      if (!result.error) { setData(result); setShow(true); }
    } catch {}
    setLoading(false);
  };

  const score = data?.score;
  const color = score === undefined ? "rgba(255,255,255,0.3)" : score >= 71 ? "#10b981" : score >= 41 ? "#f59e0b" : "#ef4444";

  return (
    <>
      <button onClick={handleCheck} disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${color}40`,
          cursor: loading ? "wait" : "pointer", color, fontSize: "0.7rem", fontWeight: 700,
        }}>
        {loading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={11} />}
        {score !== undefined ? `${score}/100` : loading ? "Checking…" : "Health"}
      </button>

      <AnimatePresence>
        {showModal && data && (
          <HealthModal data={data} domain={domain} onClose={() => setShow(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
