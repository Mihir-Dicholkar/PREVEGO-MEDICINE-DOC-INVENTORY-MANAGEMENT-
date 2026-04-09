// src/Edit.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  UI rebuilt with Tailwind arbitrary values. Validation hook, file preview,
//  loading states, redesigned modal. ALL backend logic UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { useContext } from "react";
import { toast } from "react-toastify";
import { MaintenanceContext } from "../context/MaintenanceContext";
import { useFileValidation } from "../hooks/useFileValidation";

import { FiEdit3, FiSearch, FiX, FiCalendar, FiHash, FiClock, FiFile } from "react-icons/fi";
import { FaFilePdf } from "react-icons/fa";
import { MdOutlineWarningAmber } from "react-icons/md";

// ── Scoped styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.97) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ed-card    { animation: fadeSlideUp 0.45s ease both; }
  .ed-shake   { animation: shake 0.5s ease; }
  .ed-modal   { animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  .ed-overlay { animation: overlayIn 0.25s ease both; }

  .ed-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    display: inline-block;
  }

  .ed-input {
    width: 100%;
    padding: 0.6rem 0.9rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.875rem;
    color: #1e293b;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .ed-input:focus {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109,40,217,0.12);
  }
  .ed-input:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
  }
  .ed-input-err {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
  }
  .ed-field-err {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #dc2626;
    font-size: 0.72rem;
    margin-top: 0.3rem;
    animation: fadeSlideUp 0.25s ease;
  }

  .ed-btn-primary {
    padding: 0.7rem 1.4rem;
    background: linear-gradient(135deg, #6d28d9, #4f46e5);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .ed-btn-primary::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.55s ease;
  }
  .ed-btn-primary:not(:disabled):hover::after { left: 100%; }
  .ed-btn-primary:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(109,40,217,0.38);
  }
  .ed-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .ed-btn-ghost {
    padding: 0.7rem 1.4rem;
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
  }
  .ed-btn-ghost:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
  }
