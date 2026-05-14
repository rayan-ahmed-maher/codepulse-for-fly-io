"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Check, ExternalLink, Search, Bell, ChevronRight, Cpu, Play, AlertTriangle, X, Globe, Loader2, Zap,
  Activity, TrendingUp, TrendingDown, Folder, Archive, GitBranch, FileCode, FileJson, FileText, FileType
} from "lucide-react";
import UploadVortex from "@/components/UploadVortex";
import ComparisonMatrix from "@/components/ComparisonMatrix";
import ReadinessGauge from "@/components/ReadinessGauge";
import DeployStepper from "@/components/DeployStepper";

function CountUp({ end, to, duration = 2 }) {
  const target = end ?? to ?? 0;
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    let animationFrame;
    const update = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / (duration * 1000), 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);
  return <>{count}</>;
}

const PARTICLE_POSITIONS = [
  36.24, 32.11, 21.28, 95.89, 78.65, 90.29, 0.41,
  41.49, 47.19, 28.41, 22.09, 62.85, 65.92, 6.63,
  89.99, 87.59, 72.42, 15.96, 13.69, 69.29
];

const BINARY_BG = "0110100101101110011010010111010001101001011000010110110001101001011110100110010100100000011100110111100101110011011101000110010101101101".repeat(20);

const FloatingFileIcon = ({ icon: Icon, delay, initialX, initialY }) => (
  <motion.div
    initial={{ opacity: 0, x: initialX, y: initialY }}
    animate={{ 
      y: [initialY, initialY - 100, initialY],
      x: [initialX, initialX + 20, initialX - 20, initialX],
      rotate: [0, 360],
      opacity: [0.1, 0.2, 0.1]
    }}
    transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, delay, ease: "easeInOut" }}
    style={{ position: 'absolute', color: '#00D4FF', pointerEvents: 'none', zIndex: 0 }}
  >
    <Icon size={24} />
  </motion.div>
);

