// src/context/MaintenanceContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [maintenance, setMaintenance] = useState(() => {
    // restore from localStorage if exists
    const stored = localStorage.getItem("maintenance");
    return stored ? JSON.parse(stored) : { active: false, endTime: null };
  });

  useEffect(() => {
    localStorage.setItem("maintenance", JSON.stringify(maintenance));
  }, [maintenance]);

  return (
    <MaintenanceContext.Provider value={{ maintenance, setMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  );
};
