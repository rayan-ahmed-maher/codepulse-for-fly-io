"use client";

import { motion } from "framer-motion";
import { Zap, Code, Folder, FileText } from "lucide-react";

export default function FrameworkCard({ data }) {
  const confidence = data?.confidence || 0;
  const framework = data?.framework || "Unknown";
  const type = data?.type || "Unknown";
  const entryPoint = data?.entryPoint || "index.js";
  const fileCount = data?.fileCount || 0;
  const totalSize = data?.totalSize || "0 KB";

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      className="glass-panel"
      style={{
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        borderLeft: "4px solid var(--color-cyan-info)",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={24} color="var(--color-cyan-info)" />
            {framework}
          </h2>
          <span className="badge" style={{ marginTop: "8px", display: "inline-block", background: "rgba(0, 245, 255, 0.1)", color: "var(--color-cyan-info)" }}>
            {type}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "1px" }}>Confidence</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{confidence}%</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>Match Confidence</div>
        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--color-electric-indigo), var(--color-cyan-info))",
              boxShadow: "0 0 10px rgba(0, 245, 255, 0.4)"
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <Code size={14} color="var(--text-tertiary)" />
          <span>Entry Point:</span>
          <span style={{ color: "var(--color-cyan-info)", fontFamily: "monospace" }}>{entryPoint}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <Folder size={14} color="var(--text-tertiary)" />
          <span>Total Files:</span>
          <span style={{ fontWeight: 600 }}>{fileCount}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <FileText size={14} color="var(--text-tertiary)" />
          <span>Total Size:</span>
          <span style={{ fontWeight: 600 }}>{totalSize}</span>
        </div>
      </div>
    </motion.div>
  );
}
