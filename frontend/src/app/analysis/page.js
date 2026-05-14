"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Shield, Activity, BarChart2, Folder, Zap } from "lucide-react";

import FrameworkCard from "@/components/analysis/FrameworkCard";
import HealthGauge from "@/components/analysis/HealthGauge";
import FileVisualizer from "@/components/analysis/FileVisualizer";
import DependencyAnalyzer from "@/components/analysis/DependencyAnalyzer";
import CodeMetrics from "@/components/analysis/CodeMetrics";

export default function AnalysisCenter() {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for initial implementation
  const mockFrameworkData = {
    framework: "React + Vite",
    type: "Frontend",
    confidence: 94,
    entryPoint: "src/main.jsx",
    fileCount: 42,
    totalSize: "1.2 MB"
  };

  const mockHealthData = {
    score: 88,
    subScores: { Structure: 92, Dependencies: 80, Security: 85, Performance: 95 }
  };

  const mockFiles = [
    { path: "src/main.jsx", size: 1024 },
    { path: "src/App.jsx", size: 2048 },
    { path: "src/components/Header.jsx", size: 4096 },
    { path: "package.json", size: 512 },
    { path: "index.html", size: 256 },
    { path: "src/styles/global.css", size: 8192 },
    { path: "backend/api.py", size: 15360 }
  ];

  const mockDependencies = [
    { name: "react", version: "18.2.0", status: "safe", latest: "18.2.0" },
    { name: "framer-motion", version: "10.12.0", status: "outdated", latest: "11.0.0" },
    { name: "axios", version: "0.21.1", status: "vulnerable", cve: "CVE-2021-3749", latest: "1.6.0" },
    { name: "lucide-react", version: "0.260.0", status: "safe", latest: "0.260.0" }
  ];

  const mockMetrics = {
    loc: 2450,
    files: 42,
    depth: 4,
    commonLang: "JavaScript",
    largestFile: "api.py (15KB)",
    complexity: 35
  };

  // Simulate analyzing an uploaded project
  const simulateAnalysis = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsAnalyzed(true);
    }, 2000);
  };

  return (
    <div className="dashboard-container custom-scrollbar">
      {/* ── HEADER ── */}
      <div style={{ padding: "40px 40px 20px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: "12px", background: "linear-gradient(90deg, #fff, var(--color-cyan-info))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <BarChart2 size={36} color="var(--color-cyan-info)" />
            ANALYSIS CENTER
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginTop: "8px", letterSpacing: "0.5px" }}>
            AI-powered deep code intelligence & diagnostics
          </p>
        </motion.div>
        
        {/* Animated Underline */}
        <motion.div 
          initial={{ width: 0 }} animate={{ width: "100px" }} transition={{ duration: 1, delay: 0.5 }}
          style={{ height: "4px", background: "var(--color-cyan-info)", marginTop: "16px", borderRadius: "2px", boxShadow: "0 0 10px rgba(0, 245, 255, 0.4)" }}
        />
      </div>

      <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* ── EMPTY STATE ── */}
        <AnimatePresence mode="wait">
          {!isAnalyzed ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="glass-panel"
              style={{ padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(0, 245, 255, 0.1)", border: "1px solid rgba(0, 245, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}
              >
                <Activity size={40} color="var(--color-cyan-info)" />
              </motion.div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "12px" }}>No Project Analyzed</h2>
              <p style={{ fontSize: "1rem", color: "var(--text-tertiary)", maxWidth: "500px", marginBottom: "32px", lineHeight: 1.6 }}>
                Upload a project in the Deployment Command Center to generate a deep code intelligence report, security scan, and performance metrics.
              </p>
              <button 
                onClick={simulateAnalysis}
                className="btn btn-primary"
                style={{ padding: "12px 32px", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Activity size={18} className="spin" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    SIMULATE UPLOAD
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: "40px" }}
            >
              {/* ── SECTION 1: DASHBOARD GRID ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ width: "4px", height: "24px", background: "var(--color-cyan-info)", borderRadius: "2px" }} />
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Project Analysis Results</h2>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <FrameworkCard data={mockFrameworkData} />
                    <CodeMetrics metrics={mockMetrics} />
                  </div>
                  <HealthGauge score={mockHealthData.score} subScores={mockHealthData.subScores} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <FileVisualizer files={mockFiles} />
                  <DependencyAnalyzer dependencies={mockDependencies} />
                </div>
              </div>
              
              {/* Section 2 and 3 will be injected here in later steps */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