`;

const DURATION_OPTIONS = [
  { value: "custom",  label: "Custom"    },
  { value: "1yrs",    label: "1 Year"    },
  { value: "1.5yrs",  label: "1.5 Years" },
  { value: "2yrs",    label: "2 Years"   },
  { value: "2.5yrs",  label: "2.5 Years" },
  { value: "3yrs",    label: "3 Years"   },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Edit = () => {
  const [batch, setBatch]           = useState("");
  const [formData, setFormData]     = useState(null);
  const [file, setFile]             = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [formId, setFormId]         = useState(null);
  const [docId, setDocId]           = useState("");
  const [originalData, setOriginalData] = useState(null);
  const [duration, setDuration]     = useState("2yrs");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [scanMsg, setScanMsg]       = useState("");
  const [errs, setErrs]             = useState({});
  const [shakeKey, setShakeKey]     = useState(0);

  const baseUrl         = import.meta.env.VITE_BASE_URL;
  const { maintenance } = useContext(MaintenanceContext);
  const isDisabled      = maintenance.active;
  const { validate }    = useFileValidation();

  // ── Date logic — UNCHANGED ──────────────────────────────────────────────────
  const updateEndDate = (start, selectedDuration) => {
    const startObj = new Date(start);
    const endObj   = new Date(startObj);
    if      (selectedDuration === "2yrs")   endObj.setFullYear(endObj.getFullYear() + 2);
    else if (selectedDuration === "3yrs")   endObj.setFullYear(endObj.getFullYear() + 3);
    else if (selectedDuration === "1.5yrs") { endObj.setFullYear(endObj.getFullYear() + 1); endObj.setMonth(endObj.getMonth() + 6); }
    else if (selectedDuration === "1yrs")   endObj.setFullYear(endObj.getFullYear() + 1);
    else if (selectedDuration === "2.5yrs") { endObj.setFullYear(endObj.getFullYear() + 2); endObj.setMonth(endObj.getMonth() + 6); }
    endObj.setMonth(endObj.getMonth() + 1);
    setFormData((prev) => ({ ...prev, endDate: endObj.toISOString().split("T")[0] }));
  };

  const handleStartDateChange = (e) => {
    const start = e.target.value;
    setFormData((prev) => ({ ...prev, startDate: start }));
    setErrs((p) => ({ ...p, startDate: null }));
    if (start && duration !== "custom") updateEndDate(start, duration);
    else setFormData((prev) => ({ ...prev, endDate: "" }));
  };

  // ── File select + security scan ─────────────────────────────────────────────
  const handleFileSelect = async (selected, inputRef) => {
    if (!selected) return;
    setFile(null);
    setFilePreview(null);
    setScanStatus("scanning");
    setScanMsg("Scanning for threats…");
    setErrs((p) => ({ ...p, file: null }));

    const result = await validate(selected);
    if (!result.ok) {
      setScanStatus("error");
      setScanMsg(result.error);
      setErrs((p) => ({ ...p, file: result.error }));
      if (inputRef?.current) inputRef.current.value = "";
      setShakeKey((k) => k + 1);
      toast.error(result.error);
      return;
    }

    setScanStatus("ok");
    setScanMsg("File passed security check ✓");
    setFile(selected);

    if (selected.type.startsWith("image/")) {
      setFilePreview({ url: URL.createObjectURL(selected), type: "image", name: selected.name });
    } else {
      setFilePreview({ url: null, type: "pdf", name: selected.name });
    }
  };

  // ── Fetch — BACKEND LOGIC UNCHANGED ────────────────────────────────────────
  const handleFetch = async (e) => {
    e.preventDefault();
    if (!batch || batch.trim() === "") {
      setErrs({ batch: "Please enter a valid batch number." });
      setShakeKey((k) => k + 1);
      return;
    }

    setFetchLoading(true);
    setErrs({});

    try {
      const res = await fetch(`${baseUrl}/api/upload/get-by-docid/${batch}`);
      if (!res.ok) {
        let errMsg = "Batch not found.";
        try { const err = await res.json(); if (err?.error) errMsg = err.error; } catch {}
        toast.error(errMsg);
        setFetchLoading(false);
        return;
      }

      const data = await res.json();
      if (!data || !data._id || !data.docId) { toast.error("Invalid response from server."); setFetchLoading(false); return; }
      if (data.filePath) data.fileUrl = `${baseUrl}/${data.filePath}`;

      setFormId(data._id);
      setDocId(data.docId);
      setFormData(data);
      setOriginalData({ ...data });

      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end   = new Date(data.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        let detected = "custom";
        if      (months === 13) detected = "1yrs";
        else if (months === 19) detected = "1.5yrs";
        else if (months === 25) detected = "2yrs";
        else if (months === 31) detected = "2.5yrs";
        else if (months === 37) detected = "3yrs";
        setDuration(detected);
      } else {
        setDuration("custom");
      }

      setShowModal(true);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Server error while fetching. Please try again.");
    } finally {
      setFetchLoading(false);
    }
  };

  // ── hasChanges — UNCHANGED ─────────────────────────────────────────────────
  const hasChanges = () => {
    if (!formData || !originalData) return false;
    if (formData.docId !== originalData.docId || formData.startDate !== originalData.startDate || formData.endDate !== originalData.endDate) return true;
    if (file) return true;
    return false;
  };

  // ── Update — BACKEND LOGIC UNCHANGED ───────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.startDate && !formData.endDate && !file) {
      toast.error("Please update at least one field before submitting.");
      return;
    }
    if (!hasChanges()) {
      toast.error("Please make some changes before updating.");
      return;
    }

    setUpdateLoading(true);
    const updated = new FormData();
    updated.append("docId",     formData.docId);
    updated.append("startDate", formData.startDate);
    updated.append("endDate",   formData.endDate);
    if (file) updated.append("file", file);

    try {
      const res = await fetch(`${baseUrl}/api/upload/edit/${formData._id}`, {
        method: "POST",
        body:   updated,
      });

      if (res.ok) {
        toast.success("Document updated successfully!");
        setShowModal(false);
        setFormData(null);
        setFile(null);
        setFilePreview(null);
        setBatch("");
        setScanStatus(null);
      } else {
        const text = await res.text();
        console.error("Server error:", text);
        toast.error("Update failed.");
      }
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Server error while updating. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(null);
    setFile(null);
    setFilePreview(null);
    setScanStatus(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div className="p-6 max-w-3xl mx-auto">

        {/* Page title */}
        <div className="mb-6 ed-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0f172a]">
              <FiEdit3 className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0f172a] leading-none">Edit Document</h1>
              <p className="text-sm text-[#64748b] mt-0.5">Fetch a batch and update its details</p>
            </div>
          </div>
        </div>

        {/* Maintenance warning */}
        {isDisabled && (
          <div className="flex items-center gap-2 bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3 text-[#92400e] text-sm mb-5">
            <MdOutlineWarningAmber className="text-[#f59e0b] text-lg shrink-0" />
            Edits are disabled during maintenance mode.
          </div>
        )}

        {/* Fetch card */}
        <div
          key={shakeKey}
          className={`bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 ed-card ${shakeKey > 0 ? "ed-shake" : ""}`}
        >
          <fieldset disabled={isDisabled} style={{ border: "none", padding: 0, margin: 0 }}>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiHash className="text-[#6d28d9] text-xs" /> Batch Number
                </label>
                <input
                  type="text"
                  className={`ed-input ${errs.batch ? "ed-input-err" : ""}`}
                  placeholder="Enter batch number to fetch"
                  value={batch}
                  onChange={(e) => { setBatch(e.target.value.trimStart()); setErrs((p) => ({ ...p, batch: null })); }}
                  onBlur={(e) => setBatch(e.target.value.trim())}
                />
                {errs.batch && <p className="ed-field-err">⚠ {errs.batch}</p>}
              </div>

              <button
                className="ed-btn-primary w-full justify-center"
                onClick={handleFetch}
                disabled={fetchLoading || isDisabled}
              >
                {fetchLoading ? (
                  <><span className="ed-spinner" /> Fetching…</>
                ) : (
                  <><FiSearch /> Fetch Document</>
                )}
              </button>
            </div>
          </fieldset>
        </div>
      </div>

      {/* ── Modal overlay ── */}
      {showModal && formData && (
        <div
          className="ed-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="ed-modal bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">Edit Batch</h2>
                <p className="text-xs text-[#6d28d9] font-semibold mt-0.5">{formData.docId}</p>
              </div>
              <button
                onClick={closeModal}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] transition-colors"
              >
                <FiX className="text-sm" />
              </button>
            </div>

            {/* Current file preview */}
            {formData.fileUrl && (
              <div className="mx-6 mt-4">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Current File</p>
                {formData.fileUrl.match(/\.(png|jpg|jpeg)$/i) ? (
                  <img
                    src={formData.fileUrl}
                    alt="Current file"
                    className="w-full max-h-48 object-contain rounded-xl border border-[#e2e8f0] bg-[#f8fafc]"
                  />
                ) : (
                  <a
                    href={formData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#fef2f2] rounded-xl border border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                  >
                    <FaFilePdf className="text-2xl shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">View Current PDF</p>
                      <p className="text-xs text-[#94a3b8]">Click to open in new tab</p>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdate} className="px-6 py-5 space-y-4">

              {/* Batch number */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiHash className="text-[#6d28d9] text-xs" /> Batch Number
                </label>
                <input
                  type="text"
                  className="ed-input"
                  value={formData.docId}
                  onChange={(e) => setFormData({ ...formData, docId: e.target.value })}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiClock className="text-[#6d28d9] text-xs" /> Set Duration
                </label>
                <select
                  className="ed-input"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    if (formData?.startDate && e.target.value !== "custom") updateEndDate(formData.startDate, e.target.value);
                  }}
                >
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                    <FiCalendar className="text-[#6d28d9] text-xs" /> Start Date
                  </label>
                  <input
                    type="date"
                    className="ed-input"
                    value={formData.startDate?.slice(0, 10)}
                    onChange={handleStartDateChange}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                    <FiCalendar className="text-[#6d28d9] text-xs" /> End Date
                  </label>
                  <input
                    type="date"
                    className={`ed-input ${duration !== "custom" ? "opacity-50 cursor-not-allowed" : ""}`}
                    value={formData.endDate?.slice(0, 10) || ""}
                    disabled={duration !== "custom"}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Replace file */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiFile className="text-[#6d28d9] text-xs" /> Replace File
                  <span className="text-[11px] font-normal text-[#94a3b8] ml-1">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="ed-input"
                  style={{ padding: "0.45rem 0.9rem", cursor: "pointer" }}
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />

                {/* Scan status */}
                {scanStatus === "scanning" && (
                  <div className="flex items-center gap-2 mt-2 text-[#6d28d9] text-xs">
                    <span className="ed-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    {scanMsg}
                  </div>
                )}
                {scanStatus === "ok" && (
                  <p className="text-[#16a34a] text-xs mt-2">✓ {scanMsg}</p>
                )}
                {errs.file && <p className="ed-field-err">⚠ {errs.file}</p>}
              </div>

              {/* New file preview */}
              {filePreview && (
                <div className="relative bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3">
                  {filePreview.type === "image" ? (
                    <img src={filePreview.url} alt="New file" className="w-14 h-14 object-cover rounded-lg border border-[#e2e8f0]" />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center bg-[#fef2f2] rounded-lg border border-[#fecaca]">
                      <FaFilePdf className="text-[#dc2626] text-2xl" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1e293b] truncate">{filePreview.name}</p>
                    <p className="text-xs text-[#64748b]">Will replace the current file</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setFilePreview(null); setScanStatus(null); }}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca] shrink-0"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="ed-btn-primary flex-1 justify-center" disabled={updateLoading}>
                  {updateLoading ? (
                    <><span className="ed-spinner" /> Updating…</>
                  ) : (
                    "Update Document"
                  )}
                </button>
                <button type="button" className="ed-btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Edit;