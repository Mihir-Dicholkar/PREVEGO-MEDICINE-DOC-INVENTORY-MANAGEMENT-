import React, { useContext, useEffect, useState } from "react";
import { MaintenanceContext } from "../context/MaintenanceContext";
import "./settings.css";

const Settings = () => {
  const { maintenance, setMaintenance } = useContext(MaintenanceContext);
  const [countdown, setCountdown] = useState("");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [durationMinutes, setDurationMinutes] = useState(60); // default: 60 minutes
const toggleMaintenance = async () => {
  let newState;

  if (!maintenance.active) {
    if (durationMinutes <= 0 || isNaN(durationMinutes)) {
      alert("Please enter a valid duration in minutes.");
      return;
    }

    const endTime = Date.now() + durationMinutes * 60 * 1000; 
    newState = { active: true, endTime };
  } else {
    newState = { active: false, endTime: null };
  }

  try {
    const token = localStorage.getItem("adminToken");

    const res = await fetch(`${baseUrl}/api/maintenance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newState),
    });

    const data = await res.json();
    if (res.ok) {
      setMaintenance(data);
    } else {
      console.error("Error:", data.error);
    }
  } catch (err) {
    console.error("Failed to update maintenance:", err);
  }
};


  // ⏳ Countdown effect
  useEffect(() => {
    let timer;
    if (maintenance.active && maintenance.endTime) {
      const updateCountdown = () => {
let endTime = null;// ✅ parse string to number
        const now = Date.now();
        const distance = endTime - now;

        if (distance <= 0) {
          setCountdown("Expired");
          clearInterval(timer);
          return;
        }

        const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((distance / (1000 * 60)) % 60);
        const seconds = Math.floor((distance / 1000) % 60);

        setCountdown(
          `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s left`
        );
      };

      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
    } else {
      setCountdown("");
    }

    return () => clearInterval(timer);
  }, [maintenance]);

  return (
    <div className="settings-container">
      <h2 className="settings-heading">Super Admin Settings</h2>
<div className="duration-container">
  <label className="duration-label">Maintenance Duration</label>

  <div className="duration-select-wrapper">
    <select
      value={durationMinutes}
      onChange={(e) => setDurationMinutes(Number(e.target.value))}
      className="duration-select light"
    >
      <option value={5}>5 Minutes</option>
      <option value={15}>15 Minutes</option>
      <option value={30}>30 Minutes</option>
      <option value={60}>1 Hour</option>
      <option value={120}>2 Hours</option>
      <option value={240}>4 Hours</option>
      <option value={480}>8 Hours</option>
      <option value={720}>12 Hours</option>
      <option value={960}>16 Hours</option>
      <option value={-1}>Custom</option>
    </select>
  </div>

  {durationMinutes === -1 && (
    <input
      type="number"
      min="1"
      placeholder="Enter minutes"
      className="duration-input light"
      onChange={(e) => setDurationMinutes(Number(e.target.value))}
    />
  )}
</div>

<div className="switch-wrapper">
  <label className="switch">
    <input
      type="checkbox"
      checked={maintenance.active}
      onChange={toggleMaintenance}
    />
    <span className="slider"></span>
  </label>

  <span className="switch-text">
    {maintenance.active ? "Maintenance ON" : "Maintenance OFF"}
  </span>
</div>

    </div>
  );
};

export default Settings;
