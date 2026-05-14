"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Globe, Check, Eye, GitBranch, Star, TrendingUp } from "lucide-react";

const getScoreColor = (score) => {
  if (score >= 80) return "var(--color-emerald-neon)";
  if (score >= 50) return "var(--color-amber-warning)";
  return "var(--color-rose-danger)";
};

const getScoreGlow = (score) => {
  if (score >= 80) return "rgba(16,185,129,0.4)";
  if (score >= 50) return "rgba(245,158,11,0.4)";
  return "rgba(244,63,94,0.4)";
};

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TimelineCard({ item, isSelected, onSelectCompare }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const color = getScoreColor(item.health_score);
  const glow = getScoreGlow(item.health_score);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-panel"
      style={{
        padding: "20px",
        marginLeft: "32px",
        position: "relative",
        borderLeft: isSelected ? `3px solid ${color}` : "3px solid transparent",
        background: isSelected ? `rgba(${color === "var(--color-emerald-neon)" ? "16,185,129" : "245,158,11"},0.04)` : undefined,
        transition: "all 0.3s ease"
      }}
    >
      {/* Dot on timeline */}
      <div style={{
        position: "absolute",
        left: "-42px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 10px ${glow}`,
        border: "2px solid rgba(0,0,0,0.5)",
        zIndex: 1
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            {item.project_name}
            <span className="badge" style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-electric-indigo)", fontSize: "0.65rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <GitBranch size={10} /> {item.framework}
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Globe size={11} /> {item.file_count} files
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={11} /> {formatDate(item.timestamp)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color, lineHeight: 1, textShadow: `0 0 12px ${glow}` }}>
            {item.health_score}
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginTop: "2px" }}>HEALTH</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, justifyContent: "center" }}
        >
          <Eye size={12} /> View Details
        </button>
        <button
          onClick={() => onSelectCompare(item.id)}
          className="btn btn-sm"
          style={{
            display: "flex", alignItems: "center", gap: "6px", flex: 1, justifyContent: "center",
            background: isSelected ? `${color}22` : "rgba(255,255,255,0.03)",
            color: isSelected ? color : "var(--text-secondary)",
            border: `1px solid ${isSelected ? `${color}44` : "rgba(255,255,255,0.06)"}`
          }}
        >
          {isSelected ? <Check size={12} /> : <TrendingUp size={12} />}
          {isSelected ? "Selected" : "Compare"}
        </button>
      </div>
    </motion.div>
  );
}

export default function HistoryTimeline({ history = [], compareIds = [], onSelectCompare }) {
  if (!history.length) {
    return (
      <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
        <Clock size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
        <p>No analysis history yet.</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingLeft: "16px" }}>
      {/* Cyan vertical line */}
      <div style={{
        position: "absolute",
        left: "22px",
        top: 0,
        bottom: 0,
        width: "2px",
        background: "linear-gradient(180deg, var(--color-cyan-info), rgba(0,245,255,0.1))",
        boxShadow: "0 0 8px rgba(0,245,255,0.3)"
      }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {history.map((item) => (
          <TimelineCard
            key={item.id}
            item={item}
            isSelected={compareIds.includes(item.id)}
            onSelectCompare={onSelectCompare}
          />
        ))}
      </div>
    </div>
  );
}
