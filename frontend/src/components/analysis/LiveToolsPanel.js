"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Shield, Zap, Trash2, Package,
  Play, RefreshCw, AlertTriangle, Check, ChevronRight, Download, X
} from "lucide-react";

const TOOLS = [
  {
    id: "ai-review",
    name: "AI Code Review",
    desc: "NVIDIA NIM scans every file for actionable improvements",
    icon: Brain,
    color: "var(--color-cyan-info)",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
    endpoint: "/api/v1/analysis/ai-review",
  },
  {
    id: "security",
    name: "Security Scanner",
    desc: "Detects hardcoded secrets, SQL injection risks & eval usage",
    icon: Shield,
    color: "var(--color-rose-danger)",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.2)",
    endpoint: "/api/v1/analysis/security-scan",
  },
  {
    id: "performance",
    name: "Performance Analyzer",
    desc: "Finds sync blocking calls, missing async handlers",
    icon: Zap,
    color: "var(--color-amber-warning)",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    endpoint: "/api/v1/analysis/performance",
  },
  {
    id: "dead-code",
    name: "Dead Code Detector",
    desc: "Spots unused imports, empty functions & TODO comments",
    icon: Trash2,
    color: "var(--color-violet-accent)",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    endpoint: "/api/v1/analysis/dead-code",
  },
  {
    id: "bundle",
    name: "Bundle Estimator",
    desc: "Estimates production bundle size and optimization savings",
    icon: Package,
    color: "var(--color-emerald-neon)",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    endpoint: "/api/v1/analysis/bundle-size",
  },
];

const SEVERITY_COLORS = {
  high: "var(--color-rose-danger)",
  medium: "var(--color-amber-warning)",
  low: "var(--color-emerald-neon)",
};

// Mock results per tool
const MOCK_RESULTS = {
  "ai-review": {
    improvements: [
      { file_name: "src/api/deploy.js", line_number: 42, severity: "high", issue: "No error handling for async operation", suggestion: "Wrap the await call in a try/catch block and show a user-facing error." },
      { file_name: "backend/api.py", line_number: 88, severity: "medium", issue: "Function is too long (120 lines)", suggestion: "Break into smaller helper functions for readability." },
      { file_name: "src/App.jsx", line_number: 15, severity: "low", issue: "Magic number 3000 used in delay", suggestion: "Extract to a named constant like ANIMATION_DELAY_MS = 3000." },
    ]
  },
  "security": {
    vulnerabilities: [
      { file_name: ".env.example", line_number: 4, type: "Hardcoded API Key", severity: "high", evidence: "API_KEY='sk-***'" },
      { file_name: "backend/db.py", line_number: 22, type: "SQL Injection Risk", severity: "high", evidence: "execute(f\"SELECT * FROM {table}\")" },
    ]
  },
  "performance": {
    issues: [
      { file_name: "backend/api.py", line_number: 55, issue: "Synchronous File Read", suggestion: "Use aiofiles for async file reading.", severity: "medium" },
      { file_name: "src/utils.js", line_number: 12, issue: "Blocking fetch without await", suggestion: "Add await before fetch() to prevent unhandled promises.", severity: "medium" },
    ]
  },
  "dead-code": {
    issues: [
      { file_name: "src/legacy.js", line_number: 7, type: "Unresolved TODO", code_snippet: "// TODO: refactor this before launch" },
      { file_name: "backend/helpers.py", line_number: 34, type: "Empty Function", code_snippet: "def process_data():" },
    ]
  },
  "bundle": {
    estimated_size: "384.50 KB",
    potential_savings: "Up to 40%",
    optimization_suggestions: [
      "Enable Tree Shaking in your bundler.",
      "Use React.lazy() for route-level code splitting.",
      "Replace 'moment' with 'date-fns' or 'dayjs'.",
    ]
  }
};