const FullWidthUploadZone = ({ onUpload, onGitHubImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const folderInputRef = useRef(null);
  const zipInputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const frameworkBadges = [
    { name: 'REACT', color: '#00D4FF' },
    { name: 'NEXT.JS', color: '#FFFFFF' },
    { name: 'PYTHON', color: '#FFE162' },
    { name: 'STATIC HTML', color: '#FF7E33' },
    { name: 'VUE', color: '#42D392' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      style={{
        position: 'relative', width: '100%', padding: '80px 40px',
        background: isDragging ? 'rgba(0, 245, 255, 0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isDragging ? '#00D4FF' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '24px', backdropFilter: 'blur(10px)', overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isDragging ? '0 0 60px rgba(0, 212, 255, 0.25)' : '0 10px 40px rgba(0,0,0,0.4)',
        cursor: 'pointer'
      }}
      onClick={() => folderInputRef.current?.click()}
    >
      <style>{`
        @keyframes border-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Animated Border */}
      <div style={{
        position: 'absolute', inset: '4px', border: '2px dashed transparent',
        borderRadius: '20px', pointerEvents: 'none', zIndex: 1,
        backgroundImage: `linear-gradient(${isDragging ? '#00D4FF' : 'rgba(0,212,255,0.3)'}, ${isDragging ? '#00D4FF' : 'rgba(0,212,255,0.3)'}), linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))`,
        backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box',
        maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'destination-out',
        border: '2px dashed rgba(0, 212, 255, 0.4)',
        animation: 'border-rotate 20s linear infinite'
      }} />

      {/* Floating Files */}
      <FloatingFileIcon icon={FileCode} delay={0} initialX="10%" initialY="80%" />
      <FloatingFileIcon icon={FileJson} delay={2} initialX="85%" initialY="20%" />
      <FloatingFileIcon icon={FileText} delay={4} initialX="15%" initialY="30%" />
      <FloatingFileIcon icon={FileType} delay={6} initialX="90%" initialY="70%" />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
         <motion.div 
           animate={{ 
             scale: isDragging ? 1.2 : [1, 1.15, 1],
             y: isDragging ? -20 : 0
           }} 
           transition={{ 
             scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
             y: { type: 'spring', stiffness: 300, damping: 20 }
           }}
           style={{
             width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)',
             display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px',
             boxShadow: `0 0 20px rgba(0, 212, 255, 0.4), inset 0 0 30px rgba(0, 212, 255, 0.2)`,
             border: '1px solid rgba(0, 212, 255, 0.5)'
           }}
         >
            <Rocket size={64} color={isDragging ? "#42D392" : "#00D4FF"} style={{ filter: 'drop-shadow(0 0 12px rgba(0, 212, 255, 0.8))' }} />
         </motion.div>

         <h2 style={{ 
           fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 900, 
           background: 'linear-gradient(90deg, #00F5FF, #9B4DFF)',
           WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
           letterSpacing: '4px', marginBottom: '16px', textTransform: 'uppercase'
         }}>
            {isDragging ? "Release to Upload" : "DROP YOUR PROJECT HERE"}
         </h2>
         <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', marginBottom: '48px', maxWidth: '600px' }}>
            Drag your project folder directly into the vortex, upload a .zip archive, or connect your GitHub repository to begin deployment.
         </p>

         <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
            <input type="file" ref={folderInputRef} webkitdirectory="true" directory="true" style={{ display: 'none' }} onChange={(e) => onUpload(e.target.files)} />
            <input type="file" ref={zipInputRef} accept=".zip" style={{ display: 'none' }} onChange={(e) => onUpload(e.target.files)} />
            
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}
              className="btn" onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }} 
              style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #0077FF 100%)', color: '#fff', border: 'none', padding: '14px 32px', fontWeight: 700, borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Folder size={18} /> Select Folder
            </motion.button>
            
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
              className="btn" onClick={(e) => { e.stopPropagation(); zipInputRef.current?.click(); }} 
              style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', color: '#fff', border: 'none', padding: '14px 32px', fontWeight: 700, borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Archive size={18} /> Upload .zip
            </motion.button>
            
            <motion.button whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
              className="btn" onClick={(e) => { e.stopPropagation(); onGitHubImport(); }} 
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 32px', fontWeight: 700, borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <GitBranch size={18} /> GitHub Import
            </motion.button>
         </div>

         <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {frameworkBadges.map(fw => (
               <motion.div key={fw.name}
                 whileHover={{ y: -4, background: `${fw.color}15` }}
                 style={{
                   padding: '8px 20px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800,
                   background: 'rgba(255,255,255,0.03)', border: `1px solid ${fw.color}33`,
                   color: fw.color, letterSpacing: '1px', backdropFilter: 'blur(5px)',
                   transition: 'all 0.3s ease'
                 }}>
                  {fw.name}
               </motion.div>
            ))}
         </div>
      </div>
    </motion.div>
  );
};

const HackerTerminal = () => {
  const messages = [
    "Welcome to DeployAI — The Future of Deployment",
    "Initializing neural deployment engine...",
    "Scanning for projects in the multiverse...",
    "All systems operational. Ready to deploy.",
    "Drop your project to begin the sequence.",
    "Remember: Great code deserves a great home.",
    "DeployAI — Where ideas go live.",
    "Analyzing 1,247 deployment patterns...",
    "Connecting to 4 cloud platforms...",
    "Security protocols active. Your code is safe.",
    "Pro tip: ZIP files deploy 3x faster.",
    "Ready. Waiting for your next project..."
  ];

  const colors = ['#00F5FF', '#00FF41', '#F59E0B', '#FFFFFF'];
  
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentColor, setCurrentColor] = useState(colors[1]);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    let timer;
    const currentMsg = messages[msgIndex];

    if (isDeleting) {
       timer = setTimeout(() => {
          setMsgIndex((prev) => (prev + 1) % messages.length);
          setCharIndex(0);
          setCurrentColor(colors[Math.floor(Math.random() * colors.length)]);
          setIsDeleting(false);
       }, 500); 
    } else {
       if (charIndex < currentMsg.length) {
          timer = setTimeout(() => setCharIndex(c => c + 1), 50);
       } else {
          timer = setTimeout(() => setIsDeleting(true), 1500);
       }
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, msgIndex]);

  const displayedText = messages[msgIndex].substring(0, charIndex);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{
        width: '100%', background: '#000000', borderRadius: '12px', overflow: 'hidden',
        border: '1px solid #00FF41', position: 'relative', minHeight: '320px',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.2), inset 0 0 20px rgba(0,0,0,0.8)',
        animation: 'terminal-flicker 8s infinite'
      }}
    >
       <style>{`
         @keyframes terminal-flicker {
           0%, 100% { opacity: 1; }
           50% { opacity: 0.98; }
         }
         @keyframes pulse-dot {
           0%, 100% { opacity: 1; transform: scale(1); }
           50% { opacity: 0.5; transform: scale(0.8); }
         }
         @keyframes matrix-fall {
           0% { transform: translateY(-100%); }
           100% { transform: translateY(100%); }
         }
       `}</style>

       {/* Top Bar */}
       <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0, 255, 65, 0.2)', position: 'relative', zIndex: 12 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
             <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
             <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
             <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#00FF41', fontWeight: 'bold' }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF41', animation: 'pulse-dot 1.5s infinite' }} />
             LIVE: DEPLOYAI_TERMINAL v2.0
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(0,255,65,0.6)' }}>
            UPTIME: {formatUptime(uptime)}
          </div>
       </div>

       {/* Scanline */}
       <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, transparent 50%, rgba(0, 255, 65, 0.05) 50%, rgba(0, 255, 65, 0.05))', backgroundSize: '100% 4px', zIndex: 10, opacity: 0.3 }} />

       {/* Matrix Rain Background */}
       <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.08, zIndex: 1 }}>
          {[...Array(10)].map((_, i) => {
            const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            return (
              <div key={i} style={{
                position: 'absolute', top: 0, left: `${i * 10}%`, height: '100%',
                fontFamily: 'monospace', fontSize: '14px', color: '#00FF41',
                writingMode: 'vertical-rl', textOrientation: 'upright',
                animation: `matrix-fall ${5 + Math.random() * 5}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}>
                {Array.from({length: 20}, () => matrixChars.charAt(Math.floor(Math.random() * matrixChars.length))).join('')}
              </div>
            );
          })}
       </div>

       {/* CRT Curvature overlay */}
       <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 80px rgba(0,0,0,1)', zIndex: 11 }} />

       {/* Terminal Content */}
       <div style={{ padding: '30px', minHeight: '180px', fontFamily: 'monospace', fontSize: '1.15rem', position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#00D4FF', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>root@deployai:~# ./initialize_sequence.sh</div>
          <motion.div 
             key={msgIndex} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
             style={{ display: 'inline-block', color: currentColor, textShadow: `0 0 10px ${currentColor}` }}
          >
             {displayedText}
             <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ display: 'inline-block', width: '10px', height: '1.2rem', background: '#00FF41', verticalAlign: 'middle', marginLeft: '6px', boxShadow: '0 0 10px #00FF41' }} />
          </motion.div>
       </div>
    </motion.div>
  );
}
import Terminal from "@/components/Terminal";
import TemplateCards from "@/components/TemplateCards";
import ValidationToast from "@/components/ValidationToast";
import ThreeGlobeCenterpiece from '@/components/ThreeGlobeCenterpiece';
import { api } from "@/lib/api";

