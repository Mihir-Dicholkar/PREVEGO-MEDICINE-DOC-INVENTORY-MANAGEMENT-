// Import dependencies and models
import express from "express";
import multer from "multer";
import Upload from "../models/uploadModel.js";
import Log from "../models/logModel.js";

const router = express.Router();

// 🧾 Multer config: Store files in /uploads with a timestamped name
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

/* ------------------- DOCUMENT CONTROLLERS ------------------- */

// 🟢 (Unused) Create new log-only document entry (not connected to frontend)
const createDocument = async (req, res) => {
  const newLog = new Log({
    docId: req.body.docId,
    filePath: req.file.filename,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: "Created",
    changes: [],
  });

  await newLog.save();
  res.status(201).json({ message: "Document created" });
};

// 🟠 (Unused) Edit an existing document in logModel (not Upload) by docId, and log what changed
const editDocument = async (req, res) => {
  const { docId, startDate, endDate } = req.body;
  const newFile = req.file?.filename;

  const oldLog = await Log.findOne({ docId }).sort({ uploadedAt: -1 });

  // 🔍 Track what changed between old and new
  const changes = [];
  if (oldLog.startDate?.toISOString() !== new Date(startDate).toISOString())
    changes.push("start year");
  if (oldLog.endDate?.toISOString() !== new Date(endDate).toISOString())
    changes.push("end year");
  if (newFile && oldLog.filePath !== newFile) changes.push("file");

  if (changes.length === 0) {
    return res.status(400).json({ message: "No changes detected" });
  }

  const newLog = new Log({
    docId,
    filePath: newFile || oldLog.filePath,
    startDate,
    endDate,
    status: "Edited",
    changes,
  });

  await newLog.save();
  res.status(200).json({ message: "Document edited and logged" });
};

/* ------------------- ACTIVE ROUTES ------------------- */

// ✅ Route: Upload new product with file and data
// Description: Stores file, creates Upload document in DB
// ✅ Route: Upload new product and log it
router.post("/upload", upload.single("file"), async (req, res) => {
  const { id, startDate, endDate } = req.body;

  if (!req.file || !id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ✅ Check if docId already exists
    const exists = await Upload.findOne({ docId: id });
    if (exists) return res.status(409).json({ error: "ID already exists" });

    // ✅ Step 1: Save to Upload collection
    const saved = await Upload.create({
      docId: id,
      filePath: req.file.filename,
       startDate: new Date(startDate),
  endDate: new Date(endDate),
      uploadedAt: new Date(),
    });

    // ✅ Step 2: Save to Log collection (important!)
    await Log.create({
      docId: id,
      filePath: req.file.filename,
      startDate: new Date(startDate),
  endDate: new Date(endDate),
      status: "Created",
      changes: [],
      uploadedAt: new Date(),
    });

    res.status(201).json({ message: "Upload successful", id: saved._id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error during upload" });
  }
});

// ✅ Route: Fetch all logs (creation + edits)
// Description: Returns all Upload documents sorted by date
router.get("/logs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ uploadedAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});
// ✅ Route: Verify a batch number exists ****THIS IS DONE IN FRONTEND BY CLIENTS
// Description: Returns file URL if batch is valid
router.post("/verify-batch", async (req, res) => {
  const { batch } = req.body;

  try {
    const found = await Upload.findOne({ docId: batch });

    if (!found) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.status(200).json({
      message: "Batch matched",
      fileUrl: `${process.env.BASE_URL}/uploads/${found.filePath}`,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Route: Get product data by batch number (docId) At ADMIN WANTS TO EDIT
// Description: Used in admin edit page to pre-fill fields
router.get("/get-by-docid/:docId", async (req, res) => {
  const docId = req.params.docId;

  if (!docId || docId === "undefined") {
    return res.status(400).json({ error: "Invalid batch number" });
  }

  try {
    const doc = await Upload.findOne({ docId });
    if (!doc) return res.status(404).json({ error: "Batch not found" });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Fetch by batch failed" });
  }
});

// ✅ Route: Edit a product by ID (not docId)
// Description: Creates a new Upload document as an "Edited" log

router.post("/edit/:id", upload.single("file"), async (req, res) => {
  try {
    const existing = await Upload.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Document not found" });

    const newDocId = req.body.docId;
    const newStartDate = req.body.startDate;
    const newEndDate = req.body.endDate;
    const newFile = req.file ? req.file.filename : existing.filePath;

    const changes = [];

    if (newDocId !== existing.docId) changes.push("Batch No");
    if (newStartDate !== existing.startDate.toISOString().slice(0, 10))
      changes.push("Start Date");
    if (newEndDate !== existing.endDate.toISOString().slice(0, 10))
      changes.push("End Date");
    if (req.file && req.file.filename !== existing.filePath)
      changes.push("File");

    if (changes.length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    // ✅ Log before updating
    await Log.create({
      docId: existing.docId, // log under the original batch number
      filePath: existing.filePath,
      startDate: existing.startDate,
      endDate: existing.endDate,
      status: "Edited",
      changes,
      uploadedAt: new Date(),
    });

    // ✅ Then update the actual Upload document
    existing.docId = newDocId;
    existing.startDate = newStartDate;
    existing.endDate = newEndDate;
    existing.filePath = newFile;
    existing.uploadedAt = new Date();

    await existing.save();

    return res
      .status(200)
      .json({ message: "Document updated", updated: existing });
  } catch (err) {
    console.error("Edit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all uploaded products (for Inventory)
router.get("/all", async (req, res) => {
  try {
    const allProducts = await Upload.find().sort({ uploadedAt: -1 });
    res.json(allProducts);
  } catch (err) {
    console.error("Error fetching all uploads:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

/* AFTER DELETING THE PRODUCT FROM INVENTORY PAGE */
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Upload.findByIdAndDelete(id);
    console.log("Deleted:", deleted);

    if (!deleted) return res.status(404).send("Not found");

    // Always create a log, even if some fields are missing
    await Log.create({
      docId: deleted.docId || deleted._id.toString(), // fallback to Mongo _id
      filePath: deleted.filePath || "N/A",
      startDate: deleted.startDate || null,
      endDate: deleted.endDate || null,
      uploadedAt: new Date(),
      status: "Deleted",
      changes: [`Deleted`],
    });

    console.log("📝 Deletion logged successfully");
    res.status(200).send("Deleted and logged");
  } catch (err) {
    console.error("❌ Deletion error:", err);
    res.status(500).send("Server error");
  }
});

// inventory route (only active products)
// GET only current active products for inventory
router.get("/inventory", async (req, res) => {
  try {
    // Fetch only active products from Upload collection
    const activeProducts = await Upload.find({
      status: { $ne: "Deleted" },
    }).sort({ uploadedAt: -1 }); // latest first

    res.json(activeProducts);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

export default router;
