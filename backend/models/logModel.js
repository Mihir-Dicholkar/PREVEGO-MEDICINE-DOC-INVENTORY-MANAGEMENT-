import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  docId: String,
  filePath: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ["Created", "Edited", "Deleted"] }, // added Deleted
  changes: [String],
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: { expires: "730d" } // auto-delete after 2 years
  }
});

export default mongoose.model("Log", logSchema);
