"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, ShieldCheck, ExternalLink, AlertTriangle, CheckCircle, X, Star, Zap } from "lucide-react";
import { api } from "@/lib/api";
import BrandGenerator from "@/components/BrandGenerator";
import DomainHealthBadge from "@/components/DomainHealthBadge";
import TrendingDashboard from "@/components/TrendingDashboard";

// ---------- helpers ----------
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const TLD_META = {
  ".com":    { badge: "Most Popular", badgeColor: "#00D4FF" },
  ".xyz":    { badge: "Best Value",   badgeColor: "#10b981" },
  ".tech":   { badge: "Best Value",   badgeColor: "#10b981" },
  ".online": { badge: "Best Value",   badgeColor: "#10b981" },
  ".ai":     { badge: "Premium",      badgeColor: "#a855f7" },
  ".io":     { badge: "Startup Pick", badgeColor: "#6366f1" },
};

function getPriceTier(price) {
  if (price < 1000) return { color: "#10b981", label: "Budget" };
  if (price < 3000) return { color: "#00D4FF", label: "Standard" };
  return { color: "#a855f7", label: "Premium" };
}

// ---------- Success overlay ----------
function SuccessCard({ domain, priceInr, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
      <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }}
        style={{ background: "rgba(10,22,40,0.97)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 20, padding: "48px 40px", maxWidth: 440, width: "90%", textAlign: "center", boxShadow: "0 0 60px rgba(0,212,255,0.2)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer" }}><X size={20} color="rgba(255,255,255,0.4)" /></button>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: 3, duration: 0.5 }}
          style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(16,185,129,0.4)" }}>
          <CheckCircle size={40} color="#10b981" />
        </motion.div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8, color: "#fff" }}>Domain Purchased! 🎉</h2>
        <p style={{ color: "#10b981", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>{domain}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: 24 }}>Paid ₹{priceInr?.toLocaleString("en-IN")}/yr · Active for 1 year</p>
        <button onClick={onClose} className="btn btn-primary"
          style={{ background: "linear-gradient(135deg,#00D4FF,#6366f1)", border: "none", padding: "12px 32px", fontWeight: 700, width: "100%" }}>
          <ExternalLink size={16} style={{ marginRight: 8 }} /> View in My Domains
        </button>
      </motion.div>
    </motion.div>
  );
}

