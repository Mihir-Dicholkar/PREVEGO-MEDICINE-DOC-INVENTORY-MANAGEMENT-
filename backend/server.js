import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import logRoutes from "./routes/logRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; // ✅ Add
const PORT = process.env.PORT || 4000;

dotenv.config();
connectDB();

const app = express();
// app.use(cors({ origin: "http://localhost:5174" }));

const allowedOrigins = [
  "http://localhost:5173", // local dev
  "http://localhost:5174", // local dev
  "https://admin.prevego.in", // main admin
  "http://admin.prevego.in", // non-https fallback
  "https://prevego.in", // non-https fallback
  "http://prevego.in", // non-https fallback
  "https://www.prevego.in", // non-https fallback
  "http://www.prevego.in", // non-https fallback
];

// Dynamic CORS check
const corsOptions = {
  origin: function (origin, callback) {
    // console.log("🔎 Incoming request from:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Apply CORS middleware
app.use(cors(corsOptions));

// ✅ Handle preflight globally with same config
app.options(/.*/, cors(corsOptions));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/upload", uploadRoutes); // ✅ upload routes mounted properly
app.use("/api/logs", logRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).send(" API route not found");
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
