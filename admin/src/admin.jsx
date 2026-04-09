// src/AdminApp.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  Styled with Tailwind arbitrary values [#hex] for colors — works in Tailwind
//  v4 regardless of @theme inline config. Layout uses standard Tailwind utils.
//  ALL backend logic (SSE, logout, maintenance, role, popstate) UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

import { useContext, useEffect, useState } from "react";
import { MaintenanceContext } from "./context/MaintenanceContext";
import { Outlet, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { FiLogOut, FiMenu, FiX, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { FaUpload, FaHistory, FaUserGraduate, FaEdit, FaWarehouse } from "react-icons/fa";
import { MdOutlineWarningAmber } from "react-icons/md";

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "upload",    label: "Upload",    icon: FaUpload    },
  { to: "edit",      label: "Edit",      icon: FaEdit      },
  { to: "log",       label: "Log",       icon: FaHistory   },
  { to: "inventory", label: "Inventory", icon: FaWarehouse },
];

const SUPER_ITEM = { to: "settings", label: "Super Admin", icon: FaUserGraduate };

// ─── Component ────────────────────────────────────────────────────────────────
function AdminApp() {
  const { maintenance, setMaintenance } = useContext(MaintenanceContext);
  const [timeLeft, setTimeLeft]         = useState(0);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [role, setRole]                 = useState(null);
  const navigate                        = useNavigate();

  // ── Countdown timer — UNCHANGED ────────────────────────────────────────────
  useEffect(() => {
    if (maintenance.active && maintenance.endTime) {
      const interval = setInterval(() => {
        const diff = new Date(maintenance.endTime).getTime() - Date.now();
        if (diff <= 0) {
          clearInterval(interval);
          setMaintenance({ active: false, endTime: null });
          setTimeLeft(0);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [maintenance, setMaintenance]);

  // ── Initial fetch + SSE — UNCHANGED ────────────────────────────────────────
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_BASE_URL;

    const fetchMaintenance = async () => {
      try {
        const res  = await fetch(`${baseUrl}/api/maintenance`);
        const data = await res.json();
        if (data.endTime) data.endTime = new Date(data.endTime).getTime();
        setMaintenance(data);
      } catch (err) {
        console.error("Failed to fetch maintenance state:", err);
      }
    };
    fetchMaintenance();

    const eventSource = new EventSource(`${baseUrl}/api/maintenance/stream`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.endTime) data.endTime = new Date(data.endTime).getTime();
        setMaintenance(data);
      } catch (err) {
        console.error("Failed to parse SSE:", err);
      }
    };
    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };
    return () => eventSource.close();
  }, [setMaintenance]);

  // ── Logout — UNCHANGED ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    const token   = localStorage.getItem("adminToken");
    const baseUrl = import.meta.env.VITE_BASE_URL;
    if (token) {
      await fetch(`${baseUrl}/api/admin/logout`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    navigate("/", { replace: true });
  };

  // ── Role + popstate guard — UNCHANGED ──────────────────────────────────────
  useEffect(() => {
    setRole(localStorage.getItem("adminRole"));
    window.history.pushState(null, "", window.location.href);
    const handler = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // ── Countdown format — UNCHANGED ───────────────────────────────────────────
  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return [
      String(Math.floor(s / 3600)).padStart(2, "0"),
      String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
      String(s % 60).padStart(2, "0"),
    ].join(":");
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const navItems = [...NAV_ITEMS, ...(role === "superadmin" ? [SUPER_ITEM] : [])];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">

{/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarOpen ? "260px" : "72px",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="relative flex flex-col shrink-0 overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e1b2e] border-r border-[#1e293b] z-20 shadow-2xl"
      >
        {/* Toggle button - floating */}
     
        {/* Brand header with improved styling */}
        <div className="flex items-center h-16 px-3 gap-3 border-b border-[#1e293b] shrink-0 overflow-hidden bg-gradient-to-r from-[#0f172a] to-transparent">
          {/* Logo tile with pulse animation on hover */}
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] shadow-lg shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <img src="/White.png" alt="Logo" className="w-8 h-8 object-contain transition-transform duration-300 group-hover:rotate-3" />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-[#6d28d9] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
          </div>
          
          <div
            style={{
              opacity: sidebarOpen ? 1 : 0,
              transform: sidebarOpen ? "translateX(0)" : "translateX(-12px)",
              transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            className="flex flex-col"
          >
            <p className="text-[#f1f5f9] text-sm font-bold leading-tight bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
              Admin Panel
            </p>
            <p className="text-[#64748b] text-[10px] font-medium tracking-wide mt-0.5">
              Dashboard
            </p>
          </div>
        </div>

        {/* Nav label with animation */}
        <div className="overflow-hidden">
          <div
            style={{
              opacity: sidebarOpen ? 1 : 0,
              transform: sidebarOpen ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 0.25s, transform 0.25s",
            }}
          >
            {sidebarOpen && (
              <p className="px-4 pt-5 pb-2 text-[10px] font-bold tracking-widest uppercase text-[#334155]">
                Main Menu
              </p>
            )}
          </div>
        </div>

        {/* Nav items with improved interactions */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                [
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white shadow-lg shadow-purple-900/20"
                    : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9]",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#c4b5fd] rounded-r-full shadow-lg shadow-purple-500/50"></div>
                  )}
                  
                  {/* Icon container with animation */}
                  <div className="relative">
                    <Icon
                      className={[
                        "shrink-0 text-[18px] transition-all duration-300",
                        !isActive ? "group-hover:scale-110 group-hover:rotate-3" : "",
                        isActive ? "drop-shadow-lg" : "",
                      ].join(" ")}
                    />
                    {/* Ripple effect on hover */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 scale-0 group-hover:scale-100 transition-all duration-300"></div>
                    )}
                  </div>
                  
                  <span
                    style={{
                      opacity: sidebarOpen ? 1 : 0,
                      width: sidebarOpen ? "auto" : 0,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="flex-1 text-left"
                  >
                    {label}
                  </span>
                  
                  {/* Super admin badge with animation */}
                  {to === "settings" && sidebarOpen && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-[#422006] font-bold shadow-sm animate-pulse">
                      SA
                    </span>
                  )}
                  
                  {/* Active chevron with animation */}
                  {isActive && sidebarOpen && (
                    <FiChevronRight className="text-[#c4b5fd] text-sm animate-bounce-x" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider with gradient */}
        <div className="relative mx-4 my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1e293b]"></div>
          </div>
   
        </div>

        {/* User Profile Section */}
        <div className="px-3 py-2 shrink-0">
        
          
          {/* Logout button with improved styling */}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className="relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748b] hover:bg-gradient-to-r hover:from-[#450a0a] hover:to-[#7f1d1d] hover:text-[#fca5a5] transition-all duration-300 overflow-hidden"
          >
            {/* Hover background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/0 to-red-900/0 group-hover:from-red-900/20 group-hover:to-red-900/20 transition-all duration-300"></div>
            
            <FiLogOut className="relative shrink-0 text-[18px] transition-all duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
            <span
              style={{
                opacity: sidebarOpen ? 1 : 0,
                width: sidebarOpen ? "auto" : 0,
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="relative"
            >
              Logout
            </span>
            
            {/* Logout icon on hover when collapsed */}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e293b] text-[#fca5a5] text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Add custom CSS for scrollbar and animations */}
      <style jsx>{`
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6d28d9;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5b21b6;
        }
        
        /* Bounce animation for chevron */
        @keyframes bounce-x {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
        
        /* Pulse animation for SA badge */
        @keyframes pulse-sa {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
        
        .animate-pulse-sa {
          animation: pulse-sa 2s infinite;
        }
      `}</style>

      {/* ── MAIN AREA ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Top header */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center px-5 gap-4 shrink-0 shadow-sm">

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] hover:text-[#1e293b] transition-all duration-200"
          >
            {sidebarOpen ? <FiX className="text-base" /> : <FiMenu className="text-base" />}
          </button>

          {/* Vertical divider */}
          <div className="h-5 w-px bg-[#e2e8f0]" />

          {/* Date */}
          <p className="text-sm text-[#64748b] hidden md:block select-none">{today}</p>

          <div className="flex-1" />

          {/* Role badge */}
          {role && (
            <span
              className={[
                "text-xs px-3 py-1 rounded-full font-semibold border",
                role === "superadmin"
                  ? "bg-[#faf5ff] text-[#6d28d9] border-[#ddd6fe]"
                  : "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
              ].join(" ")}
            >
              {role === "superadmin" ? "⭐ Super Admin" : "✓ Admin"}
            </span>
          )}

          {/* Maintenance pill */}
          {maintenance.active && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] animate-pulse">
              🔧 Maintenance
            </span>
          )}
        </header>

        {/* Maintenance banner */}
        {maintenance.active && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-[#fffbeb] border-b border-[#fde68a] text-[#92400e] text-sm shrink-0">
            <MdOutlineWarningAmber className="text-[#f59e0b] text-lg shrink-0" />
            <span className="font-semibold">Site is Under Maintenance</span>
            <div className="h-4 w-px bg-[#fcd34d]" />
            <span className="text-xs text-[#b45309]">{today}</span>
            <div className="h-4 w-px bg-[#fcd34d]" />
            <span className="text-xs text-[#b45309]">
              Time left:{" "}
              <span className="font-mono font-bold text-[#92400e] tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-[#f8fafc]">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default AdminApp;