const FRAMEWORK_THEMES = {
  react:   { accent: "#61dafb", glow: "rgba(97, 218, 251, 0.15)", label: "React" },
  nextjs:  { accent: "#ffffff", glow: "rgba(255, 255, 255, 0.08)", label: "Next.js" },
  vue:     { accent: "#42b883", glow: "rgba(66, 184, 131, 0.15)", label: "Vue" },
  vite:    { accent: "#646cff", glow: "rgba(100, 108, 255, 0.15)", label: "Vite" },
  fastapi: { accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)", label: "Python" },
  flask:   { accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)", label: "Flask" },
  django:  { accent: "#092e20", glow: "rgba(9, 46, 32, 0.15)", label: "Django" },
  static:  { accent: "#10b981", glow: "rgba(16, 185, 129, 0.15)", label: "Static" },
  nodejs:  { accent: "#68a063", glow: "rgba(104, 160, 99, 0.15)", label: "Node.js" },
  unknown: { accent: "#6366f1", glow: "rgba(99, 102, 241, 0.15)", label: "Unknown" },
};

// Platform visual metadata
const PLATFORM_META = {
  Vercel:     { icon: "▲", color: "#fff",    bg: "rgba(255,255,255,0.08)", features: ["Edge Network", "Instant Rollbacks", "Preview Deploys", "Serverless Functions"] },
  Netlify:    { icon: "◆", color: "#00c7b7", bg: "rgba(0,199,183,0.08)",   features: ["Form Handling", "Split Testing", "Identity", "100GB Bandwidth"] },
  Cloudflare: { icon: "⬡", color: "#f6821f", bg: "rgba(246,130,31,0.08)",  features: ["Unlimited Bandwidth", "Workers KV", "R2 Storage", "DDoS Protection"] },
  Render:     { icon: "●", color: "#46e3b7", bg: "rgba(70,227,183,0.08)",  features: ["Docker Support", "Auto-Deploy", "Managed DBs", "Background Workers"] },
};

const PLATFORM_DOMAIN_RULES = {
  Vercel: { suffix: ".vercel.app", max: 63 },
  Netlify: { suffix: ".netlify.app", max: 63 },
  Cloudflare: { suffix: ".pages.dev", max: 50 },
  Render: { suffix: ".onrender.com", max: 30 },
};

function sanitizeDomainSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\.(vercel\.app|netlify\.app|pages\.dev|onrender\.com)$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateDomainSlug(value, platform) {
  const rules = PLATFORM_DOMAIN_RULES[platform] || PLATFORM_DOMAIN_RULES.Vercel;

  if (!value) return "Enter a deployment name.";
  if (value.length < 3) return "Use at least 3 characters.";
  if (value.length > rules.max) return `${platform} allows up to ${rules.max} characters.`;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value)) {
    return "Use lowercase letters, numbers, and hyphens. Start and end with a letter or number.";
  }

  return "";
}

function buildPlatformCards(projectType, framework, backendPlatforms) {
  // Use backend recommendations if available (sorted by confidence)
  if (backendPlatforms && backendPlatforms.length > 0) {
    const cards = backendPlatforms
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .map((p, i) => {
        const meta = PLATFORM_META[p.platform] || PLATFORM_META.Vercel;
        return {
          name: p.platform,
          icon: meta.icon,
          color: meta.color,
          bg: meta.bg,
          features: meta.features,
          reason: p.reason || `Confidence: ${p.confidence}%`,
          recommended: i === 0,
          confidence: p.confidence,
        };
      });
    return cards;
  }

  // Fallback: generate cards from project type (should rarely happen)
  const cards = [];
  if (projectType === "backend") {
    cards.push({ name: "Render", ...PLATFORM_META.Render, reason: "Best for backend apps", recommended: true });
    cards.push({ name: "Vercel", ...PLATFORM_META.Vercel, reason: "Serverless functions" });
  } else if (projectType === "static") {
    cards.push({ name: "Cloudflare", ...PLATFORM_META.Cloudflare, reason: "Unlimited free bandwidth", recommended: true });
    cards.push({ name: "Netlify", ...PLATFORM_META.Netlify, reason: "Easy static hosting" });
    cards.push({ name: "Vercel", ...PLATFORM_META.Vercel, reason: "Global CDN" });
  } else {
    cards.push({ name: "Vercel", ...PLATFORM_META.Vercel, reason: "Best for frontend apps", recommended: true });
    cards.push({ name: "Netlify", ...PLATFORM_META.Netlify, reason: "Great for static + forms" });
    cards.push({ name: "Cloudflare", ...PLATFORM_META.Cloudflare, reason: "Unlimited traffic" });
  }
  return cards;
}

