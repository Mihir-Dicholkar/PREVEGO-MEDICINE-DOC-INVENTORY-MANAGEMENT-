import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

// Store blacklisted tokens in memory
let blacklistedTokens = [];

// ✅ Named export
export const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Check if token is blacklisted
      if (blacklistedTokens.includes(token)) {
        return res.status(401).json({ error: "Not authorized, token invalidated" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) {
        return res.status(401).json({ error: "Admin not found" });
      }

      next();
    } catch (err) {
      console.error("JWT error:", err);
      const msg =
        err.name === "TokenExpiredError"
          ? "Session expired, please login again"
          : "Not authorized, token failed";
      res.status(401).json({ error: msg });
    }
  } else {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

// ✅ Named export
export const logoutAdmin = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    blacklistedTokens.push(token);
  }
  res.json({ message: "Logged out successfully" });
};

// ✅ Named export
export const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== "superadmin") {
    return res.status(403).json({ error: "Access denied: Superadmin only" });
  }
  next();
};
