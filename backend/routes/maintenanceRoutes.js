// maintenanceRoutes.js
import express from "express";
import Maintenance from "../models/Maintenance.js";
import { protectAdmin, superAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Store active SSE clients
let clients = [];

// ✅ SSE endpoint
router.get("/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Push to clients list
  clients.push(res);

  // 👉 Send the current maintenance status immediately
  try {
    let doc = await Maintenance.findOne();
    if (!doc) {
      doc = await Maintenance.create({ active: false, endTime: null });
    }
    res.write(`data: ${JSON.stringify(doc)}\n\n`);
  } catch (err) {
    console.error("Failed to send initial state:", err.message);
  }

  // Remove client on close
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

// Helper to broadcast to all clients
function broadcastUpdate(doc) {
  const payload = {
    active: doc.active,
    endTime: doc.endTime ? new Date(doc.endTime).getTime() : null,
  };
  clients.forEach((res) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });
}

setInterval(() => {
  clients.forEach((res) => res.write(": keepalive\n\n"));
}, 25000);


// ✅ Anyone can read current status
router.get("/", async (req, res) => {
  try {
    let doc = await Maintenance.findOne();
    if (!doc) {
      doc = await Maintenance.create({ active: false, endTime: null });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Only superadmin can update/toggle
router.post("/", protectAdmin, superAdminOnly, async (req, res) => {
  try {
    const { active, endTime } = req.body;

    let doc = await Maintenance.findOne();
    if (!doc) {
      doc = new Maintenance();
    }
    doc.active = active;
    doc.endTime = endTime || null;
    await doc.save();

    // Broadcast update to all connected clients
    broadcastUpdate(doc);

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
