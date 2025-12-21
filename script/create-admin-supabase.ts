import { storage } from "../server/storage";

async function createAdminFromSupabase() {
  try {
    // This assumes you have an admin user in Supabase with this email
    const adminEmail = "admin@smartdatastoregh.com";

    // Check if admin already exists in our database
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log("Admin account already exists in database");
      console.log("Role:", existingAdmin.role);
      return;
    }

    // Create admin user in our database
    // Note: Password is empty since auth is handled by Supabase
    const adminUser = await storage.createUser({
      email: adminEmail,
      password: "", // Not used with Supabase auth
      name: "Administrator",
      phone: null,
      role: "admin",
      isActive: true,
    });

    console.log("Admin account created successfully in database!");
    console.log("Email:", adminEmail);
    console.log("Role:", adminUser.role);
    console.log("ID:", adminUser.id);
    console.log("");
    console.log("⚠️  IMPORTANT: Make sure this user exists in Supabase Auth first!");
    console.log("   You can create it manually in the Supabase dashboard or via signup.");
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

createAdminFromSupabase();