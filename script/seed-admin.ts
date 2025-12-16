import { storage } from "../server/storage";
import bcrypt from "bcryptjs";

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail("admin@smartdatastoregh.com");
    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await storage.createUser({
      email: "admin@smartdatastoregh.com",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
      isActive: true,
    });

    console.log("Admin account created successfully!");
    console.log("Email: admin@smartdatastoregh.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

createAdmin();