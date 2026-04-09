// src/Login.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  UI fully rebuilt with glassmorphism + animations.
//  ALL backend logic (handleLogin, localStorage, navigate) is UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

  /* ── Root ── */
  .lp-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #070b14;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  /* ── Animated gradient blobs ── */
  .lp-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.3;
    animation: blobFloat 10s ease-in-out infinite;
    pointer-events: none;
  }
  .lp-blob-1 {
    width: 520px; height: 520px;
    background: radial-gradient(circle at 40%, #7c3aed, #4f46e5);
    top: -180px; left: -180px;
    animation-delay: 0s;
  }
  .lp-blob-2 {
    width: 420px; height: 420px;
    background: radial-gradient(circle at 60%, #0ea5e9, #06b6d4);
    bottom: -120px; right: -120px;
    animation-delay: -5s;
  }
  .lp-blob-3 {
    width: 280px; height: 280px;
    background: radial-gradient(circle, #ec4899, #8b5cf6);
    top: 55%; left: 65%;
    animation-delay: -2.5s;
  }

  @keyframes blobFloat {
    0%,100% { transform: translate(0, 0) scale(1); }
    33%      { transform: translate(28px, -22px) scale(1.06); }
    66%      { transform: translate(-18px, 18px) scale(0.94); }
  }

  /* ── Cursor glow ── */
  .lp-cursor-glow {
    position: fixed;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
    will-change: transform;
    top: 0; left: 0;
    transition: opacity 0.3s;
  }

  /* ── Glass card ── */
  .lp-card {
    position: relative;
    z-index: 10;
    background: rgba(255,255,255,0.042);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 2.6rem 2.4rem;
    width: 100%;
    max-width: 420px;
    box-shadow:
      0 8px 40px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.09);
    animation: cardIn 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(28px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }

  /* ── Staggered children ── */
  .lp-logo-wrap  { animation: fadeUp 0.5s ease 0.15s both; }
  .lp-title-wrap { animation: fadeUp 0.5s ease 0.25s both; }
  .lp-f1         { animation: fadeUp 0.5s ease 0.32s both; }
  .lp-f2         { animation: fadeUp 0.5s ease 0.38s both; }
  .lp-btn-wrap   { animation: fadeUp 0.5s ease 0.44s both; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Label ── */
  .lp-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 0.45rem;
  }

  /* ── Glass input ── */
  .lp-input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.055);
    border: 1px solid rgba(255,255,255,0.11);
    border-radius: 12px;
    padding: 0.72rem 1rem;
    color: #f1f5f9;
    font-family: 'Sora', sans-serif;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .lp-input::placeholder { color: rgba(255,255,255,0.25); }
  .lp-input:hover:not(:focus) {
    border-color: rgba(255,255,255,0.2);
  }
  .lp-input:focus {
    border-color: rgba(139,92,246,0.65);
    background: rgba(255,255,255,0.08);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.18);
  }

  /* ── Eye toggle ── */
  .lp-eye {
    position: absolute;
    right: 0.8rem;
    bottom: 0.78rem;
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    transition: color 0.2s;
    line-height: 1;
  }
  .lp-eye:hover { color: rgba(255,255,255,0.65); }

  /* ── Error banner ── */
  .lp-error {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.28);
    border-radius: 10px;
    padding: 0.62rem 0.85rem;
    color: #fca5a5;
    font-size: 0.78rem;
    line-height: 1.4;
    animation: slideDown 0.3s ease, shake 0.55s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-7px); }
    40%     { transform: translateX(7px); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px); }
  }

  /* ── Submit button ── */
  .lp-btn {
    width: 100%;
    padding: 0.82rem 1rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    color: #fff;
    font-family: 'Sora', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
  }
  .lp-btn::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
    transition: left 0.55s ease;
  }
  .lp-btn:not(:disabled):hover::after { left: 100%; }
  .lp-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(109,40,217,0.48);
  }
  .lp-btn:not(:disabled):active { transform: translateY(0); }
  .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  /* ── Spinner ring ── */
  .lp-spinner {
    width: 17px; height: 17px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Divider ── */
  .lp-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.07);
    margin: 1.6rem 0 1.4rem;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
const Login = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [adminId, setAdminId]         = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [errorKey, setErrorKey]       = useState(0);   // forces re-animation on repeat errors

  const navigate = useNavigate();
  const baseUrl  = import.meta.env.VITE_BASE_URL;

  // ── Cursor glow (smooth lerp) ───────────────────────────────────────────────
  const cursorRef   = useRef(null);
  const mousePos    = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const currentPos  = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef      = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      const LERP = 0.075;
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * LERP;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * LERP;
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${currentPos.current.x - 210}px, ${currentPos.current.y - 210}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Login handler (BACKEND LOGIC UNCHANGED) ────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${baseUrl}/api/admin/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminId, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminRole", data.role);

      navigate("/admin");
    } catch (err) {
      setLoading(false);
      setError(err.message);
      setErrorKey((k) => k + 1);   // re-trigger shake animation on each failure
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>

      <div className="lp-root">
        {/* Animated blobs */}
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />

        {/* Smooth cursor glow */}
        <div ref={cursorRef} className="lp-cursor-glow" />

        {/* Glass card */}
        <div className="lp-card">

          {/* Logo */}
          <div className="lp-logo-wrap" style={{ display: "flex", justifyContent: "center", marginBottom: "1.4rem" }}>
            <img src="/White.png" alt="Logo" style={{ width: "6.5rem" }} />
          </div>

          {/* Title */}
          <div className="lp-title-wrap" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ color: "#f8fafc", fontSize: "1.45rem", fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
              Welcome back
            </h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.82rem", marginTop: "0.4rem" }}>
              Sign in to your admin console
            </p>
          </div>

          <hr className="lp-divider" />

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Admin ID */}
            <div className="lp-f1">
              <label className="lp-label">Admin ID</label>
              <input
                className="lp-input"
                type="text"
                placeholder="Enter your admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="lp-f2" style={{ position: "relative" }}>
              <label className="lp-label">Password</label>
              <input
                className="lp-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: "2.8rem" }}
                required
              />
              <button
                type="button"
                className="lp-eye"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Error banner — key forces re-mount + re-animation on each error */}
            {error && (
              <div className="lp-error" key={errorKey}>
                <FontAwesomeIcon icon={faExclamationCircle} style={{ flexShrink: 0, fontSize: "0.9rem" }} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <div className="lp-btn-wrap" style={{ marginTop: "0.4rem" }}>
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="lp-spinner" />
                    Authenticating…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default Login;