// seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/adminModel.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Clean slate (optional, if you want to reset each time)
    // await Admin.deleteMany();

    const admins = [
      {
        adminId: "admin123",
        password: "securepass", // plain text; schema will hash
        role: "admin",
      },
      {
        adminId: "superadmin",
        password: "supersecure", // plain text; schema will hash
        role: "superadmin",
      },
    ];

    for (const user of admins) {
      const exists = await Admin.findOne({ adminId: user.adminId });

      if (!exists) {
        await Admin.create(user); // pre-save hook hashes here
        console.log(`✅ ${user.adminId} created with role ${user.role}`);
      } else {
        console.log(`ℹ️ ${user.adminId} already exists`);
      }
    }

    process.exit();
  } catch (error) {
    console.error("❌ Failed to seed admins:", error);
    process.exit(1);
  }
};

seedAdmin();
