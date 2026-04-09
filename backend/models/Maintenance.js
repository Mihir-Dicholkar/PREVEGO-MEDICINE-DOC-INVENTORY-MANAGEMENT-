import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema({
  active: { type: Boolean, default: false },
  endTime: { type: Date, default: null },
});

// 👇 Modify JSON output so endTime is sent as a number (ms since epoch)
maintenanceSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.endTime) {
      ret.endTime = new Date(ret.endTime).getTime(); // convert Date → timestamp
    }
    return ret;
  },
});

export default mongoose.model("Maintenance", maintenanceSchema);