// ---------- Main Page ----------
export default function DomainsPage() {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [error,     setError]     = useState("");
  const [buying,    setBuying]    = useState(null);
  const [success,   setSuccess]   = useState(null);

  useEffect(() => { loadRazorpay(); }, []);

  const handleSearch = useCallback(async (overrideQuery) => {
    const q = (overrideQuery || query).trim();
    if (!q) return;
    setQuery(q);
    setSearching(true); setError(""); setResults([]);

    try {
      const data = await api.searchDomains(q);
      if (data.error) { setError(data.error); setSearching(false); return; }
      if (data.results?.length > 0) {
        setResults(data.results);
        // Log each result to trending
        const keyword = q.split(".")[0];
        data.results.forEach(d => {
          const tld = "." + d.domain.split(".").slice(1).join(".");
          api.logDomainSearch(keyword, tld, d.domain, d.available, d.price_inr).catch(() => {});
        });
      } else {
        setError("No domain results returned from API.");
      }
    } catch (err) { setError(`Failed: ${err.message}`); }
    setSearching(false);
  }, [query]);

  const handleBuyNow = async (domain, priceInr) => {
    setBuying(domain);
    try {
      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded) { alert("Failed to load Razorpay."); setBuying(null); return; }

      const orderData = await api.createPaymentOrder([domain], priceInr, null, null);
      if (orderData.status === "error") { alert(`Payment error: ${orderData.reason}`); setBuying(null); return; }

      const options = {
        key: orderData.key_id, amount: orderData.amount, currency: "INR",
        name: "DeployAI", description: `Domain: ${domain}`, order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const v = await api.verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature, null, null, [domain]);
            if (v.status === "success") setSuccess({ domain, priceInr });
            else alert("Verification failed. Contact support.");
          } catch (e) { alert(`Verification error: ${e.message}`); }
          finally { setBuying(null); }
        },
        modal: { ondismiss: () => setBuying(null) },
        theme: { color: "#00F5FF" },
      };
      new window.Razorpay(options).open();
    } catch (e) { alert(`Failed: ${e.message}`); setBuying(null); }
  };

  return (
    <div style={{ padding: 0 }}>
      <AnimatePresence>
        {success && <SuccessCard domain={success.domain} priceInr={success.priceInr} onClose={() => setSuccess(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="main-header">
        <div>
          <h1 className="text-gradient">Domain Intelligence</h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginTop: 4 }}>
            Real-time availability · Real INR pricing · AI Brand Generator · Health Scores
          </p>
        </div>
      </div>

      {/* Feature 1: AI Brand Generator */}
      <BrandGenerator onSearchDomain={(kw) => handleSearch(kw)} />

      {/* Feature 3: Trending Dashboard */}
      <TrendingDashboard onSearchDomain={(kw) => handleSearch(kw)} />

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: 20, display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <Globe size={18} color="var(--color-electric-indigo)" />
        <input type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Enter a domain name (e.g. myproject)"
          style={{ flex: 1, padding: "10px 14px", fontSize: "0.88rem" }} />
        <button className="btn btn-primary" onClick={() => handleSearch()} disabled={searching}>
          {searching ? "Searching..." : "Search"} <Search size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel"
          style={{ marginBottom: 16, padding: 16, borderLeft: "3px solid var(--color-rose-danger)", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} color="var(--color-rose-danger)" />
          <div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-rose-danger)", fontWeight: 600 }}>Search Failed</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="section-label">
            Domain Availability — via {results[0]?.source || "DNS"} &nbsp;·&nbsp;
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Prices in INR / year</span>
          </div>

          {results.map((d, i) => {
            const tld = "." + d.domain.split(".").slice(1).join(".");
            const meta = TLD_META[tld];
            const tier = d.available ? getPriceTier(d.price_inr) : null;
            const isBuying = buying === d.domain;

            return (
              <motion.div key={d.domain} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }} className="glass-panel"
                style={{
                  padding: "18px 22px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                  borderLeft: d.available ? "3px solid var(--color-emerald-neon)" : d.available === false ? "3px solid rgba(239,68,68,0.25)" : "3px solid rgba(255,255,255,0.1)",
                  boxShadow: d.available ? "0 0 20px rgba(16,185,129,0.07)" : "none",
                }}>
                {/* Left */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {d.available ? <ShieldCheck size={16} color="var(--color-emerald-neon)" /> : <Globe size={16} color="rgba(255,255,255,0.2)" />}
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: d.available ? "#fff" : "rgba(255,255,255,0.4)" }}>{d.domain}</span>
                  {meta?.badge && d.available && (
                    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, background: `${meta.badgeColor}18`, border: `1px solid ${meta.badgeColor}50`, color: meta.badgeColor, display: "flex", alignItems: "center", gap: 4 }}>
                      {meta.badge === "Most Popular" && <Star size={10} fill={meta.badgeColor} />}
                      {meta.badge === "Best Value" && <Zap size={10} />}
                      {meta.badge}
                    </span>
                  )}
                  {d.available && tier && (
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 600, background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}30` }}>{tier.label}</span>
                  )}
                  {/* Feature 2: Health Badge */}
                  <DomainHealthBadge domain={d.domain} />
                </div>

                {/* Right */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {d.available === true && (
                    <>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: tier?.color || "#10b981" }}>
                          ₹{d.price_inr?.toLocaleString("en-IN")}
                          <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>/yr</span>
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>incl. taxes</div>
                      </div>
                      <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0,212,255,0.5)" }} whileTap={{ scale: 0.97 }}
                        disabled={isBuying} onClick={() => handleBuyNow(d.domain, d.price_inr)}
                        style={{
                          padding: "10px 22px", borderRadius: 10, border: "none", cursor: isBuying ? "wait" : "pointer",
                          background: isBuying ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#00D4FF 0%,#6366f1 100%)",
                          color: "#fff", fontWeight: 700, fontSize: "0.88rem",
                          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                        }}>
                        {isBuying ? "Processing…" : <><ExternalLink size={14} /> Buy Now</>}
                      </motion.button>
                    </>
                  )}
                  {d.available === false && (
                    <span style={{ padding: "6px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.7)", border: "1px solid rgba(239,68,68,0.2)" }}>Taken</span>
                  )}
                  {d.available === null && <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>Unknown</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !searching && !error && (
        <div style={{ marginTop: 48, textAlign: "center", color: "var(--text-tertiary)" }}>
          <Globe size={52} style={{ opacity: 0.15, marginBottom: 16 }} />
          <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>Search for your perfect domain name</p>
          <p style={{ fontSize: "0.78rem", marginTop: 6, color: "rgba(255,255,255,0.2)" }}>12 TLDs · Real INR pricing · Razorpay checkout · AI Brand Generator</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
            {[".com ₹999", ".io ₹4,999", ".dev ₹1,299", ".tech ₹599", ".ai ₹8,999", ".xyz ₹199"].map(t => (
              <span key={t} style={{ padding: "4px 14px", borderRadius: 999, fontSize: "0.72rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
