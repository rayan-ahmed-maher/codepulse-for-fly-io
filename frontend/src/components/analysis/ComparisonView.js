"use client";

import { motion } from "framer-motion";
import { TrendingUp, X, Star, Globe, Clock, GitBranch } from "lucide-react";

const METRICS = [
  { key: "health_score", label: "Health Score", suffix: "/100", higherIsBetter: true },
  { key: "file_count", label: "File Count", suffix: " files", higherIsBetter: false },
];

function getScoreColor(score) {
  if (score >= 80) return "var(--color-emerald-neon)";
  if (score >= 50) return "var(--color-amber-warning)";
  return "var(--color-rose-danger)";
}

function MetricRow({ label, val1, val2, suffix, higherIsBetter }) {
  const v1 = Number(val1) || 0;
  const v2 = Number(val2) || 0;
  const max = Math.max(v1, v2, 1);

  const p1wins = higherIsBetter ? v1 > v2 : v1 < v2;
  const p2wins = higherIsBetter ? v2 > v1 : v2 < v1;
  const diff = v1 && v2 ? Math.abs(((v2 - v1) / (v1 || 1)) * 100).toFixed(0) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
      {/* Left */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "0.8rem" }}>
          <span style={{ color: p1wins ? "var(--color-emerald-neon)" : "var(--text-secondary)", fontWeight: p1wins ? 700 : 400 }}>
            {val1}{suffix}
          </span>
        </div>
        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", display: "flex", justifyContent: "flex-end", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(v1 / max) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: "100%", background: p1wins ? "var(--color-emerald-neon)" : "var(--color-rose-danger)", borderRadius: "3px" }}
          />
        </div>
      </div>

      {/* Center label */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>{label}</div>
        {diff > 0 && (
          <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "var(--text-tertiary)" }}>
            {diff}% diff
          </span>
        )}
      </div>

      {/* Right */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "0.8rem" }}>
          <span style={{ color: p2wins ? "var(--color-emerald-neon)" : "var(--text-secondary)", fontWeight: p2wins ? 700 : 400 }}>
            {val2}{suffix}
          </span>
        </div>
        <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(v2 / max) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: "100%", background: p2wins ? "var(--color-emerald-neon)" : "var(--color-rose-danger)", borderRadius: "3px" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ComparisonView({ project1, project2, onClose }) {
  if (!project1 || !project2) return null;

  const p1wins = project1.health_score >= project2.health_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
      style={{ padding: "28px" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="var(--color-emerald-neon)" />
          Side-by-Side Comparison
        </h3>
        <button onClick={onClose} className="btn btn-ghost btn-icon">
          <X size={16} />
        </button>
      </div>

      {/* Project headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr", gap: "12px", marginBottom: "20px" }}>
        {/* Project A */}
        <div className="glass-panel" style={{ padding: "16px", background: "rgba(0,0,0,0.2)", position: "relative" }}>
          {p1wins && (
            <div style={{ position: "absolute", top: "-10px", right: "12px" }}>
              <span className="badge" style={{ background: "rgba(16,185,129,0.2)", color: "var(--color-emerald-neon)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={10} /> WINNER
              </span>
            </div>
          )}
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>{project1.project_name}</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><GitBranch size={10} /> {project1.framework}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Globe size={10} /> {project1.file_count} files</span>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color: getScoreColor(project1.health_score), marginTop: "10px" }}>
            {project1.health_score}
          </div>
        </div>

        {/* VS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", fontWeight: 900, fontSize: "1.2rem", color: "var(--text-tertiary)" }}>
            VS
          </div>
        </div>

        {/* Project B */}
        <div className="glass-panel" style={{ padding: "16px", background: "rgba(0,0,0,0.2)", position: "relative" }}>
          {!p1wins && (
            <div style={{ position: "absolute", top: "-10px", right: "12px" }}>
              <span className="badge" style={{ background: "rgba(16,185,129,0.2)", color: "var(--color-emerald-neon)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={10} /> WINNER
              </span>
            </div>
          )}
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>{project2.project_name}</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><GitBranch size={10} /> {project2.framework}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Globe size={10} /> {project2.file_count} files</span>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color: getScoreColor(project2.health_score), marginTop: "10px" }}>
            {project2.health_score}
          </div>
        </div>
      </div>

      {/* Metric rows */}
      <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {METRICS.map((m) => (
          <MetricRow
            key={m.key}
            label={m.label}
            val1={project1[m.key]}
            val2={project2[m.key]}
            suffix={m.suffix}
            higherIsBetter={m.higherIsBetter}
          />
        ))}
      </div>
    </motion.div>
  );
}
