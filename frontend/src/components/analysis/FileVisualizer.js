"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileText, Search, ChevronRight } from "lucide-react";

const getFileColor = (name) => {
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "var(--color-cyan-info)";
  if (name.endsWith(".py")) return "var(--color-emerald-neon)";
  if (name.endsWith(".css")) return "var(--color-violet-accent)";
  if (name.endsWith(".html")) return "var(--color-amber-warning)";
  if (name.endsWith(".json")) return "#eab308";
  return "var(--text-tertiary)";
};

const TreeNode = ({ node, level = 0, searchTerm }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isDir = node.type === "directory";
  
  // If searching, auto-expand and filter
  const matchesSearch = searchTerm ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
  const hasMatchingChild = isDir && node.children && node.children.some(child => 
    JSON.stringify(child).toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

  if (searchTerm && !matchesSearch && !hasMatchingChild) return null;

  return (
    <div style={{ marginLeft: level > 0 ? "16px" : "0" }}>
      <div 
        onClick={() => isDir && setIsOpen(!isOpen)}
        style={{ 
          display: "flex", alignItems: "center", padding: "4px 8px", 
          cursor: isDir ? "pointer" : "default",
          borderRadius: "4px",
          background: "transparent",
          transition: "background 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
        title={node.size ? `${(node.size / 1024).toFixed(1)} KB` : ""}
      >
        {isDir ? (
          <motion.div animate={{ rotate: isOpen || (searchTerm && hasMatchingChild) ? 90 : 0 }} style={{ marginRight: "4px", display: "flex" }}>
            <ChevronRight size={14} color="var(--text-secondary)" />
          </motion.div>
        ) : (
          <div style={{ width: "18px" }} />
        )}
        
        {isDir ? (
          <Folder size={14} color="var(--color-electric-indigo)" style={{ marginRight: "6px" }} />
        ) : (
          <FileText size={14} color={getFileColor(node.name)} style={{ marginRight: "6px" }} />
        )}
        
        <span style={{ fontSize: "0.85rem", color: isDir ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "monospace" }}>
          {node.name}
        </span>
        
        {!isDir && node.size && (
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-tertiary)", opacity: 0 }} className="file-size">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {(isOpen || (searchTerm && hasMatchingChild)) && isDir && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", borderLeft: "1px dashed rgba(255,255,255,0.1)", marginLeft: "7px" }}
          >
            {node.children.map((child, i) => (
              <TreeNode key={`${child.name}-${i}`} node={child} level={level + 1} searchTerm={searchTerm} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        div:hover > .file-size { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default function FileVisualizer({ files = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { tree, totalFiles, largest } = useMemo(() => {
    let t = [];
    let tot = 0;
    let max = { name: "", size: 0 };
    
    // Very simplified tree builder for flat array of paths
    files.forEach(f => {
      tot++;
      if (f.size > max.size) max = f;
      
      const parts = f.path.split("/");
      let current = t;
      parts.forEach((part, i) => {
        let existing = current.find(n => n.name === part);
        if (!existing) {
          existing = { 
            name: part, 
            type: i === parts.length - 1 ? "file" : "directory",
            size: i === parts.length - 1 ? f.size : null,
            children: [] 
          };
          current.push(existing);
        }
        current = existing.children;
      });
    });
    return { tree: t, totalFiles: tot, largest: max };
  }, [files]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-panel"
      style={{ padding: "24px", display: "flex", flexDirection: "column", height: "400px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <Folder size={18} color="var(--color-electric-indigo)" />
          File Structure
        </h3>
        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
          {totalFiles} files
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={14} color="var(--text-tertiary)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input 
          type="text" 
          placeholder="Search files..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: "100%", padding: "8px 12px 8px 32px", 
            background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "6px", color: "white", fontSize: "0.85rem"
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }} className="custom-scrollbar">
        {tree.map((node, i) => (
          <TreeNode key={i} node={node} searchTerm={searchTerm} />
        ))}
      </div>
      
      {largest && largest.name && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
          <span>Largest File: <span style={{ color: "var(--color-cyan-info)" }}>{largest.name.split("/").pop()}</span></span>
          <span>{(largest.size / 1024).toFixed(1)} KB</span>
        </div>
      )}
    </motion.div>
  );
}
