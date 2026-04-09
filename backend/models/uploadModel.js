import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({
  docId: { type: String, required: true, unique: true },
  filePath: { type: String, required: true },
startDate: { type: Date, required: true },
endDate: { type: Date, required: true },

  uploadedAt: { type: Date, default: Date.now },
  status: {
  type: String,
  default: "Created", // this is the default for new uploads
}

});

const Upload = mongoose.model("Upload", uploadSchema);

export default Upload;
