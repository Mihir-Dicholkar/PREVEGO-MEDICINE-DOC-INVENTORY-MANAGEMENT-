// src/Uploads.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  UI rebuilt with Tailwind (arbitrary values — compatible with your Tailwind v4
//  @theme inline setup). File preview, security validation hook, loading state.
//  ALL backend logic (handleSubmit, formData, fetch, toast) UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef } from "react";
import { useContext } from "react";
import { toast } from "react-toastify";
import { MaintenanceContext } from "../context/MaintenanceContext";
import { useFileValidation } from "../hooks/useFileValidation";

import { FiUploadCloud, FiFile, FiX, FiCalendar, FiHash, FiClock } from "react-icons/fi";
import { FaFilePdf, FaFileImage } from "react-icons/fa";
import { MdOutlineWarningAmber } from "react-icons/md";

// ── Scoped animation styles ───────────────────────────────────────────────────
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
  @keyframes dropIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .up-card    { animation: fadeSlideUp 0.45s ease both; }
  .up-shake   { animation: shake 0.5s ease; }
  .up-preview { animation: dropIn 0.3s ease both; }

  .up-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    display: inline-block;
  }

  .up-drop-zone {
    border: 2px dashed #cbd5e1;
    transition: border-color 0.2s, background 0.2s;
  }
  .up-drop-zone:hover,
  .up-drop-zone.drag-over {
    border-color: #6d28d9;
    background: #f5f3ff;
  }

  .up-input {
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
  .up-input:focus {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109,40,217,0.12);
  }
  .up-input:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
  }
  .up-input-err {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
  }

  .up-field-err {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #dc2626;
    font-size: 0.72rem;
    margin-top: 0.3rem;
    animation: fadeSlideUp 0.25s ease;
  }

  .up-submit {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #6d28d9, #4f46e5);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .up-submit::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.55s ease;
  }
  .up-submit:not(:disabled):hover::after { left: 100%; }
  .up-submit:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(109,40,217,0.4);
  }
  .up-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .up-maint {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    color: #92400e;
    font-size: 0.82rem;
    margin-bottom: 1.5rem;
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

const formatDateDisplay = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${day} ${months[parseInt(month,10)-1]} ${year}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const Uploads = () => {
  const [id, setId]             = useState("");
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null); // { url, type, name }
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]   = useState("");
  const [duration, setDuration] = useState("2yrs");
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // 'scanning' | 'ok' | 'error'
  const [scanMsg, setScanMsg]   = useState("");
  // Per-field validation errors
  const [errs, setErrs]         = useState({});
  const [shakeKey, setShakeKey] = useState(0);

  const fileInputRef           = useRef(null);
  const baseUrl                = import.meta.env.VITE_BASE_URL;
  const { maintenance }        = useContext(MaintenanceContext);
  const isDisabled             = maintenance.active;
  const { validate }           = useFileValidation();

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
    setEndDate(endObj.toISOString().split("T")[0]);
  };

  const handleStartDateChange = (e) => {
    const start = e.target.value;
    setStartDate(start);
    setErrs((p) => ({ ...p, startDate: null }));
    if (start && duration !== "custom") updateEndDate(start, duration);
    else setEndDate("");
  };

  // ── File selection + security scan ─────────────────────────────────────────
  const handleFileSelect = async (selected) => {
    if (!selected) return;
    setFile(null);
    setPreview(null);
    setScanStatus("scanning");
    setScanMsg("Scanning file for threats…");
    setErrs((p) => ({ ...p, file: null }));

    const result = await validate(selected);

    if (!result.ok) {
      setScanStatus("error");
      setScanMsg(result.error);
      setErrs((p) => ({ ...p, file: result.error }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShakeKey((k) => k + 1);
      return;
    }

    setScanStatus("ok");
    setScanMsg("File passed security check ✓");
    setFile(selected);

    // Build preview
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreview({ url, type: "image", name: selected.name });
    } else {
      setPreview({ url: null, type: "pdf", name: selected.name });
    }
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  // ── Field-level validation ─────────────────────────────────────────────────
  const validateFields = () => {
    const e = {};
    if (!id.trim())   e.id        = "Batch number is required.";
    if (!startDate)   e.startDate = "Start date is required.";
    if (!endDate)     e.endDate   = "End date is required.";
    if (!file)        e.file      = "Please upload a file.";
    if (scanStatus === "error") e.file = scanMsg;
    setErrs(e);
    if (Object.keys(e).length > 0) setShakeKey((k) => k + 1);
    return Object.keys(e).length === 0;
  };

  // ── Submit — BACKEND LOGIC UNCHANGED ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("id",        id);
    formData.append("file",      file);
    formData.append("startDate", startDate);
    formData.append("endDate",   endDate);

    try {
      const res = await fetch(`${baseUrl}/api/upload/upload`, {
        method: "POST",
        body:   formData,
      });

      if (res.ok) {
        await res.json();
        toast.success("File uploaded successfully! ✅");
        setId(""); setFile(null); setPreview(null);
        setStartDate(""); setEndDate(""); setDuration("2yrs");
        setScanStatus(null); setScanMsg("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Upload failed. The server rejected your file.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Server error. Unable to upload at the moment.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div className="p-4 max-w-4xl mx-auto">

        {/* Page title */}
        <div className="mb-6 up-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#6d28d9]">
              <FiUploadCloud className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0f172a] leading-none">Upload Document</h1>
              <p className="text-sm text-[#64748b] mt-0.5">Add a new document to the inventory</p>
            </div>
          </div>
        </div>

        {/* Maintenance warning */}
        {isDisabled && (
          <div className="up-maint">
            <MdOutlineWarningAmber className="text-[#f59e0b] text-lg shrink-0" />
            <span>Uploads are disabled during maintenance mode.</span>
          </div>
        )}

        {/* Card */}
        <div
          key={shakeKey}
          className={`bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 up-card ${shakeKey > 0 ? "up-shake" : ""}`}
        >
          <fieldset disabled={isDisabled} style={{ border: "none", padding: 0, margin: 0 }}>
            <div className="space-y-5">

              {/* Batch number */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiHash className="text-[#6d28d9] text-xs" /> Batch Number
                </label>
                <input
                  className={`up-input ${errs.id ? "up-input-err" : ""}`}
                  type="text"
                  placeholder="Enter batch number"
                  value={id}
                  onChange={(e) => { setId(e.target.value.trimStart()); setErrs((p) => ({ ...p, id: null })); }}
                  onBlur={(e) => setId(e.target.value.trim())}
                />
                {errs.id && <p className="up-field-err">⚠ {errs.id}</p>}
              </div>

              {/* File upload drop zone */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiFile className="text-[#6d28d9] text-xs" /> Select File
                  <span className="text-[11px] font-normal text-[#94a3b8] ml-1">(PDF, PNG, JPG — max 10 MB)</span>
                </label>

                <div
                  className={`up-drop-zone rounded-xl p-5 text-center cursor-pointer ${dragging ? "drag-over" : ""} ${errs.file ? "border-[#ef4444]" : ""}`}
                  onClick={() => !isDisabled && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <FiUploadCloud className="mx-auto text-3xl text-[#94a3b8] mb-2" />
                  <p className="text-sm text-[#64748b]">
                    Drop file here or <span className="text-[#6d28d9] font-semibold">browse</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                </div>

                {/* Scan status */}
                {scanStatus === "scanning" && (
                  <div className="flex items-center gap-2 mt-2 text-[#6d28d9] text-xs">
                    <span className="up-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    {scanMsg}
                  </div>
                )}
                {scanStatus === "ok" && (
                  <p className="text-[#16a34a] text-xs mt-2 flex items-center gap-1.5">
                    <span className="text-base">✓</span> {scanMsg}
                  </p>
                )}
                {errs.file && <p className="up-field-err">⚠ {errs.file}</p>}
              </div>

              {/* File preview */}
              {preview && (
                <div className="up-preview relative bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3">
                  {preview.type === "image" ? (
                    <img
                      src={preview.url}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-[#e2e8f0]"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-[#fef2f2] rounded-lg border border-[#fecaca]">
                      <FaFilePdf className="text-[#dc2626] text-2xl" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1e293b] truncate">{preview.name}</p>
                    <p className="text-xs text-[#64748b]">
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                      {" · "}{file?.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); setScanStatus(null); setScanMsg(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca] transition-colors shrink-0"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                  <FiClock className="text-[#6d28d9] text-xs" /> Set Duration
                </label>
                <select
                  className="up-input"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    if (startDate && e.target.value !== "custom") updateEndDate(startDate, e.target.value);
                  }}
                >
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                    <FiCalendar className="text-[#6d28d9] text-xs" /> Start Date
                  </label>
                  <input
                    type="date"
                    className={`up-input ${errs.startDate ? "up-input-err" : ""}`}
                    value={startDate}
                    onChange={handleStartDateChange}
                  />
                  {startDate && !errs.startDate && (
                    <p className="text-[11px] text-[#6d28d9] mt-1">{formatDateDisplay(startDate)}</p>
                  )}
                  {errs.startDate && <p className="up-field-err">⚠ {errs.startDate}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[#374151] mb-1.5">
                    <FiCalendar className="text-[#6d28d9] text-xs" /> End Date
                  </label>
                  <input
                    type="date"
                    className={`up-input ${errs.endDate ? "up-input-err" : ""}`}
                    value={endDate}
                    disabled={duration !== "custom"}
                    onChange={(e) => { setEndDate(e.target.value); setErrs((p) => ({ ...p, endDate: null })); }}
                  />
                  {endDate && !errs.endDate && (
                    <p className="text-[11px] text-[#6d28d9] mt-1">{formatDateDisplay(endDate)}</p>
                  )}
                  {errs.endDate && <p className="up-field-err">⚠ {errs.endDate}</p>}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="up-submit" disabled={loading || isDisabled} onClick={handleSubmit}>
                {loading ? (
                  <><span className="up-spinner" /> Uploading…</>
                ) : (
                  <><FiUploadCloud /> Upload Document</>
                )}
              </button>

            </div>
          </fieldset>
        </div>
      </div>
    </>
  );
};

export default Uploads;