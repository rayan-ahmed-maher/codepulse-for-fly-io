"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { FileText, Folder, Activity, Code, Star, Package } from "lucide-react";

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const v = useMotionValue(0);

  useEffect(() => {
    const controls = animate(v, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (val) => setDisplay(Math.round(val)),
    });
    return controls.stop;
  }, [value, v]);

  return <span>{display}</span>;
};

export default function CodeMetrics({ metrics }) {
  const cards = [
    {
      title: "Lines of Code",
      value: metrics?.loc || 0,
      suffix: "",
      icon: Code,
      color: "var(--color-cyan-info)",
      bg: "rgba(6, 182, 212, 0.1)"
    },
    {
      title: "Total Files",
      value: metrics?.files || 0,
      suffix: "",
      icon: FileText,
      color: "var(--color-emerald-neon)",
      bg: "rgba(16, 185, 129, 0.1)"
    },
    {
      title: "Folder Depth",
      value: metrics?.depth || 0,
      suffix: " levels",
      icon: Folder,
      color: "var(--color-violet-accent)",
      bg: "rgba(139, 92, 246, 0.1)"
    },
    {
      title: "Most Common Lang",
      valueStr: metrics?.commonLang || "N/A",
      icon: Star,
      color: "var(--color-pink-accent)",
      bg: "rgba(236, 72, 153, 0.1)"
    },
    {
      title: "Largest File",
      valueStr: metrics?.largestFile || "N/A",
      icon: Package,
      color: "var(--color-amber-warning)",
      bg: "rgba(245, 158, 11, 0.1)"
    },
    {
      title: "Complexity Score",
      value: metrics?.complexity || 0,
      suffix: "/100",
      icon: Activity,
      color: "var(--color-rose-danger)",
      bg: "rgba(244, 63, 94, 0.1)"
    }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 + (i * 0.05), type: "spring" }}
          whileHover={{ y: -4, boxShadow: `0 8px 24px ${card.bg}` }}
          className="glass-panel"
          style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderBottom: `2px solid ${card.color}` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <card.icon size={16} color={card.color} />
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {card.title}
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {card.valueStr ? (
              <span style={{ fontSize: card.title === "Largest File" ? "1rem" : "inherit" }}>{card.valueStr}</span>
            ) : (
              <>
                <AnimatedNumber value={card.value} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontWeight: 500, marginLeft: "2px" }}>{card.suffix}</span>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
