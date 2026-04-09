// src/Inventory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useContext } from "react";
import { toast } from "react-toastify";
import { MaintenanceContext } from "../context/MaintenanceContext";
import {
  FaSearch, FaRegCalendarPlus, FaCalendarAlt, FaRegCalendarCheck,
  FaFileAlt, FaTrashAlt, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import {
  FiPackage, FiUploadCloud, FiAlertTriangle, FiAlertOctagon, FiRefreshCw,
  FiBarChart2,
} from "react-icons/fi";
import { MdOutlineWarningAmber } from "react-icons/md";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Scoped styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); }
    70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .inv-root { animation: fadeUp 0.4s ease both; }
  .inv-card { animation: fadeUp 0.4s ease both; }
  .inv-card:nth-child(1) { animation-delay: 0.05s; }
  .inv-card:nth-child(2) { animation-delay: 0.1s;  }
  .inv-card:nth-child(3) { animation-delay: 0.15s; }
  .inv-card:nth-child(4) { animation-delay: 0.2s;  }

  .inv-tab-panel { animation: slideIn 0.25s ease both; }

  .inv-spinner {
    width: 32px; height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #6d28d9;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
    margin: 0 auto;
  }

  .inv-input {
    padding: 0.55rem 0.85rem 0.55rem 2.3rem;
    border: 1px solid #e2e8f0; border-radius: 10px;
    font-size: 0.8rem; color: #1e293b; background: #fff;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%; box-sizing: border-box;
  }
  .inv-input:focus { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109,40,217,0.1); }

  .inv-select {
    padding: 0.55rem 0.85rem 0.55rem 2.1rem;
    border: 1px solid #e2e8f0; border-radius: 10px;
    font-size: 0.8rem; color: #1e293b; background: #fff;
    outline: none; cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s; appearance: none;
  }
  .inv-select:focus { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109,40,217,0.1); }

  .inv-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  .inv-table thead th {
    background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.05em;
    padding: 0.7rem 1rem; text-align: left;
    border-bottom: 1px solid #e2e8f0; white-space: nowrap;
  }
  .inv-table tbody td {
    padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;
    color: #374151; vertical-align: middle;
  }
  .inv-table tbody tr:hover td { background: #f8fafc; }
  .inv-table tbody tr:last-child td { border-bottom: none; }

  .inv-row-critical td { background: #fff5f5 !important; }
  .inv-row-critical:hover td { background: #fee2e2 !important; }
  .inv-row-warn td { background: #fffbeb !important; }
  .inv-row-warn:hover td { background: #fef3c7 !important; }

  .inv-expiry-critical {
    display: inline-flex; align-items: center; gap: 4px;
    background: #fee2e2; color: #dc2626;
    padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;
    animation: pulse-ring 1.8s ease infinite;
  }
  .inv-expiry-warn {
    display: inline-flex; align-items: center; gap: 4px;
    background: #fef3c7; color: #b45309;
    padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600;
  }
  .inv-expiry-ok { font-size: 0.8rem; color: #374151; }

  .inv-page-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 32px; height: 32px; padding: 0 8px;
    border: 1px solid #e2e8f0; border-radius: 8px;
    background: #fff; color: #475569; font-size: 0.8rem;
    cursor: pointer; transition: all 0.15s; gap: 4px;
  }
  .inv-page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
  .inv-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .inv-page-btn.active { background: #6d28d9; border-color: #6d28d9; color: #fff; }

  .inv-delete-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid #fecaca; background: #fff5f5; color: #dc2626;
    cursor: pointer; transition: all 0.15s; font-size: 0.75rem;
  }
  .inv-delete-btn:hover:not(:disabled) { background: #fee2e2; border-color: #f87171; }
  .inv-delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .inv-view-link {
    display: inline-flex; align-items: center; gap: 4px;
    color: #6d28d9; font-size: 0.78rem; font-weight: 500;
    text-decoration: none; padding: 3px 8px; border-radius: 6px;
    border: 1px solid #ddd6fe; background: #f5f3ff; transition: all 0.15s;
  }
  .inv-view-link:hover { background: #ede9fe; border-color: #c4b5fd; }

  /* ── Analytics styles ── */
  .ana-tab-bar {
    display: flex; border-bottom: 1px solid #e2e8f0;
    padding: 0 1rem;
  }
  .ana-tab-btn {
    padding: 0.75rem 1rem; font-size: 0.78rem; font-weight: 500;
    border: none; background: none; cursor: pointer;
    color: #64748b; border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: all 0.15s; white-space: nowrap;
  }
  .ana-tab-btn.active { color: #6d28d9; border-bottom-color: #6d28d9; }
  .ana-tab-btn:hover:not(.active) { color: #1e293b; }

  .ana-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .ana-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .ana-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }

  .ana-card {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 12px; padding: 1rem;
  }
  .ana-card-label { font-size: 0.7rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .ana-card-value { font-size: 1.6rem; font-weight: 700; color: #0f172a; line-height: 1; }
  .ana-card-sub { font-size: 0.7rem; color: #94a3b8; margin-top: 3px; }
  .ana-card-accent { height: 3px; border-radius: 2px; margin-bottom: 8px; }

  .ana-stat-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 0; border-bottom: 1px solid #f1f5f9;
    font-size: 0.78rem;
  }
  .ana-stat-row:last-child { border-bottom: none; }
  .ana-stat-lbl { color: #64748b; }
  .ana-stat-val { font-weight: 600; color: #1e293b; }

  .ana-section-title { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }

  .ana-forecast-row {
    display: flex; align-items: center; gap: 10px; padding: 6px 0;
    border-bottom: 1px solid #f1f5f9; font-size: 0.75rem;
  }
  .ana-forecast-row:last-child { border-bottom: none; }
  .ana-forecast-month { min-width: 64px; color: #64748b; }
  .ana-bar-wrap { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .ana-bar { height: 100%; border-radius: 3px; }
  .ana-forecast-count { min-width: 20px; text-align: right; font-weight: 600; color: #1e293b; font-size: 0.72rem; }

  .ana-health-bar { height: 10px; border-radius: 5px; overflow: hidden; display: flex; margin-bottom: 10px; }
  .ana-health-seg { height: 100%; }

  .ana-legend-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.75rem; color: #64748b; margin-bottom: 5px;
  }
  .ana-legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
  .ana-legend-val { margin-left: auto; font-weight: 600; color: #1e293b; }

  .ana-bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; margin-bottom: 6px; }
  .ana-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .ana-bar-col-bar { width: 100%; border-radius: 3px 3px 0 0; background: #c4b5fd; min-height: 2px; }
  .ana-bar-col-bar.highlight { background: #6d28d9; }
  .ana-bar-col-lbl { font-size: 0.62rem; color: #94a3b8; }

  .ana-batch-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 5px 10px; font-size: 0.72rem;
    margin: 3px;
  }
  .ana-badge {
    font-size: 0.65rem; font-weight: 600; padding: 1px 6px; border-radius: 20px;
  }
  .ana-badge-red   { background: #fee2e2; color: #dc2626; }
  .ana-badge-amber { background: #fef3c7; color: #b45309; }
  .ana-badge-green { background: #dcfce7; color: #15803d; }
  .ana-badge-blue  { background: #dbeafe; color: #1d4ed8; }
  .ana-badge-gray  { background: #f1f5f9; color: #475569; }

  .ana-dup-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.78rem;
  }
  .ana-dup-row:last-child { border-bottom: none; }

  .ana-empty { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.78rem; }

  .inv-card-tab-wrap {
    background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden;
  }
  .inv-card-tab-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; border-bottom: 1px solid #e2e8f0;
    background: #fff;
  }
  .inv-main-tabs { display: flex; }
  .inv-main-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 500;
    border: none; background: none; cursor: pointer;
    color: #64748b; border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: all 0.15s;
  }
  .inv-main-tab.active { color: #6d28d9; border-bottom-color: #6d28d9; }
  .inv-main-tab:hover:not(.active) { color: #1e293b; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
  const d = new Date(dateStr), t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};
const daysUntil = (dateStr) => {
  const now = new Date(); now.setHours(0,0,0,0);
  const end = new Date(dateStr); end.setHours(0,0,0,0);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
const avg = (arr) => arr.length ? Math.round(arr.reduce((a,b) => a+b, 0) / arr.length) : 0;

// ── Insight card (top row, always visible) ────────────────────────────────────
const InsightCard = ({ icon: Icon, label, value, sub, accent, delay }) => (
  <div className="inv-card bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-start gap-4 shadow-sm" style={{ animationDelay: delay }}>
    <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: accent + "1a" }}>
      <Icon style={{ color: accent, fontSize: "1.2rem" }} />
    </div>
    <div className="min-w-0">
      <p className="text-[#64748b] text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#0f172a] leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Expiry alert strip ────────────────────────────────────────────────────────
const ExpiryAlertStrip = ({ products, count }) => {
  const [open, setOpen] = useState(false);
  const criticalItems = useMemo(() =>
    products.map(p => ({ ...p, days: daysUntil(p.endDate) }))
      .filter(p => p.days >= 0 && p.days <= 7)
      .sort((a,b) => a.days - b.days),
    [products]
  );
  return (
    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] text-sm text-[#dc2626]">
      <div className="flex items-center gap-3 px-4 py-3">
        <FiAlertOctagon className="text-lg shrink-0" />
        <span><strong>{count} document{count > 1 ? "s" : ""}</strong> will expire within 7 days. They are highlighted in red below.</span>
        <button
          onClick={() => setOpen(o => !o)}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] border border-[#fca5a5] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {open ? "Hide" : "Show"} Batches
          <FaChevronRight style={{ fontSize: "0.6rem", transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </div>
      {open && (
        <div className="border-t border-[#fecaca] px-4 py-3 flex flex-wrap gap-2">
          {criticalItems.map(item => (
            <div key={item._id} className="flex items-center gap-2 bg-white border border-[#fca5a5] rounded-lg px-3 py-1.5 shadow-sm">
              <FiAlertOctagon className="text-[#dc2626] shrink-0" style={{ fontSize: "0.75rem" }} />
              <span className="font-semibold text-[#1e293b] text-xs">{item.docId}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: item.days === 0 ? "#dc2626" : "#fee2e2", color: item.days === 0 ? "#fff" : "#b91c1c" }}>
                {item.days === 0 ? "Expires Today!" : `${item.days}d left`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Analytics Panel ───────────────────────────────────────────────────────────
const AnalyticsPanel = ({ products }) => {
  const [anaTab, setAnaTab] = useState("overview");

  const stats = useMemo(() => {
    const now = new Date();
    const daysArr = products.map(p => daysUntil(p.endDate));
    const expired  = products.filter((_, i) => daysArr[i] < 0);
    const critical = products.filter((_, i) => daysArr[i] >= 0 && daysArr[i] <= 7);
    const warning  = products.filter((_, i) => daysArr[i] > 7 && daysArr[i] <= 30);
    const safe     = products.filter((_, i) => daysArr[i] > 30);

    const todayUps  = products.filter(p => isToday(p.uploadedAt));
    const thisWeek  = products.filter(p => (now - new Date(p.uploadedAt)) / 864e5 <= 7);
    const thisMonth = products.filter(p => { const d = new Date(p.uploadedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });

    const validityDays = products.map(p => Math.round((new Date(p.endDate) - new Date(p.startDate)) / 864e5)).filter(d => d > 0);

    // Upload by month (last 6)
    const monthLabels = [], monthCounts = [], monthKeys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleString("default", { month: "short" }));
      monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
      monthCounts.push(0);
    }
    products.forEach(p => {
      const d = new Date(p.uploadedAt);
      const idx = monthKeys.indexOf(`${d.getFullYear()}-${d.getMonth()}`);
      if (idx >= 0) monthCounts[idx]++;
    });

    // Weekday distribution
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const wdCounts = [0,0,0,0,0,0,0];
    products.forEach(p => { wdCounts[new Date(p.uploadedAt).getDay()]++; });
    const maxWd = Math.max(...wdCounts);
    const busiest = weekdays[wdCounts.indexOf(maxWd)];

    // Expiry forecast next 6 months
    const forecastMonths = [], forecastCounts = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      forecastMonths.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
      forecastCounts.push(products.filter(p => { const e = new Date(p.endDate); return e.getFullYear() === d.getFullYear() && e.getMonth() === d.getMonth(); }).length);
    }

    // Duplicates
    const batchCount = {};
    products.forEach(p => { batchCount[p.docId] = (batchCount[p.docId] || 0) + 1; });
    const duplicates = Object.entries(batchCount).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

    // Validity buckets
const vBuckets = { "< 30d": 0, "30–90d": 0, "90–180d": 0, "180–365d": 0, "1–2 yrs": 0, "2–3 yrs": 0, "3yrs+": 0 };
validityDays.forEach(d => {
  if (d < 30) vBuckets["< 30d"]++;
  else if (d <= 90) vBuckets["30–90d"]++;
  else if (d <= 180) vBuckets["90–180d"]++;
  else if (d <= 365) vBuckets["180–365d"]++;
  else if (d <= 730) vBuckets["1–2 yrs"]++;
  else if (d <= 1095) vBuckets["2–3 yrs"]++;
  else vBuckets["3yrs+"]++;
});

    const sorted = [...products].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const newest = sorted[0];
    const oldest = [...products].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
    const longestValid = [...products].sort((a, b) => daysUntil(b.endDate) - daysUntil(a.endDate))[0];
    const daysSinceLast = newest ? Math.floor((now - new Date(newest.uploadedAt)) / 864e5) : "—";

    return {
      expired, critical, warning, safe, daysArr,
      todayUps, thisWeek, thisMonth,
      validityDays, monthLabels, monthCounts,
      weekdays, wdCounts, maxWd, busiest,
      forecastMonths, forecastCounts,
      duplicates, batchCount, vBuckets,
      newest, oldest, longestValid, daysSinceLast,
      lastMonthCount: monthCounts[4] || 0,
      thisMonthCount: monthCounts[5] || 0,
    };
  }, [products]);

  const tot = products.length || 1;

  const AnaCard = ({ label, value, sub, accent }) => (
    <div className="ana-card">
      <div className="ana-card-accent" style={{ background: accent }} />
      <div className="ana-card-label">{label}</div>
      <div className="ana-card-value">{value}</div>
      {sub && <div className="ana-card-sub">{sub}</div>}
    </div>
  );

  const StatRow = ({ label, value }) => (
    <div className="ana-stat-row">
      <span className="ana-stat-lbl">{label}</span>
      <span className="ana-stat-val">{value}</span>
    </div>
  );

  const ForecastRow = ({ month, count, max, colors }) => {
    const pct = max ? Math.round(count / max * 100) : 0;
    const color = colors ? colors(count) : (count === 0 ? "#e2e8f0" : count >= 5 ? "#dc2626" : count >= 3 ? "#f59e0b" : "#378ADD");
    return (
      <div className="ana-forecast-row">
        <span className="ana-forecast-month">{month}</span>
        <div className="ana-bar-wrap"><div className="ana-bar" style={{ width: pct + "%", background: color }} /></div>
        <span className="ana-forecast-count">{count}</span>
      </div>
    );
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "expiry",   label: "Expiry Health" },
    { id: "uploads",  label: "Upload Trends" },
    { id: "quality",  label: "Data Quality" },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="ana-tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`ana-tab-btn ${anaTab === t.id ? "active" : ""}`} onClick={() => setAnaTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 inv-tab-panel">

        {/* ── OVERVIEW ── */}
        {anaTab === "overview" && (
          <div className="space-y-4">
            <div className="ana-grid-4">
              <AnaCard label="Total Records" value={products.length} sub="All documents" accent="#7F77DD" />
              <AnaCard label="Need Attention" value={stats.expired.length + stats.critical.length + stats.warning.length} sub="Expired + expiring soon" accent="#dc2626" />
              <AnaCard label="Safe Documents" value={stats.safe.length} sub={`${Math.round(stats.safe.length / tot * 100)}% of total`} accent="#639922" />
              <AnaCard label="Avg Validity" value={avg(stats.validityDays) + "d"} sub="Per document" accent="#378ADD" />
            </div>

            <div className="ana-grid-2">
              {/* Health breakdown */}
              <div>
                <div className="ana-section-title">Document health</div>
                <div className="ana-health-bar">
                  {[["#dc2626", stats.expired.length], ["#f59e0b", stats.critical.length], ["#fbbf24", stats.warning.length], ["#639922", stats.safe.length]].map(([c, v], i) => (
                    <div key={i} className="ana-health-seg" style={{ width: Math.round(v / tot * 100) + "%", background: c }} />
                  ))}
                </div>
                {[["#dc2626","Expired",stats.expired.length],["#f59e0b","Critical (≤7d)",stats.critical.length],["#fbbf24","Warning (≤30d)",stats.warning.length],["#639922","Safe (>30d)",stats.safe.length]].map(([c,l,v]) => (
                  <div key={l} className="ana-legend-row">
                    <span className="ana-legend-dot" style={{ background: c }} />
                    {l} — {Math.round(v / tot * 100)}%
                    <span className="ana-legend-val">{v}</span>
                  </div>
                ))}
              </div>

              {/* Expiry forecast */}
              <div>
                <div className="ana-section-title">Expiry forecast — next 6 months</div>
                {stats.forecastMonths.map((m, i) => (
                  <ForecastRow key={m} month={m} count={stats.forecastCounts[i]} max={Math.max(...stats.forecastCounts, 1)} />
                ))}
              </div>
            </div>

            <div className="ana-grid-3">
              <div>
                <div className="ana-section-title">Duration</div>
                <StatRow label="Avg validity period" value={avg(stats.validityDays) + " days"} />
                <StatRow label="Avg days remaining" value={avg(stats.safe.map(p => daysUntil(p.endDate))) + " days"} />
                <StatRow label="Short-lived docs (<30d)" value={stats.validityDays.filter(d => d < 30).length} />
              </div>
              <div>
                <div className="ana-section-title">Upload activity</div>
                <StatRow label="This month" value={stats.thisMonthCount} />
                <StatRow label="Last month" value={stats.lastMonthCount} />
                <StatRow label="Busiest day" value={stats.busiest} />
                <StatRow label="Days since last upload" value={stats.daysSinceLast} />
              </div>
              <div>
                <div className="ana-section-title">Notable records</div>
                <StatRow label="Newest upload" value={stats.newest ? fmtDate(stats.newest.uploadedAt) : "—"} />
                <StatRow label="Oldest batch" value={stats.oldest ? fmtDate(stats.oldest.startDate) : "—"} />
                <StatRow label="Duplicate batch IDs" value={stats.duplicates.length} />
              </div>
            </div>
          </div>
        )}

        {/* ── EXPIRY HEALTH ── */}
        {anaTab === "expiry" && (
          <div className="space-y-4">
            <div className="ana-grid-4">
              <AnaCard label="Already Expired" value={stats.expired.length} sub="Past end date" accent="#dc2626" />
              <AnaCard label="Critical (≤7 days)" value={stats.critical.length} sub="Immediate action" accent="#f59e0b" />
              <AnaCard label="Expiring in 30 days" value={stats.warning.length} sub="Review soon" accent="#fbbf24" />
              <AnaCard label="Expiring Today" value={products.filter(p => daysUntil(p.endDate) === 0).length} sub="Act now" accent="#dc2626" />
            </div>

            <div className="ana-grid-2">
              <div>
                <div className="ana-section-title">Status breakdown</div>
                <div className="ana-health-bar">
                  {[["#dc2626", stats.expired.length], ["#f59e0b", stats.critical.length], ["#fbbf24", stats.warning.length], ["#639922", stats.safe.length]].map(([c, v], i) => (
                    <div key={i} className="ana-health-seg" style={{ width: Math.round(v / tot * 100) + "%", background: c }} />
                  ))}
                </div>
                {[["#dc2626","Expired",stats.expired.length],["#f59e0b","Critical",stats.critical.length],["#fbbf24","Warning",stats.warning.length],["#639922","Safe",stats.safe.length]].map(([c,l,v]) => (
                  <div key={l} className="ana-legend-row">
                    <span className="ana-legend-dot" style={{ background: c }} />
                    {l}<span className="ana-legend-val">{v} ({Math.round(v / tot * 100)}%)</span>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <StatRow label="Avg days remaining (safe)" value={avg(stats.safe.map(p => daysUntil(p.endDate))) + " days"} />
                  <StatRow label="Furthest expiry" value={stats.longestValid ? fmtDate(stats.longestValid.endDate) : "—"} />
                </div>
              </div>

              <div>
                <div className="ana-section-title">Batches closest to expiry</div>
                {[...stats.critical, ...stats.warning]
                  .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate))
                  .slice(0, 8)
                  .map(item => {
                    const d = daysUntil(item.endDate);
                    return (
                      <div key={item._id} className="ana-dup-row">
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#1e293b" }}>{item.docId}</span>
                        <span className={`ana-badge ${d <= 7 ? "ana-badge-red" : "ana-badge-amber"}`}>
                          {d === 0 ? "Today!" : d + "d left"}
                        </span>
                      </div>
                    );
                  })}
                {stats.critical.length === 0 && stats.warning.length === 0 && (
                  <div className="ana-empty">All documents are safe</div>
                )}
              </div>
            </div>

           <div>
  <div className="ana-section-title">Expired batches</div>
  {stats.expired.length === 0 ? (
    <div className="ana-empty">No expired documents</div>
  ) : (
    <div style={{
      height: 160,
      overflowY: "auto",
      display: "flex",
      flexWrap: "wrap",
      alignContent: "flex-start",
      gap: 6,
      padding: "2px 0",
    }}>
      {stats.expired.map(item => (
        <div key={item._id} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff5f5", border: "1px solid #fecaca",
          borderRadius: 8, padding: "4px 10px", fontSize: "0.72rem",
        }}>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{item.docId}</span>
          <span style={{
            fontSize: "0.65rem", fontWeight: 600,
            background: "#fee2e2", color: "#dc2626",
            padding: "1px 6px", borderRadius: 20,
          }}>
            {Math.abs(daysUntil(item.endDate))}d ago
          </span>
        </div>
      ))}
    </div>
  )}
</div>
          </div>
        )}

        {/* ── UPLOAD TRENDS ── */}
        {anaTab === "uploads" && (
          <div className="space-y-4">
            <div className="ana-grid-4">
              <AnaCard label="This Month" value={stats.thisMonthCount} sub={`vs ${stats.lastMonthCount} last month`} accent="#378ADD" />
              <AnaCard label="This Week" value={stats.thisWeek.length} sub="Last 7 days" accent="#7F77DD" />
              <AnaCard label="Today" value={stats.todayUps.length} sub="Uploaded so far" accent="#1D9E75" />
              <AnaCard label="Days Since Last Upload" value={stats.daysSinceLast} sub={stats.newest ? fmtDate(stats.newest.uploadedAt) : ""} accent="#888780" />
            </div>

            <div className="ana-grid-2">
              <div>
                <div className="ana-section-title">Uploads by month (last 6)</div>
                <div className="ana-bar-chart">
                  {stats.monthCounts.map((c, i) => {
                    const max = Math.max(...stats.monthCounts, 1);
                    return (
                      <div key={i} className="ana-bar-col">
                        <div className={`ana-bar-col-bar ${i === 5 ? "highlight" : ""}`} style={{ height: Math.max(4, Math.round(c / max * 72)) + "px" }} />
                        <span className="ana-bar-col-lbl">{stats.monthLabels[i]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Dark = current month</div>
              </div>

              <div>
                <div className="ana-section-title">Uploads by day of week</div>
                <div className="ana-bar-chart">
                  {stats.weekdays.map((w, i) => {
                    const max = Math.max(...stats.wdCounts, 1);
                    return (
                      <div key={w} className="ana-bar-col">
                        <div className={`ana-bar-col-bar ${stats.wdCounts[i] === stats.maxWd ? "highlight" : ""}`} style={{ height: Math.max(4, Math.round(stats.wdCounts[i] / max * 72)) + "px" }} />
                        <span className="ana-bar-col-lbl">{w}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Dark = busiest day ({stats.busiest})</div>
              </div>
            </div>

            <div>
              <div className="ana-section-title">Upload details</div>
              <div className="ana-grid-2">
                <div>
                  <StatRow label="Month-over-month change" value={(stats.thisMonthCount - stats.lastMonthCount >= 0 ? "+" : "") + (stats.thisMonthCount - stats.lastMonthCount)} />
                  <StatRow label="Busiest upload day" value={stats.busiest} />
                  <StatRow label="Most recent upload" value={stats.newest ? fmtDate(stats.newest.uploadedAt) : "—"} />
                </div>
                <div>
                  <StatRow label="Oldest document in system" value={stats.oldest ? fmtDate(stats.oldest.startDate) : "—"} />
                  <StatRow label="Newest batch" value={stats.newest ? stats.newest.docId : "—"} />
                  <StatRow label="Days since last upload" value={stats.daysSinceLast} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DATA QUALITY ── */}
        {anaTab === "quality" && (
          <div className="space-y-4">
            <div className="ana-grid-4">
              <AnaCard label="Unique Batch IDs" value={Object.keys(stats.batchCount).length} sub="Distinct identifiers" accent="#7F77DD" />
              <AnaCard label="Duplicate IDs" value={stats.duplicates.length} sub="Same ID uploaded 2+ times" accent="#dc2626" />
              <AnaCard label="Short-lived Docs" value={stats.validityDays.filter(d => d < 30).length} sub="Validity under 30 days" accent="#f59e0b" />
              <AnaCard label="Avg Validity" value={avg(stats.validityDays) + "d"} sub="Per document" accent="#1D9E75" />
            </div>

            <div className="ana-grid-2">
              <div>
                <div className="ana-section-title">Duplicate batch IDs</div>
                {stats.duplicates.length > 0
                  ? stats.duplicates.slice(0, 8).map(([id, c]) => (
                    <div key={id} className="ana-dup-row">
                      <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#1e293b" }}>{id}</span>
                      <span className="ana-badge ana-badge-red">{c} copies</span>
                    </div>
                  ))
                  : <div className="ana-empty">No duplicate batch IDs found</div>}
              </div>

              <div>
                <div className="ana-section-title">Validity duration distribution</div>
          {Object.entries(stats.vBuckets).map(([lbl, c]) => (
  <ForecastRow
    key={lbl}
    month={lbl}
    count={c}
    max={Math.max(...Object.values(stats.vBuckets), 1)}
    colors={() => ({
      "< 30d":    "#dc2626",
      "30–90d":   "#f59e0b",
      "90–180d":  "#fbbf24",
      "180–365d": "#639922",
      "1–2 yrs":  "#378ADD",
      "2–3 yrs":  "#7F77DD",
      "3yrs+":    "#1D9E75",
    })[lbl] || "#e2e8f0"}
  />
))}
              </div>
            </div>

            <div>
              <div className="ana-section-title">Lifespan stats</div>
              <div className="ana-grid-2">
                <div>
                  <StatRow label="Average validity period" value={avg(stats.validityDays) + " days"} />
                  <StatRow label="Shortest validity" value={(Math.min(...stats.validityDays) || 0) + " days"} />
                  <StatRow label="Longest validity" value={(Math.max(...stats.validityDays) || 0) + " days"} />
                </div>
                <div>
                  <StatRow label="Total duplicate copies" value={stats.duplicates.reduce((s, [, c]) => s + c, 0)} />
                  <StatRow label="Short-lived (<30d)" value={stats.validityDays.filter(d => d < 30).length} />
                  <StatRow label="Long-lived (1yr+)" value={stats.validityDays.filter(d => d > 365).length} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Inventory = () => {
  const [products, setProducts]     = useState([]);
  const [search, setSearch]         = useState("");
  const [filterYear, setFilterYear]     = useState("");
  const [filterMonth, setFilterMonth]   = useState("");
  const [filterDate, setFilterDate]     = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [loading, setLoading]       = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [mainTab, setMainTab]       = useState("records"); // "records" | "analytics"

  const itemsPerPage = 14;
  const baseUrl      = import.meta.env.VITE_BASE_URL;
  const { maintenance } = useContext(MaintenanceContext);
  const isDisabled   = maintenance.active;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${baseUrl}/api/upload/all`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteClick = (id) => { setItemToDelete(id); setDeleteDialogOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${baseUrl}/api/upload/delete/${itemToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(prev => prev.filter(item => item._id !== itemToDelete));
        toast.success("Product deleted successfully");
      } else { toast.error("Delete failed."); }
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Error deleting product");
    } finally { setDeleteDialogOpen(false); setItemToDelete(null); }
  };

  // ── Insights ───────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const today      = products.filter(p => isToday(p.uploadedAt));
    const expiring7  = products.filter(p => { const d = daysUntil(p.endDate); return d >= 0 && d <= 7; });
    const expiring30 = products.filter(p => { const d = daysUntil(p.endDate); return d > 7 && d <= 30; });
    return { total: products.length, today: today.length, critical: expiring7.length, warnSoon: expiring30.length };
  }, [products]);

  // ── Filter + paginate ──────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => products.filter(p => {
    const created    = new Date(p.uploadedAt);
    const matchYear  = filterYear  ? created.getFullYear().toString() === filterYear  : true;
    const matchMonth = filterMonth ? created.getMonth().toString() === filterMonth    : true;
    const matchDate  = filterDate  ? created.getDate().toString() === filterDate      : true;
    const searchMatch = Object.values(p).some(v => v?.toString().toLowerCase().includes(search.toLowerCase()));
    return matchYear && matchMonth && matchDate && searchMatch;
  }), [products, filterYear, filterMonth, filterDate, search]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginated  = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const years      = [...new Set(products.map(p => new Date(p.uploadedAt).getFullYear()))].sort((a, b) => b - a);

  const pageNums = [];
  if (currentPage > 2) pageNums.push(1);
  if (currentPage > 3) pageNums.push("...");
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) pageNums.push(i);
  if (currentPage < totalPages - 2) pageNums.push("...");
  if (totalPages > 1 && currentPage < totalPages - 1) pageNums.push(totalPages);

  return (
    <>
      <style>{STYLES}</style>
      <div className="inv-root p-6 space-y-5 max-w-[1300px] mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0f172a]">
              <FiPackage className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0f172a] leading-none">Inventory</h1>
              <p className="text-sm text-[#64748b] mt-0.5">All uploaded documents</p>
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e8f0] bg-white text-[#475569] text-sm font-medium hover:bg-[#f1f5f9] transition-colors">
            <FiRefreshCw className="text-sm" /> Refresh
          </button>
        </div>

        {/* ── Maintenance banner ── */}
        {isDisabled && (
          <div className="flex items-center gap-2 bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3 text-[#92400e] text-sm">
            <MdOutlineWarningAmber className="text-[#f59e0b] text-lg shrink-0" />
            Delete is disabled during maintenance mode.
          </div>
        )}

        {/* ── 4 Insight cards — always visible ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <InsightCard icon={FiPackage}       label="Total Records"       value={insights.total}    sub="All documents in system"   accent="#6d28d9" delay="0.05s" />
          <InsightCard icon={FiUploadCloud}   label="Uploaded Today"      value={insights.today}    sub={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} accent="#0891b2" delay="0.1s" />
          <InsightCard icon={FiAlertTriangle} label="Expiring in 30 Days" value={insights.warnSoon} sub="Review and renew soon"      accent="#d97706" delay="0.15s" />
          <InsightCard icon={FiAlertOctagon}  label="Expiring in 7 Days"  value={insights.critical} sub="Immediate action required"  accent="#dc2626" delay="0.2s" />
        </div>

        {/* ── Expiry alert strip ── */}
        {insights.critical > 0 && <ExpiryAlertStrip products={products} count={insights.critical} />}

        {/* ── Main card with Records / Analytics tabs ── */}
        <div className="inv-card-tab-wrap">

          {/* Tab header */}
          <div className="inv-card-tab-header">
            <div className="inv-main-tabs">
              <button className={`inv-main-tab ${mainTab === "records" ? "active" : ""}`} onClick={() => setMainTab("records")}>
                <FiPackage style={{ fontSize: "0.85rem" }} /> Records
              </button>
              <button className={`inv-main-tab ${mainTab === "analytics" ? "active" : ""}`} onClick={() => setMainTab("analytics")}>
                <FiBarChart2 style={{ fontSize: "0.85rem" }} /> Analytics
              </button>
            </div>
            {/* Record count badge — only in records tab */}
            {mainTab === "records" && (
              <span className="text-xs text-[#64748b] font-medium">{filteredProducts.length} record{filteredProducts.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {/* ── RECORDS TAB ── */}
          {mainTab === "records" && (
            <div className="inv-tab-panel">
              {/* Filters */}
              <div className="p-4 border-b border-[#e2e8f0]">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" style={{ fontSize: "0.75rem" }} />
                    <input className="inv-input" type="text" placeholder="Search batch, file, date…" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
                  </div>
                  <div className="h-5 w-px bg-[#e2e8f0] hidden sm:block" />
                  <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider hidden sm:block">Upload Date</p>
                  <div className="relative">
                    <FaRegCalendarPlus className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" style={{ fontSize: "0.7rem" }} />
                    <select className="inv-select" value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }}>
                      <option value="">All Years</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" style={{ fontSize: "0.7rem" }} />
                    <select className="inv-select" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }}>
                      <option value="">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString("default", { month: "long" })}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <FaRegCalendarCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" style={{ fontSize: "0.7rem" }} />
                    <select className="inv-select" value={filterDate} onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}>
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="inv-spinner" />
                  <p className="text-sm text-[#94a3b8]">Loading inventory…</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <th>Batch No</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Uploaded On</th>
                        <th>File</th>
                        <th style={{ width: 72 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                            <FiPackage style={{ fontSize: "2rem", margin: "0 auto 0.5rem", display: "block" }} />
                            No inventory records found
                          </td>
                        </tr>
                      ) : paginated.map((item, index) => {
                        const days   = daysUntil(item.endDate);
                        const isCrit = days >= 0 && days <= 7;
                        const isWarn = days > 7  && days <= 30;
                        return (
                          <tr key={item._id} className={isCrit ? "inv-row-critical" : isWarn ? "inv-row-warn" : ""}>
                            <td className="text-[#94a3b8] text-xs font-mono">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td><span className="font-semibold text-[#1e293b]">{item.docId}</span></td>
                            <td className="text-[#475569]">{fmtDate(item.startDate)}</td>
                            <td>
                              {isCrit ? (
                                <span className="inv-expiry-critical"><FiAlertOctagon />{days === 0 ? "Today!" : `${days}d left`}</span>
                              ) : isWarn ? (
                                <span className="inv-expiry-warn"><FiAlertTriangle style={{ fontSize: "0.7rem" }} />{days}d left</span>
                              ) : (
                                <span className="inv-expiry-ok">{fmtDate(item.endDate)}</span>
                              )}
                            </td>
                            <td>
                              <div className="text-[#374151]">{fmtDate(item.uploadedAt)}</div>
                              <div className="text-[11px] text-[#94a3b8]">{new Date(item.uploadedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                            </td>
                            <td>
                              <a href={`${baseUrl}/uploads/${item.filePath}`} target="_blank" rel="noreferrer" className="inv-view-link">
                                <FaFileAlt style={{ fontSize: "0.7rem" }} /> View
                              </a>
                            </td>
                            <td>
                              <button className="inv-delete-btn" onClick={() => !isDisabled && handleDeleteClick(item._id)} disabled={isDisabled} title={isDisabled ? "Disabled during maintenance" : "Delete batch"}>
                                <FaTrashAlt />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[#f1f5f9]">
                  <p className="text-xs text-[#94a3b8]">Page {currentPage} of {totalPages} · {filteredProducts.length} records</p>
                  <div className="flex items-center gap-1.5">
                    <button className="inv-page-btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                      <FaChevronLeft style={{ fontSize: "0.65rem" }} /> Prev
                    </button>
                    {pageNums.map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="text-[#94a3b8] text-xs px-1">…</span>
                      ) : (
                        <button key={p} className={`inv-page-btn ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                      )
                    )}
                    <button className="inv-page-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                      Next <FaChevronRight style={{ fontSize: "0.65rem" }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {mainTab === "analytics" && (
            <div className="inv-tab-panel">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="inv-spinner" />
                  <p className="text-sm text-[#94a3b8]">Loading analytics…</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <FiBarChart2 style={{ fontSize: "2rem", color: "#94a3b8" }} />
                  <p className="text-sm text-[#94a3b8]">No data to analyse yet</p>
                </div>
              ) : (
                <AnalyticsPanel products={products} />
              )}
            </div>
          )}
        </div>

      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Inventory;