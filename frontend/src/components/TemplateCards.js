"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Code2, Globe, Zap, FileCode2, Atom, Layers, Cpu, Database, Sparkles } from "lucide-react";

const TEMPLATES = [
  {
    id: "react",
    name: "React Starter",
    icon: Atom,
    color: "#00D4FF",
    gradient: "linear-gradient(135deg, #0A1628 0%, #0D3B5E 100%)",
    glow: "rgba(0, 212, 255, 0.4)",
    desc: "Vite + React 19 with hot reload",
    files: ["package.json", "src/App.jsx"],
    badge: "MOST POPULAR",
    spinning: true
  },
  {
    id: "static",
    name: "Static Site",
    icon: Globe,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #0A2010 0%, #0D3A20 100%)",
    glow: "rgba(16, 185, 129, 0.4)",
    desc: "Pure HTML/CSS/JS — zero config",
    files: ["index.html", "style.css"],
    badge: "FASTEST DEPLOY"
  },
  {
    id: "python",
    name: "Python API",
    icon: Cpu,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #2A1408 0%, #3A1A08 100%)",
    glow: "rgba(245, 158, 11, 0.4)",
    desc: "FastAPI + Uvicorn starter",
    files: ["main.py", "requirements.txt"],
    badge: "BACKEND READY"
  },
  {
    id: "nextjs",
    name: "Next.js App",
    icon: Layers,
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #1A0A2E 0%, #2E0D4A 100%)",
    glow: "rgba(168, 85, 247, 0.4)",
    desc: "Next.js 16 App Router scaffold",
    files: ["package.json", "next.config.mjs"],
    badge: "FULL STACK"
  },
];

export default function TemplateCards({ onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .template-card:hover .shimmer-effect {
          animation: shimmer 1.5s infinite;
        }
        .circuit-trace {
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      {TEMPLATES.map((t, i) => (
        <motion.button
          key={t.id}
          onClick={() => onSelect(t)}
          className="template-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          whileHover={{ y: -8 }}
          whileTap={{ scale: 0.98 }}
          style={{
            height: '180px',
            padding: '24px',
            borderRadius: "20px",
            background: t.gradient,
            border: `1px solid rgba(255,255,255,0.08)`,
            borderLeft: `3px solid ${t.color}`,
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.4s ease",
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Circuit Board Pattern */}
          <div className="circuit-trace" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

          {/* Shimmer Effect */}
          <div className="shimmer-effect" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
            transform: 'translateX(-100%)', pointerEvents: 'none'
          }} />

          {/* Top Badge & Icon */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '10px', 
              background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', border: `1px solid ${t.color}22`
            }}>
              <t.icon 
                size={24} 
                color={t.color} 
                style={{ 
                  filter: `drop-shadow(0 0 8px ${t.color})`,
                  animation: t.spinning ? 'spin-slow 10s linear infinite' : 'none'
                }} 
              />
            </div>
            <div style={{ 
              padding: '4px 10px', borderRadius: '6px', fontSize: '0.6rem', 
              fontWeight: 800, background: `${t.color}22`, color: t.color,
              border: `1px solid ${t.color}44`, letterSpacing: '0.5px'
            }}>
              {t.badge}
            </div>
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", display: 'block', marginBottom: '4px' }}>
              {t.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: "flex", gap: 4 }}>
                {t.files.map((f) => (
                  <span key={f} style={{
                    fontSize: "0.6rem", padding: "2px 8px", borderRadius: "4px",
                    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                    fontFamily: "monospace", border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {f}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#10b98188', fontWeight: 600 }}>
                • Deploy in 30s
              </span>
            </div>
          </div>

          {/* Click Ripple Effect Simulation (handled by whileTap) */}
        </motion.button>
      ))}
    </div>
  );
}
