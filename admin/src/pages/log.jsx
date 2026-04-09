// src/Log.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Rebuilt with Tailwind arbitrary values (Tailwind v4 compatible).
//  Insights cards: total, created today, edited today, deleted count.
//  ALL backend logic (fetch, filter, sort, pagination) UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  FiList, FiUploadCloud, FiEdit3, FiTrash2,
  FiArrowUp, FiArrowDown, FiSearch, FiFileText,
} from "react-icons/fi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// ── Scoped styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .log-root { animation: fadeUp 0.4s ease both; }

  .log-card { animation: fadeUp 0.4s ease both; }
  .log-card:nth-child(1) { animation-delay: 0.05s; }
  .log-card:nth-child(2) { animation-delay: 0.10s; }
  .log-card:nth-child(3) { animation-delay: 0.15s; }
  .log-card:nth-child(4) { animation-delay: 0.20s; }

  .log-spinner {
    width: 32px; height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #6d28d9;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
    margin: 0 auto;
  }

  .log-input {
    padding: 0.55rem 0.85rem 0.55rem 2.3rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.8rem;
    color: #1e293b;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .log-input:focus {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109,40,217,0.1);
  }

  .log-select, .log-date-input {
    padding: 0.55rem 0.85rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.8rem;
    color: #1e293b;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .log-select:focus, .log-date-input:focus {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109,40,217,0.1);
  }

  .log-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  .log-table thead th {
    background: #f8fafc;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.7rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }
  .log-table thead th.sortable { cursor: pointer; user-select: none; }
  .log-table thead th.sortable:hover { color: #6d28d9; background: #f5f3ff; }

  .log-table tbody td {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #374151;
    vertical-align: middle;
  }
  .log-table tbody tr:hover td { background: #f8fafc; }
  .log-table tbody tr:last-child td { border-bottom: none; }
  .log-table tbody tr.log-row-deleted td { background: #fff5f5; color: #94a3b8; text-decoration: line-through; }
  .log-table tbody tr.log-row-deleted:hover td { background: #fee2e2; }
  .log-table tbody tr.log-row-deleted td a { text-decoration: none; }

  .log-badge {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 9px; border-radius: 20px;
    font-size: 0.68rem; font-weight: 600; white-space: nowrap;
  }
  .log-badge-created  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .log-badge-edited   { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .log-badge-deleted  { background: #fff5f5; color: #dc2626; border: 1px solid #fecaca; }

  .log-view-link {
    display: inline-flex; align-items: center; gap: 4px;
    color: #6d28d9; font-size: 0.78rem; font-weight: 500;
    text-decoration: none; padding: 3px 8px; border-radius: 6px;
    border: 1px solid #ddd6fe; background: #f5f3ff;
    transition: all 0.15s;
  }
  .log-view-link:hover { background: #ede9fe; border-color: #c4b5fd; }

  .log-page-btn {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 32px; height: 32px; padding: 0 8px;
    border: 1px solid #e2e8f0; border-radius: 8px;
    background: #fff; color: #475569; font-size: 0.8rem;
    cursor: pointer; transition: all 0.15s; gap: 4px;
  }
  .log-page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
  .log-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .log-page-btn.active { background: #6d28d9; border-color: #6d28d9; color: #fff; }

  .log-sort-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 0.55rem 0.9rem;
    border: 1px solid #e2e8f0; border-radius: 10px;
    background: #fff; color: #475569; font-size: 0.8rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .log-sort-btn:hover { background: #f5f3ff; border-color: #c4b5fd; color: #6d28d9; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
  const d = new Date(dateStr), t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};

// ── Insight card ──────────────────────────────────────────────────────────────
const InsightCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="log-card bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-start gap-4 shadow-sm">
    <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: accent + "1a" }}>
      <Icon style={{ color: accent, fontSize: "1.2rem" }} />
    </div>
    <div>
      <p className="text-[#64748b] text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#0f172a] leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Created: { cls: "log-badge-created", icon: <FiUploadCloud style={{ fontSize: "0.65rem" }} /> },
    Edited:  { cls: "log-badge-edited",  icon: <FiEdit3 style={{ fontSize: "0.65rem" }} /> },
    Deleted: { cls: "log-badge-deleted", icon: <FiTrash2 style={{ fontSize: "0.65rem" }} /> },
  };
  const m = map[status] || {};
  return (
    <span className={`log-badge ${m.cls || ""}`}>
      {m.icon} {status}
    </span>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const Log = () => {
  const [logs, setLogs]               = useState([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [sortAsc, setSortAsc]         = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter]       = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter]     = useState("");

  const logsPerPage = 10;
  const baseUrl     = import.meta.env.VITE_BASE_URL;

  // ── Fetch — UNCHANGED ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${baseUrl}/api/logs`);
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Error fetching logs:", err);
        toast.error("Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // ── Insights ───────────────────────────────────────────────────────────────
  const insights = useMemo(() => ({
    total:        logs.length,
    createdToday: logs.filter((l) => l.status === "Created" && isToday(l.uploadedAt)).length,
    editedToday:  logs.filter((l) => l.status === "Edited"  && isToday(l.uploadedAt)).length,
    deleted:      logs.filter((l) => l.status === "Deleted").length,
  }), [logs]);

  // ── Filter + sort — UNCHANGED ──────────────────────────────────────────────
  const filteredLogs = useMemo(() =>
    logs
      .filter((log) => !searchTerm || log.docId.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((log) => statusFilter ? log.status === statusFilter : true)
      .filter((log) => startDateFilter ? new Date(log.uploadedAt) >= new Date(startDateFilter) : true)
      .filter((log) => endDateFilter   ? new Date(log.uploadedAt) <= new Date(endDateFilter)   : true)
      .sort((a, b) =>
        sortAsc
          ? new Date(a.uploadedAt) - new Date(b.uploadedAt)
          : new Date(b.uploadedAt) - new Date(a.uploadedAt)
      ),
    [logs, searchTerm, statusFilter, startDateFilter, endDateFilter, sortAsc]
  );

  const totalPages  = Math.ceil(filteredLogs.length / logsPerPage);
  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const pageNums = [];
  if (currentPage > 2) pageNums.push(1);
  if (currentPage > 3) pageNums.push("...");
  for (let i = Math.max(1, currentPage-1); i <= Math.min(totalPages, currentPage+1); i++) pageNums.push(i);
  if (currentPage < totalPages - 2) pageNums.push("...");
  if (totalPages > 1 && currentPage < totalPages - 1) pageNums.push(totalPages);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div className="log-root p-6 space-y-5 max-w-[1300px] mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0f172a]">
            <FiList className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a] leading-none">Document Logs</h1>
            <p className="text-sm text-[#64748b] mt-0.5">Full audit trail — auto-deleted after 2 years</p>
          </div>
        </div>

        {/* ── Insight cards ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <InsightCard icon={FiList}        label="Total Log Entries" value={insights.total}        sub="All time"           accent="#6d28d9" />
          <InsightCard icon={FiUploadCloud} label="Uploaded Today"    value={insights.createdToday} sub="New documents"      accent="#0891b2" />
          <InsightCard icon={FiEdit3}       label="Edited Today"      value={insights.editedToday}  sub="Modified documents" accent="#d97706" />
          <InsightCard icon={FiTrash2}      label="Deleted (Total)"   value={insights.deleted}      sub="Removed from system" accent="#dc2626" />
        </div>

        {/* ── Controls ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4 space-y-3">
          {/* Row 1: search + sort */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input
                className="log-input w-full"
                type="text"
                placeholder="Search by Document ID…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button
              className="log-sort-btn"
              onClick={() => { setSortAsc((p) => !p); setCurrentPage(1); }}
            >
              {sortAsc
                ? <><FiArrowUp style={{ fontSize: "0.8rem" }} /> Oldest first</>
                : <><FiArrowDown style={{ fontSize: "0.8rem" }} /> Newest first</>
              }
            </button>
            <span className="text-xs text-[#94a3b8] font-medium whitespace-nowrap">
              {filteredLogs.length} entr{filteredLogs.length !== 1 ? "ies" : "y"}
            </span>
          </div>

          {/* Row 2: status + date range */}
          <div className="flex flex-wrap gap-3 items-center">
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Filter</p>

            <select
              className="log-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Status</option>
              <option value="Created">Created</option>
              <option value="Edited">Edited</option>
              <option value="Deleted">Deleted</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#94a3b8]">From</label>
              <input
                type="date"
                className="log-date-input"
                value={startDateFilter}
                onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#94a3b8]">To</label>
              <input
                type="date"
                className="log-date-input"
                value={endDateFilter}
                onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Clear filters */}
            {(statusFilter || startDateFilter || endDateFilter || searchTerm) && (
              <button
                className="text-xs text-[#6d28d9] font-medium hover:underline"
                onClick={() => { setStatusFilter(""); setStartDateFilter(""); setEndDateFilter(""); setSearchTerm(""); setCurrentPage(1); }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="log-spinner" />
              <p className="text-sm text-[#94a3b8]">Loading logs…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="log-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Document ID</th>
                    <th>File</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th
                      className="sortable"
                      onClick={() => { setSortAsc((p) => !p); setCurrentPage(1); }}
                    >
                      Date {sortAsc ? <FiArrowUp style={{ display:"inline", fontSize:"0.7rem" }} /> : <FiArrowDown style={{ display:"inline", fontSize:"0.7rem" }} />}
                    </th>
                    <th>Status</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                        <FiFileText style={{ fontSize: "2rem", margin: "0 auto 0.5rem", display: "block" }} />
                        No log entries found
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((item, index) => (
                      <tr
                        key={item._id}
                        className={item.status === "Deleted" ? "log-row-deleted" : ""}
                      >
                        <td className="text-[#94a3b8] text-xs font-mono">
                          {(currentPage - 1) * logsPerPage + index + 1}
                        </td>
                        <td className="font-semibold text-[#1e293b]">{item.docId}</td>
                        <td>
                          <a
                            href={`${baseUrl}/uploads/${item.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="log-view-link"
                          >
                            <FiFileText style={{ fontSize: "0.7rem" }} /> View
                          </a>
                        </td>
                        <td className="text-[#475569]">
                          {item.startDate ? new Date(item.startDate).toLocaleDateString("en-GB") : "—"}
                        </td>
                        <td className="text-[#475569]">
                          {item.endDate ? new Date(item.endDate).toLocaleDateString("en-GB") : "—"}
                        </td>
                        <td>
                          <div className="text-[#374151]">{new Date(item.uploadedAt).toLocaleDateString("en-GB")}</div>
                          <div className="text-[11px] text-[#94a3b8]">
                            {new Date(item.uploadedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {isToday(item.uploadedAt) && (
                            <span className="text-[10px] font-semibold text-[#0891b2] bg-[#e0f2fe] px-1.5 py-0.5 rounded-full">Today</span>
                          )}
                        </td>
                        <td><StatusBadge status={item.status} /></td>
                        <td className="text-[#64748b] text-xs max-w-[180px]">
                          {item.status === "Created"
                            ? <span className="text-[#94a3b8]">—</span>
                            : item.changes?.length
                              ? item.changes.join(", ")
                              : "Edited"
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#94a3b8]">
              Page {currentPage} of {totalPages} · {filteredLogs.length} entries
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="log-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft style={{ fontSize: "0.65rem" }} /> Prev
              </button>
              {pageNums.map((p, i) =>
                p === "..." ? (
                  <span key={`d-${i}`} className="text-[#94a3b8] text-xs px-1">…</span>
                ) : (
                  <button
                    key={p}
                    className={`log-page-btn ${currentPage === p ? "active" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="log-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight style={{ fontSize: "0.65rem" }} />
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Log;