function ResultItem({ item, color, expanded, onToggle }) {
  const severity = item.severity;
  const sevColor = SEVERITY_COLORS[severity] || "var(--text-secondary)";

  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", cursor: "pointer", userSelect: "none" }}
      >
        {severity && (
          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: `${sevColor}22`, color: sevColor, textTransform: "uppercase", minWidth: "44px", textAlign: "center" }}>
            {severity}
          </span>
        )}
        <span style={{ flex: 1, fontSize: "0.82rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
          {item.file_name || item.code_snippet || "—"}{item.line_number ? `:${item.line_number}` : ""}
        </span>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
          <ChevronRight size={14} color="var(--text-tertiary)" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", paddingLeft: "12px", borderLeft: `2px solid ${color}44` }}
          >
            <div style={{ padding: "10px 12px 6px 12px" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                {item.issue || item.type || item.evidence}
              </p>
              {item.suggestion && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-emerald-neon)", display: "flex", gap: "6px", alignItems: "flex-start" }}>
                  <Check size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
                  {item.suggestion}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolCard({ tool, onRun, isRunning, results, allRunning }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const Icon = tool.icon;

  const items = results?.improvements || results?.vulnerabilities || results?.issues || [];
  const isBundleTool = tool.id === "bundle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
      style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", borderTop: `2px solid ${tool.border}` }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: tool.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${tool.border}` }}>
            <Icon size={20} color={tool.color} />
          </div>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{tool.name}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: "2px" }}>{tool.desc}</div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRun(tool)}
          disabled={isRunning || allRunning}
          className="btn btn-sm"
          style={{ background: tool.bg, color: tool.color, border: `1px solid ${tool.border}`, display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", opacity: isRunning ? 0.7 : 1 }}
        >
          {isRunning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw size={14} />
            </motion.div>
          ) : (
            <Play size={14} />
          )}
          {isRunning ? "Running..." : "Run"}
        </motion.button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "4px" }}>
            {isBundleTool ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>EST. BUNDLE SIZE</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: tool.color }}>{results.estimated_size}</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>POTENTIAL SAVINGS</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-emerald-neon)" }}>{results.potential_savings}</div>
                  </div>
                </div>
                {results.optimization_suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", fontSize: "0.82rem", color: "var(--text-secondary)", alignItems: "flex-start" }}>
                    <Check size={12} color="var(--color-emerald-neon)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{items.length} issue{items.length !== 1 ? "s" : ""} found</span>
                  {items.length > 0 && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px" }}>
                      <Download size={10} /> Export
                    </button>
                  )}
                </div>
                {items.map((item, i) => (
                  <ResultItem
                    key={i} item={item} color={tool.color}
                    expanded={expandedIdx === i}
                    onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  />
                ))}
                {items.length === 0 && (
                  <div style={{ textAlign: "center", padding: "16px", color: "var(--color-emerald-neon)", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Check size={14} /> No issues detected — looks good!
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LiveToolsPanel() {
  const [running, setRunning] = useState({});
  const [results, setResults] = useState({});
  const [allRunning, setAllRunning] = useState(false);

  const runTool = (tool) => {
    setRunning((prev) => ({ ...prev, [tool.id]: true }));
    // Simulate API call with mock data
    setTimeout(() => {
      setResults((prev) => ({ ...prev, [tool.id]: MOCK_RESULTS[tool.id] }));
      setRunning((prev) => ({ ...prev, [tool.id]: false }));
    }, 1800 + Math.random() * 1000);
  };

  const runAll = () => {
    setAllRunning(true);
    TOOLS.forEach((tool, i) => {
      setTimeout(() => {
        setRunning((prev) => ({ ...prev, [tool.id]: true }));
        setTimeout(() => {
          setResults((prev) => ({ ...prev, [tool.id]: MOCK_RESULTS[tool.id] }));
          setRunning((prev) => ({ ...prev, [tool.id]: false }));
          if (i === TOOLS.length - 1) setAllRunning(false);
        }, 2000);
      }, i * 600);
    });
  };

  const completedCount = Object.values(results).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Run All button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
          {completedCount > 0 ? `${completedCount}/${TOOLS.length} tools completed` : "Select a tool to scan your project"}
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={runAll}
          disabled={allRunning}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px" }}
        >
          {allRunning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw size={16} />
            </motion.div>
          ) : (
            <Zap size={16} />
          )}
          {allRunning ? "Running All..." : "Run All Tools"}
        </motion.button>
      </div>

      {/* Progress bar */}
      {allRunning && (
        <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${(completedCount / TOOLS.length) * 100}%` }}
            style={{ height: "100%", background: "linear-gradient(90deg, var(--color-electric-indigo), var(--color-cyan-info))" }}
          />
        </div>
      )}

      {/* Tool Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onRun={runTool}
            isRunning={!!running[tool.id]}
            results={results[tool.id]}
            allRunning={allRunning}
          />
        ))}
      </div>
    </div>
  );
}
