"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Download, X, Check, AlertTriangle } from "lucide-react";

export default function ExportModal({ show, onClose, projectId }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (!isValidEmail) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/v1/analysis/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, email }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setStatus("success");
      } else {
        setErrorMsg(data.message || "Failed to send email.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setEmail("");
    setErrorMsg("");
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.25 }}
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "32px", width: "100%", maxWidth: "460px" }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <Download size={20} color="var(--color-cyan-info)" />
                  Export Analysis Report
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginTop: "6px" }}>
                  We'll email you a full report with all metrics, security issues, and AI suggestions.
                </p>
              </div>
              <button onClick={handleClose} className="btn btn-ghost btn-icon">
                <X size={16} />
              </button>
            </div>

            {/* Report preview */}
            <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Report Includes</div>
              {["All Code Metrics & Health Score", "Security Issues & CVEs Found", "AI Improvement Suggestions", "Dependency Vulnerability Report"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  <Check size={12} color="var(--color-emerald-neon)" />
                  {item}
                </div>
              ))}
            </div>

            {/* Email Input */}
            {status === "idle" || status === "error" ? (
              <>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  <Mail size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={{ width: "100%", padding: "12px 12px 12px 36px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                {status === "error" && (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-rose-danger)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                    <AlertTriangle size={12} /> {errorMsg}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={!isValidEmail}
                    className="btn btn-primary"
                    style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isValidEmail ? 1 : 0.5 }}
                  >
                    <Mail size={16} /> Send Report
                  </motion.button>
                </div>
              </>
            ) : status === "loading" ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block", marginBottom: "12px" }}
                >
                  <Mail size={32} color="var(--color-cyan-info)" />
                </motion.div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Sending your report...</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid var(--color-emerald-neon)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Check size={28} color="var(--color-emerald-neon)" />
                </div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px", color: "var(--color-emerald-neon)" }}>Report Sent!</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-tertiary)", marginBottom: "20px" }}>
                  Check your inbox at <span style={{ color: "var(--color-cyan-info)" }}>{email}</span>
                </p>
                <button onClick={handleClose} className="btn btn-primary">Done</button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
