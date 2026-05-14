"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Activity } from "lucide-react";

export default function HealthGauge({ score = 0, subScores = {} }) {
  const [displayScore, setDisplayScore] = useState(0);
  const progress = useMotionValue(0);
  
  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (val) => setDisplayScore(Math.round(val)),
    });
    return controls.stop;
  }, [score, progress]);

  const getColor = (val) => {
    if (val <= 40) return "var(--color-rose-danger)";
    if (val <= 70) return "var(--color-amber-warning)";
    return "var(--color-emerald-neon)";
  };
  
  const getGlow = (val) => {
    if (val <= 40) return "rgba(244, 63, 94, 0.4)";
    if (val <= 70) return "rgba(245, 158, 11, 0.4)";
    return "rgba(16, 185, 129, 0.4)";
  };

  const currentColor = getColor(displayScore);
  const currentGlow = getGlow(displayScore);
  
  // Transform progress 0-100 to strokeDashoffset (circumference)
  const size = 280;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(progress, [0, 100], [circumference, 0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="glass-panel"
      style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
        {/* Slow rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.1)", pointerEvents: "none" }}
        />
        
        {/* SVG Gauge */}
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress fill */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset, filter: `drop-shadow(0 0 12px ${currentGlow})`, strokeLinecap: "round" }}
          />
        </svg>

        {/* Center Text */}
        <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Activity size={24} color={currentColor} style={{ marginBottom: "8px", filter: `drop-shadow(0 0 8px ${currentGlow})` }} />
          <div style={{ fontSize: "4.5rem", fontWeight: 900, lineHeight: 1, color: "var(--text-primary)", textShadow: `0 0 20px ${currentGlow}` }}>
            {displayScore}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "2px", marginTop: "4px" }}>
            Health Score
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }}>
        {Object.entries(subScores).map(([key, val], i) => (
          <div key={key} style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.75rem", textTransform: "uppercase" }}>
              <span style={{ color: "var(--text-secondary)" }}>{key}</span>
              <span style={{ fontWeight: 700, color: getColor(val) }}>{val}/100</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${val}%` }}
                transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                style={{ height: "100%", background: getColor(val), boxShadow: `0 0 8px ${getGlow(val)}` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
