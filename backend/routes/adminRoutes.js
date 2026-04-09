import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import { protectAdmin, logoutAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Generate Token with role
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Login
router.post("/login", async (req, res) => {
  const { adminId, password } = req.body;

  try {
    console.log("Incoming:", adminId, password);

    const admin = await Admin.findOne({ adminId });
    console.log("Found admin:", admin);

    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await admin.matchPassword(password);
    console.log("Password match:", match);

    if (!match) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(admin._id, admin.role);

    res.status(200).json({
      message: "Login successful",
      token,
      adminId: admin.adminId,
      role: admin.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Protected route example
router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({ message: `Welcome ${req.admin.adminId}` });
});

// Logout
router.post("/logout", protectAdmin, logoutAdmin);

export default router;
