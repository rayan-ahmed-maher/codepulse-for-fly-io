"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Shield, AlertTriangle, Check, Filter } from "lucide-react";

export default function DependencyAnalyzer({ dependencies = [] }) {
  const [filter, setFilter] = useState("all");
  
  // Stats
  const safeCount = dependencies.filter(d => d.status === "safe").length;
  const outdatedCount = dependencies.filter(d => d.status === "outdated").length;
  const vulnCount = dependencies.filter(d => d.status === "vulnerable").length;
  
  const filteredDeps = dependencies.filter(d => filter === "all" || d.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-panel"
      style={{ padding: "24px", display: "flex", flexDirection: "column", height: "400px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <Package size={18} color="var(--color-pink-accent)" />
          Dependency Analyzer
        </h3>
      </div>

      {/* Summary Bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button 
          onClick={() => setFilter("all")}
          style={{ flex: 1, padding: "8px", borderRadius: "6px", background: filter === "all" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: "white", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
        >
          <Filter size={12} /> All ({dependencies.length})
        </button>
        <button 
          onClick={() => setFilter("safe")}
          style={{ flex: 1, padding: "8px", borderRadius: "6px", background: filter === "safe" ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.2)", border: filter === "safe" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: filter === "safe" ? "var(--color-emerald-neon)" : "var(--text-secondary)", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
        >
          <Check size={12} /> Safe ({safeCount})
        </button>
        <button 
          onClick={() => setFilter("outdated")}
          style={{ flex: 1, padding: "8px", borderRadius: "6px", background: filter === "outdated" ? "rgba(245,158,11,0.15)" : "rgba(0,0,0,0.2)", border: filter === "outdated" ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: filter === "outdated" ? "var(--color-amber-warning)" : "var(--text-secondary)", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
        >
          <AlertTriangle size={12} /> Outdated ({outdatedCount})
        </button>
        <button 
          onClick={() => setFilter("vulnerable")}
          style={{ flex: 1, padding: "8px", borderRadius: "6px", background: filter === "vulnerable" ? "rgba(244,63,94,0.15)" : "rgba(0,0,0,0.2)", border: filter === "vulnerable" ? "1px solid rgba(244,63,94,0.3)" : "1px solid rgba(255,255,255,0.05)", cursor: "pointer", color: filter === "vulnerable" ? "var(--color-rose-danger)" : "var(--text-secondary)", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
        >
          <Shield size={12} /> Vuln ({vulnCount})
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }} className="custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredDeps.map((dep, i) => (
            <motion.div
              key={dep.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: "12px",
                marginBottom: "8px",
                borderRadius: "8px",
                background: dep.status === "vulnerable" ? "rgba(244,63,94,0.05)" : dep.status === "outdated" ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)",
                border: "1px solid",
                borderColor: dep.status === "vulnerable" ? "rgba(244,63,94,0.2)" : dep.status === "outdated" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{dep.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px", fontFamily: "monospace" }}>v{dep.version}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {dep.status === "vulnerable" && (
                  <span className="badge" style={{ background: "rgba(244,63,94,0.1)", color: "var(--color-rose-danger)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Shield size={10} /> {dep.cve || "CVE Found"}
                  </span>
                )}
                {dep.status === "outdated" && (
                  <span className="badge" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-amber-warning)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle size={10} /> → v{dep.latest}
                  </span>
                )}
                {dep.status === "safe" && (
                  <span className="badge" style={{ background: "rgba(16,185,129,0.1)", color: "var(--color-emerald-neon)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Check size={10} /> Up to date
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {filteredDeps.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
              No dependencies match this filter.
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
