"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";

const STYLE_COLORS = {
  Modern:       "#00D4FF",
  Tech:         "#6366f1",
  Creative:     "#a855f7",
  Playful:      "#FF2D9B",
  Professional: "#10b981",
};

function ScoreGauge({ score }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  const color = score >= 8 ? "#10b981" : score >= 6 ? "#00D4FF" : "#f59e0b";
  return (
    <svg width="68" height="68" style={{ flexShrink: 0 }}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <motion.circle
        cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
      <text x="34" y="38" textAnchor="middle" fill={color} fontSize="14" fontWeight="800">{score}</text>
    </svg>
  );
}

function BrandCard({ brand, i, onSearchDomain }) {
  const styleColor = STYLE_COLORS[brand.style] || "#00D4FF";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      whileHover={{ y: -4, boxShadow: `0 0 30px ${styleColor}22` }}
      style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${styleColor}30`,
        borderRadius: 14, padding: "22px 20px",
        backdropFilter: "blur(12px)", cursor: "default",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, background: `linear-gradient(135deg, ${styleColor}, #fff)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {brand.name}
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{brand.domain}</div>
        </div>
        <ScoreGauge score={brand.memorability_score} />
      </div>

      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, background: `${styleColor}18`, border: `1px solid ${styleColor}40`, color: styleColor, marginBottom: 10 }}>
        {brand.style}
      </span>

      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginBottom: 8, lineHeight: 1.5 }}>{brand.meaning}</p>
      <p style={{ fontSize: "0.78rem", color: "#00D4FF", fontStyle: "italic", marginBottom: 14 }}>"{brand.tagline}"</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          padding: "4px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
          background: brand.available === true ? "rgba(16,185,129,0.12)" : brand.available === false ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${brand.available === true ? "#10b981" : brand.available === false ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
          color: brand.available === true ? "#10b981" : brand.available === false ? "#ef4444" : "rgba(255,255,255,0.4)",
        }}>
          {brand.available === true ? `✓ Available ₹${brand.price_inr?.toLocaleString("en-IN")}/yr` : brand.available === false ? "✗ Taken" : "⋯ Unknown"}
        </span>
        <button
          onClick={() => onSearchDomain(brand.domain.split(".")[0])}
          style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
            background: `linear-gradient(135deg, ${styleColor}33, rgba(255,255,255,0.05))`,
            color: styleColor, display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <Search size={12} /> Search
        </button>
      </div>
    </motion.div>
  );
}

export default function BrandGenerator({ onSearchDomain }) {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState([]);
  const [error, setError]       = useState("");

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setLoading(true); setError(""); setResults([]);
    try {
      const data = await api.generateBrandNames(keyword.trim());
      if (data.error) { setError(data.error); }
      else { setResults(data.suggestions || []); }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 32, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 16, padding: "28px 24px", backdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Sparkles size={20} color="#00D4FF" />
        <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>AI Brand Name Generator</span>
        <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 999, background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.3)" }}>NVIDIA NIM</span>
      </div>
      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginBottom: 18 }}>Enter a keyword and AI will generate 10 creative brand names with domain availability</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGenerate()}
          placeholder="Enter a keyword or describe your business..."
          style={{ flex: 1, padding: "11px 16px", fontSize: "0.88rem", borderRadius: 10 }} />
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={handleGenerate} disabled={loading}
          style={{ padding: "11px 24px", borderRadius: 10, border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 700, fontSize: "0.88rem", background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#00D4FF,#6366f1)", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating…</> : <><Sparkles size={16} /> Generate</>}
        </motion.button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(0,212,255,0.7)", fontSize: "0.85rem", fontFamily: "monospace" }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            ◆ NVIDIA AI is generating your brand names…
          </motion.div>
        </div>
      )}

      {error && <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: 8 }}>⚠ {error}</p>}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {results.map((brand, i) => (
              <BrandCard key={brand.name + i} brand={brand} i={i} onSearchDomain={onSearchDomain} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