export default function DeployPage() {
  const [phase, setPhase] = useState("idle");
  const [currentStep, setCurrentStep] = useState("analyze");
  const [readinessScore, setReadinessScore] = useState(0);
  const [logs, setLogs] = useState([]);
  const [deployedUrl, setDeployedUrl] = useState("");
  const [framework, setFramework] = useState("unknown");
  const [projectType, setProjectType] = useState("unknown");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [stats, setStats] = useState({ total_deploys: 0, active_sites: 0, failed_deploys: 0 });
  const [deployLocked, setDeployLocked] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [localCommands, setLocalCommands] = useState([]);
  const [deployError, setDeployError] = useState(null);
  const [localPid, setLocalPid] = useState(null);
  const [localUrl, setLocalUrl] = useState("");
  const [localRunning, setLocalRunning] = useState(false);
  const [domainModal, setDomainModal] = useState(null);
  const [customDomainName, setCustomDomainName] = useState("");
  const [customDomainError, setCustomDomainError] = useState("");

  const theme = FRAMEWORK_THEMES[framework] || FRAMEWORK_THEMES.unknown;

  useEffect(() => {
    api.getStats().then(s => setStats({
      total_deploys: s?.total_deploys ?? 0,
      active_sites: s?.active_sites ?? 0,
      failed_deploys: s?.failed_deploys ?? 0,
    })).catch(() => {});
  }, [phase]);

  const pushLog = (msg) => setLogs((prev) => [...prev, msg]);

  const getSuggestedDomainName = (platformName) => {
    const baseName =
      analysisResult?.project_name ||
      analysisResult?.repo?.split("/")[1] ||
      "my-project";

    const rules = PLATFORM_DOMAIN_RULES[platformName] || PLATFORM_DOMAIN_RULES.Vercel;
    return sanitizeDomainSlug(baseName).slice(0, rules.max) || "my-project";
  };

  const applyAnalysisResult = useCallback((data, fileName) => {
    console.log("[applyAnalysisResult] Raw data received from backend:", data);
    console.log("[applyAnalysisResult] project_path:", data.project_path);
    console.log("[applyAnalysisResult] framework:", data.framework, "type:", data.project_type);

    setAnalysisResult(data);
    setFramework(data.framework || "unknown");
    setProjectType(data.project_type || "unknown");
    setReadinessScore(data.confidence || data.adjusted_score || data.readiness_score || 0);
    setDeployLocked((data.confidence || data.readiness_score || 0) < 20);
    setLocalCommands(data.local_commands || []);

    const cards = buildPlatformCards(
      data.project_type || "frontend",
      data.framework,
      data.platforms
    );
    setPlatforms(cards);

    const realLogs = [
      `$ deployai analyze ./${fileName || "project"}`,
      `â†’ INFO  Framework: ${data.framework}`,
      `â†’ INFO  Project type: ${data.project_type}`,
      `â†’ INFO  Confidence: ${data.confidence || data.readiness_score}/100`,
      `â†’ INFO  Files: ${data.file_count}`,
      `â†’ INFO  Project path: ${data.project_path}`,
      ...(data.entry_points?.map((e) => `â†’ INFO  Entry point: ${e}`) || []),
      ...(data.build_scripts?.map((s) => `âœ“ BUILD  ${s}`) || []),
      ...(data.auto_fixes?.map((f) => `ðŸ”§ FIX   ${f}`) || []),
      ...(data.issues?.map((i) => `âš  WARN   ${i}`) || []),
      ...(data.recommendations?.map((r) => `ðŸ’¡ TIP   ${r}`) || []),
      ...(data.platforms?.map((p) => `â˜… PLATFORM  ${p.platform} (${p.confidence}% â€” ${p.reason})`) || []),
      `âœ“ SUCCESS  Analysis complete`,
    ];
    setLogs(realLogs);

    setCurrentStep("scan");
    setPhase("scanned");
    setTimeout(() => { setCurrentStep("recommend"); setPhase("recommended"); }, 800);
  }, []);

  // ── REAL FILE UPLOAD ANALYSIS ──────────────────────────────
  const handleUpload = useCallback(async (files) => {
    setPhase("analyzing");
    setCurrentStep("analyze");
    setLogs([]);
    setReadinessScore(0);
    setValidationError(null);
    setDeployLocked(true);
    setDeployedUrl("");
    setDeployError(null);
    setLocalCommands([]);

    if (window.__deployai) window.__deployai.open();

    if (!files || files.length === 0) {
      setPhase("rejected");
      setValidationError({ type: "error", title: "No Files", message: "Please select files or a .zip archive to analyze." });
      return;
    }

    pushLog("$ deployai analyze ./" + (files[0]?.name || "project"));
    pushLog("→ INFO  Uploading to analysis engine...");

    try {
      const formData = new FormData();
      const isZip = files.length === 1 && files[0]?.name?.endsWith(".zip");
      let data;

      if (isZip) {
        // Single ZIP file → /analyze/project
        formData.append("file", files[0]);
        pushLog("→ INFO  Uploading ZIP to analysis engine...");
        data = await api.analyzeProject(formData);
      } else {
        // Folder/multiple files → /analyze/folder
        // Each file gets its webkitRelativePath as the filename
        for (const f of files) {
          const relativePath = f.webkitRelativePath || f.name;
          formData.append("files", new File([f], relativePath, { type: f.type }));
        }
        pushLog(`→ INFO  Uploading ${files.length} files to analysis engine...`);
        data = await api.analyzeFolder(formData);
      }

      if (!data.valid) {
        setPhase("rejected");
        setValidationError({
          type: "error",
          title: data.error === "NO_SIGNATURE" ? "No Project Signature Detected"
            : data.error === "PROJECT_TOO_SMALL" ? "Project Too Small" : "Analysis Failed",
          message: data.message || "Could not identify a valid project.",
        });
        pushLog(`✗ ERROR  ${data.message || "Analysis failed"}`);
        return;
      }

      applyAnalysisResult(data, files[0]?.webkitRelativePath?.split("/")[0] || files[0]?.name);
    } catch (err) {
      setPhase("rejected");
      setValidationError({ type: "error", title: "Backend Unreachable", message: `Could not connect to analysis engine: ${err.message}` });
      pushLog(`✗ ERROR  Backend unreachable: ${err.message}`);
    }
  }, [applyAnalysisResult]);

  // ── REAL GITHUB IMPORT ─────────────────────────────────────
  const handleGitHubImport = useCallback(async (url) => {
    setPhase("analyzing");
    setCurrentStep("analyze");
    setLogs([]);
    setReadinessScore(0);
    setValidationError(null);
    setDeployLocked(true);
    setDeployedUrl("");
    setDeployError(null);
    setLocalCommands([]);

    if (window.__deployai) window.__deployai.open();

    pushLog(`$ deployai import ${url}`);
    pushLog("→ INFO  Fetching repository via GitHub API...");

    try {
      const data = await api.analyzeGitHub(url);

      if (data.error || !data.valid) {
        setPhase("rejected");
        setValidationError({ type: "error", title: "GitHub Import Failed", message: data.error || data.message || "Could not analyze repository." });
        pushLog(`✗ ERROR  ${data.error || data.message}`);
        return;
      }

      applyAnalysisResult(data, data.repo);
    } catch (err) {
      setPhase("rejected");
      setValidationError({ type: "error", title: "GitHub API Error", message: err.message });
      pushLog(`✗ ERROR  ${err.message}`);
    }
  }, [applyAnalysisResult]);

  // ── REAL DEPLOYMENT ────────────────────────────────────────
  const openDomainModal = (platformName) => {
    if (deployLocked || phase === "deploying" || phase === "deployed") return;

    const suggested = getSuggestedDomainName(platformName);
    setDomainModal(platformName);
    setCustomDomainName(suggested);
    setCustomDomainError(validateDomainSlug(suggested, platformName));
  };

  const closeDomainModal = () => {
    setDomainModal(null);
    setCustomDomainName("");
    setCustomDomainError("");
  };

  const handleDomainNameChange = (value) => {
    if (!domainModal) return;

    const rules = PLATFORM_DOMAIN_RULES[domainModal] || PLATFORM_DOMAIN_RULES.Vercel;
    const clean = sanitizeDomainSlug(value).slice(0, rules.max);
    setCustomDomainName(clean);
    setCustomDomainError(validateDomainSlug(clean, domainModal));
  };

  const submitDomainDeploy = () => {
    if (!domainModal) return;

    const clean = sanitizeDomainSlug(customDomainName);
    const error = validateDomainSlug(clean, domainModal);
    setCustomDomainError(error);
    if (error) return;

    const platformName = domainModal;
    closeDomainModal();
    handleDeploy(platformName, clean);
  };

  const handleDeploy = async (platformName, customName) => {
    if (deployLocked) return;
    
    // ── RESET STATE BEFORE EVERY DEPLOY ──
    setDeployedUrl(null);
    setPhase("deploying");
    setCurrentStep("deploy");
    setDeployError(null);
    
    pushLog(`→ INFO  Deploying to ${platformName}...`);
    pushLog("→ INFO  Uploading files to platform API...");

    try {
      if (!analysisResult?.project_path) {
        throw new Error("Critical: project_path is missing. Please re-upload and analyze the project first.");
      }

      pushLog(`→ INFO  Requested site name: ${customName}${PLATFORM_DOMAIN_RULES[platformName]?.suffix || ""}`);

      const result = await api.deployProject({
        project_path: analysisResult.project_path,
        project_name: analysisResult.project_name || analysisResult?.repo?.split("/")[1] || "my-project",
        platform: platformName,
        framework: framework,
        file_count: analysisResult.file_count || 0,
        site_name: customName,
      });

      // Check for immediate errors (missing API keys, bad path, etc.)
      if (result.status === "ERROR" || result.error) {
        const errMsg = result.message || result.error || "Deployment failed";
        throw new Error(errMsg);
      }

      if (!result.tracking_id) {
        throw new Error("No tracking_id returned from deployment API");
      }

      pushLog(`→ INFO  Tracking ID: ${result.tracking_id}`);
      pushLog("→ INFO  Waiting for platform to confirm READY status...");

      // Poll for real status
      let attempts = 0;
      const maxAttempts = 60;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const status = await api.getDeployStatus(result.tracking_id);
          if (status.status === "READY" && status.url) {
            clearInterval(poll);
            setPhase("deployed");
            setDeployedUrl(status.url);
            pushLog(`✓ SUCCESS  Deployment complete!`);
            pushLog(`✓ READY  ${status.url}`);
            if (status.verified === false) {
              pushLog(`⚠ WARN   URL not yet verified — may still be propagating`);
            }
          } else if (status.status === "FAILED") {
            clearInterval(poll);
            setPhase("deploy-failed");
            const errMsg = status.error || "Deployment failed";
            setDeployError(errMsg);
            pushLog(`✗ ERROR  ${errMsg}`);
            if (status.sre_fix) {
              pushLog(`🔧 SRE   Root cause: ${status.sre_fix.root_cause || "Unknown"}`);
              pushLog(`🔧 SRE   Fix: ${status.sre_fix.human_fix || "Check logs"}`);
              if (status.sre_fix.ghost_command) {
                pushLog(`🔧 SRE   Run: ${status.sre_fix.ghost_command}`);
              }
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            setPhase("deploy-failed");
            setDeployError("Deployment timed out after 5 minutes");
            pushLog("✗ ERROR  Deployment timed out");
          } else {
            // Show more descriptive status messages
            const statusMsg = {
              "PENDING": "Queued...",
              "DEPLOYING": "Uploading to platform...",
              "PUSHING_TO_GITHUB": "Pushing project to GitHub...",
            }[status.status] || status.status;
            pushLog(`→ POLL   ${statusMsg} (${attempts}/${maxAttempts})`);
          }
        } catch (pollErr) {
          // Keep polling on network glitches
          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setPhase("deploy-failed");
            setDeployError("Lost connection to deployment tracker");
          }
        }
      }, 5000);
    } catch (err) {
      setPhase("deploy-failed");
      setDeployError(err.message);
      pushLog(`✗ ERROR  Deployment failed: ${err.message}`);
    }
  };

  const handleReset = () => {
    setPhase("idle"); setCurrentStep("analyze"); setReadinessScore(0);
    setLogs([]); setDeployedUrl(""); setFramework("unknown"); setProjectType("unknown");
    setAnalysisResult(null); setValidationError(null); setDeployLocked(true);
    setPlatforms([]); setLocalCommands([]); setDeployError(null);
    setLocalPid(null); setLocalUrl(""); setLocalRunning(false);
    closeDomainModal();
  };

  // ── LOCAL DEPLOY ─────────────────────────────────────────
  const handleLocalDeploy = async () => {
    if (!analysisResult) return;
    pushLog("→ INFO  Starting local server...");
    setLocalRunning(true);
    try {
      if (!analysisResult.project_path) {
        throw new Error("Critical: project_path is missing from analysis result. Please re-analyze the project.");
      }
      
      pushLog(`→ INFO  Project: ${analysisResult.project_path}`);
      pushLog(`→ INFO  Framework: ${analysisResult.framework}`);

      const result = await api.deployLocal({
        project_path: analysisResult.project_path,
        project_name: analysisResult.project_name || "local-project",
      });

      if (result.status === "RUNNING") {
        setLocalPid(result.pid);
        setLocalUrl(result.url);
        pushLog(`✓ LOCAL  Server running at ${result.url} (PID: ${result.pid})`);
        pushLog(`✓ LOCAL  Framework: ${result.framework} | Port: ${result.port}`);
        pushLog(`✓ LOCAL  Command: ${result.command}`);
        if (result.health_verified) {
          pushLog(`✓ LOCAL  Health check passed (HTTP ${result.http_status || "OK"})`);
        } else if (result.warning) {
          pushLog(`⚠ WARN   ${result.warning}`);
        }
        if (result.elapsed_seconds) {
          pushLog(`→ INFO  Started in ${result.elapsed_seconds}s`);
        }
      } else {
        setLocalRunning(false);
        const errMsg = result.error || "Local deploy failed — unknown error";
        pushLog(`✗ ERROR  ${errMsg}`);
        if (result.command) pushLog(`→ INFO  Command was: ${result.command}`);
        if (result.exit_code !== undefined) pushLog(`→ INFO  Exit code: ${result.exit_code}`);
      }
    } catch (err) {
      setLocalRunning(false);
      pushLog(`✗ ERROR  Local deploy error: ${err.message}`);
    }
  };

  const handleStopLocal = async () => {
    if (!localPid) return;
    try {
      await api.stopLocal(localPid);
      pushLog(`✓ LOCAL  Server stopped (PID: ${localPid})`);
    } catch (e) {
      pushLog(`⚠ WARN  Could not stop process: ${e.message}`);
    }
    setLocalPid(null);
    setLocalUrl("");
    setLocalRunning(false);
  };

  return (
    <>
      <div className="main-header">
        <div>
          <h1 style={{ 
            fontFamily: "var(--font-primary)", 
            fontWeight: 800, 
            background: "linear-gradient(135deg, #ffffff, #C77DFF)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent" 
          }}>Command Center</h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginTop: 4 }}>
            AI-powered deployment orchestration — real APIs only
          </p>
        </div>
        <div className="main-header-actions" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn btn-ghost btn-icon" title="Search"><Search size={20} /></button>
            <button className="btn btn-ghost btn-icon" title="Notifications"><Bell size={20} /></button>
          </div>
          
          <button className="btn-primary-glow" style={{
            padding: "10px 20px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"
          }}>
            <Rocket size={16} /> NEW DEPLOYMENT
          </button>
        </div>
      </div>

      <div style={{ 
        position: "relative", 
        width: "100%",
        height: "clamp(320px, 55vh, 500px)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        margin: "0 auto 40px auto",
        padding: "40px",
        perspective: "1500px", 
        overflow: "hidden",
        background: "radial-gradient(circle at center, #1A0A3A 0%, #050510 100%)",
        borderRadius: "var(--radius-xl)"
      }}>
        {/* Subtle animated hexagonal decorative elements at bottom */}
        <div style={{ position: "absolute", bottom: "-100px", left: "50%", transform: "translateX(-50%)", width: "400px", height: "200px", opacity: 0.15, pointerEvents: "none", zIndex: 0 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ width: "100%", height: "100%", border: "2px dashed #1A2A4A", borderRadius: "50%", position: "absolute" }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            style={{ width: "80%", height: "80%", top: "10%", left: "10%", border: "1px solid #1A2A4A", borderRadius: "50%", position: "absolute" }}
          />
        </div>
        
        {/* Fine floating particle dots */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle at 10px 10px, #ffffff 0.5px, transparent 1px)", backgroundSize: "40px 40px", animation: "particle-float 40s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.2, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle at 20px 20px, #ffffff 1px, transparent 1px)", backgroundSize: "80px 80px", animation: "particle-float 60s linear infinite reverse" }} />

        {/* WebGL 3D Globe Component */}
        <ThreeGlobeCenterpiece />
      </div>

      {/* Stats Bar */}
      <div className="stats-bar" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "40px" }}>
        {[
          { 
            value: stats.total_deploys, label: "Total Deploys", 
            icon: Rocket, color: "#00D4FF", 
            gradient: "linear-gradient(135deg, #0A1628 0%, #0D2A4A 100%)",
            trend: "up"
          },
          { 
            value: stats.active_sites, label: "Active Sites", 
            icon: Globe, color: "#10b981", 
            gradient: "linear-gradient(135deg, #0A2010 0%, #0D3A1A 100%)",
            trend: "up"
          },
          { 
            value: stats.failed_deploys, label: "Failed", 
            icon: AlertTriangle, color: "#ef4444", 
            gradient: "linear-gradient(135deg, #2A0A0A 0%, #4A0D0D 100%)",
            trend: "down"
          },
          { 
            value: 99.9, label: "Latency", 
            icon: Activity, color: "#a855f7", 
            gradient: "linear-gradient(135deg, #1A0A2A 0%, #2A0D4A 100%)",
            suffix: "ms",
            trend: "up"
          },
        ].map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -6 }}
            style={{
              position: "relative", padding: "24px", borderRadius: "20px",
              background: stat.gradient, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex", flexDirection: "column", gap: "12px",
              transition: "all 0.3s ease"
            }}
          >
            {/* Animated Border */}
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                position: "absolute", inset: 0, borderRadius: "20px",
                padding: "1px", background: `linear-gradient(45deg, transparent, ${stat.color}, transparent)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none'
              }}
            />

            {/* Sparkline Simulation */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", opacity: 0.3, pointerEvents: "none" }}>
              <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M0,35 Q10,15 20,30 T40,10 T60,25 T80,5 T100,20" fill="none" stroke={stat.color} strokeWidth="2" />
              </svg>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "12px", 
                background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", 
                justifyContent: "center", border: `1px solid ${stat.color}33`
              }}>
                <stat.icon size={24} color={stat.color} style={{ filter: `drop-shadow(0 0 8px ${stat.color})` }} />
              </div>
              <div style={{ color: stat.trend === 'up' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center' }}>
                {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </div>
            </div>

            <div style={{ zIndex: 1 }}>
              <div className="mono-label" style={{ fontSize: "0.65rem", letterSpacing: "1.5px", color: "rgba(255,255,255,0.4)" }}>{stat.label.toUpperCase()}</div>
              <div className="hero-number" style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px" }}>
                <CountUp end={stat.value} duration={2} />
                {stat.suffix && <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", marginLeft: "4px" }}>{stat.suffix}</span>}
              </div>
            </div>

            {/* Moving Gradient Background */}
            <motion.div
              animate={{ x: [-100, 100], y: [-50, 50] }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
              style={{
                position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%",
                background: `radial-gradient(circle, ${stat.color}05 0%, transparent 70%)`,
                pointerEvents: "none", zIndex: 0
              }}
            />
          </motion.div>
        ))}
      </div>

      {framework !== "unknown" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shimmer-badge"
          style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: theme.glow, border: `1px solid ${theme.accent}30`, fontSize: "0.72rem", fontWeight: 700, color: theme.accent, marginBottom: 12 }}>
          <Cpu size={12} /> {theme.label} Detected — {projectType}
        </motion.div>
      )}

      <ValidationToast show={!!validationError} type={validationError?.type} title={validationError?.title} message={validationError?.message} onDismiss={() => setValidationError(null)} />

      <AnimatePresence>
        {phase !== "idle" && phase !== "rejected" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <DeployStepper currentStep={currentStep} status={phase === "deploying" ? "loading" : "idle"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload */}
      <AnimatePresence mode="wait">
        {(phase === "idle" || phase === "rejected") && (
          <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: "flex", flexDirection: "column", gap: 16, position: 'relative' }}>
            
            <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <FullWidthUploadZone onUpload={handleUpload} onGitHubImport={handleGitHubImport} />
            </div>

            {/* Glowing Divider */}
            <div style={{ height: '1px', width: '100%', background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)', opacity: 0.5, margin: '20px 0' }} />

            <style>{`
              @keyframes mesh-shift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
            
            {/* Bottom Section with Mesh and Particles */}
            <div style={{ 
              position: 'relative', padding: '32px', borderRadius: '24px', overflow: 'hidden',
              background: 'linear-gradient(135deg, #050510, #1A0A3A, #050510)',
              backgroundSize: '400% 400%',
              animation: 'mesh-shift 15s ease infinite',
              border: '1px solid rgba(255,255,255,0.05)',
              marginTop: '20px'
            }}>
              {/* Particle Background */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                {[...Array(20)].map((_, i) => (
                  <motion.div key={i}
                    animate={{ y: [0, -400], opacity: [0, 0.2, 0] }}
                    transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 10 }}
                    style={{
                      position: 'absolute', bottom: -10, left: `${Math.random() * 100}%`,
                      width: '2px', height: '2px', background: '#00D4FF', borderRadius: '50%'
                    }}
                  />
                ))}
              </div>

              {/* Templates Section */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Zap size={18} color="#00D4FF" fill="#00D4FF" />
                      </motion.div>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", letterSpacing: "2px", textTransform: 'uppercase' }}>
                        One-Click Templates — Start Instantly
                      </span>
                    </div>
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeOut' }}
                      style={{ height: '2px', background: 'linear-gradient(90deg, #00D4FF, transparent)', marginTop: '6px' }}
                    />
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                    background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', color: '#00D4FF'
                  }}>
                    4 TEMPLATES
                  </div>
                </div>
                <TemplateCards onSelect={(t) => { /* Templates would need real files */ }} />
              </div>

              {/* Terminal Section moved below templates */}
              <div style={{ marginTop: '40px', position: 'relative', zIndex: 1 }}>
                <HackerTerminal />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {phase !== "idle" && phase !== "rejected" && (
          <motion.div className="results-area" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {readinessScore > 0 && (
              <motion.div layoutId="readiness-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border-beam-card"
                style={{ padding: 24, display: "flex", alignItems: "center", gap: 24, borderLeft: `3px solid ${theme.accent}` }}>
                <ReadinessGauge score={readinessScore} size={100} />
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>Deployment Readiness</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                    Confidence: <strong style={{ color: readinessScore >= 70 ? "var(--color-emerald-neon)" : "var(--color-amber-warning)" }}>{readinessScore}/100</strong>
                    {readinessScore >= 70 ? " — Ready for production." : " — Review issues before deploying."}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="badge badge-emerald" style={{ background: `${theme.accent}20`, color: theme.accent }}>{theme.label}</span>
                    {analysisResult?.has_build_script && <span className="badge badge-indigo">Build Script ✓</span>}
                    {analysisResult?.issues?.length > 0 && (
                      <span className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{analysisResult.issues.length} Issue{analysisResult.issues.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Run Locally */}
            {localCommands.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: 20, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Play size={16} color="var(--color-emerald-neon)" />
                    <h4 style={{ fontSize: "0.9rem" }}>Run Locally</h4>
                  </div>
                  {!localRunning ? (
                    <button className="btn btn-primary btn-sm" onClick={handleLocalDeploy} disabled={localRunning}>
                      <Play size={14} /> Start Server
                    </button>
                  ) : (
                    <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }} onClick={handleStopLocal}>
                      ■ Stop Server
                    </button>
                  )}
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-emerald-neon)" }}>
                  {localCommands.map((cmd, i) => <div key={i}>$ {cmd}</div>)}
                </div>
                {localUrl && (
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginBottom: 2 }}>Local Server Running</div>
                      <a href={localUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-cyan-info)", fontSize: "0.88rem", fontWeight: 700, textDecoration: "underline" }}>{localUrl}</a>
                      {localPid && <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", marginLeft: 8 }}>PID: {localPid}</span>}
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.open(localUrl, "_blank")}><ExternalLink size={14} /> Open</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Platforms */}
            {(phase === "recommended" || phase === "deploying" || phase === "deployed" || phase === "deploy-failed") && platforms.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 16 }}>Deploy to Platform</div>
                <div className="results-grid">
                  {platforms.map((platform, i) => (
                    <motion.div key={platform.name} layoutId={`platform-${platform.name}`} className={`platform-card glass-panel ${platform.recommended ? "recommended border-beam-card" : ""}`}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.1, type: "spring", bounce: 0.25 }}
                      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2, zIndex: 10 }}
                      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.setProperty('--mouse-x', `-1000px`);
                        e.currentTarget.style.setProperty('--mouse-y', `-1000px`);
                      }}>
                      <div className="platform-card-header">
                        <div className="platform-card-icon" style={{ background: platform.bg, color: platform.color }}>{platform.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h4 style={{ fontSize: "0.95rem" }}>{platform.name}</h4>
                            {platform.recommended && <span className="badge badge-indigo" style={{ fontSize: "0.6rem" }}>★ Best Match</span>}
                          </div>
                          <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>{platform.reason}</p>
                        </div>
                      </div>
                      
                      {/* Gradient Progress Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span className="mono-label" style={{ fontSize: "0.55rem" }}>MATCH</span>
                        <span className="mono-label" style={{ fontSize: "0.55rem", color: "var(--color-cyan)" }}>{platform.recommended ? "98%" : "64%"}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden", marginBottom: 16 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: platform.recommended ? "98%" : "64%" }}
                          transition={{ delay: 1 + i * 0.1, duration: 1.5, ease: "easeOut" }}
                          style={{ position: "absolute", inset: 0, background: platform.recommended ? "linear-gradient(90deg, var(--color-cyan), var(--color-purple))" : "linear-gradient(90deg, var(--color-pink), var(--color-orange))", boxShadow: "0 0 10px rgba(0, 245, 255, 0.4)" }}
                        />
                      </div>
                      <button className={platform.recommended ? "btn-primary-glow btn-sm" : "btn-secondary-glow btn-sm"}
                        style={{ padding: "8px 16px", borderRadius: "8px", width: "100%", cursor: "pointer", marginTop: 12, opacity: deployLocked && phase !== "deployed" ? 0.5 : 1 }}
                        disabled={deployLocked || phase === "deploying" || phase === "deployed"}
                        onClick={() => openDomainModal(platform.name)}>
                        {phase === "deploying" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Loader2 className="spin" size={14} /> DEPLOYING...</div>
                        ) : phase === "deployed" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Check size={14} /> DEPLOYED</div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Rocket size={14} /> DEPLOY TO {platform.name.toUpperCase()}</div>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Deploy Error */}
            {phase === "deploy-failed" && deployError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel"
                style={{ padding: 20, background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={18} color="#ef4444" />
                  <h3 style={{ fontSize: "0.95rem", color: "#ef4444" }}>Deployment Failed</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{deployError}</p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={handleReset}>Try Again</button>
              </motion.div>
            )}

            {/* Success */}
            {phase === "deployed" && deployedUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel"
                style={{ padding: 24, background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))", borderColor: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-emerald-neon-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={20} color="var(--color-emerald-neon)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", color: "var(--color-emerald-neon)" }}>🎉 Deployment Successful!</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      Live at <a href={deployedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-cyan-info)", textDecoration: "underline" }}>{deployedUrl}</a>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.open(deployedUrl, "_blank")}><ExternalLink size={14} /> Visit</button>
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>Deploy Another</button>
                </div>
              </motion.div>
            )}

            {logs.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="section-label">Live Build Output</div>
                <Terminal logs={logs} title="deployai — build" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {domainModal && (
          <motion.div
            className="deploy-domain-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="deploy-domain-modal glass-panel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
            >
              <div className="deploy-domain-modal-header">
                <div>
                  <div className="section-label" style={{ marginBottom: 6 }}>Deployment Name</div>
                  <h3>{domainModal}</h3>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={closeDomainModal} title="Close">
                  <X size={16} />
                </button>
              </div>

              <div className="deploy-domain-field">
                <input
                  autoFocus
                  value={customDomainName}
                  onChange={(event) => handleDomainNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitDomainDeploy();
                    if (event.key === "Escape") closeDomainModal();
                  }}
                  placeholder="my-project"
                  aria-label={`${domainModal} deployment name`}
                />
                <span>{PLATFORM_DOMAIN_RULES[domainModal]?.suffix}</span>
              </div>

              {customDomainError ? (
                <p className="deploy-domain-error">{customDomainError}</p>
              ) : (
                <p className="deploy-domain-preview">
                  {customDomainName}{PLATFORM_DOMAIN_RULES[domainModal]?.suffix}
                </p>
              )}

              <div className="deploy-domain-actions">
                <button className="btn btn-secondary btn-sm" onClick={closeDomainModal}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={submitDomainDeploy} disabled={!!customDomainError}>
                  Deploy
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
