import { storage } from "../server/storage";

async function createAdminFromSupabase() {
  try {
    // Admin user details
    const adminEmail = "eleblununana@gmail.com";
    const adminName = "Eleblu Nunana";

    // Check if admin already exists in our database
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log("Admin account already exists in database");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      console.log("Name:", existingAdmin.name);
      return;
    }

    // Create admin user in our database
    // Note: Password is empty since auth is handled by Supabase
    const adminUser = await storage.createUser({
      email: adminEmail,
      password: "", // Not used with Supabase auth
      name: adminName,
      phone: null,
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin account created successfully in database!");
    console.log("Email:", adminEmail);
    console.log("Name:", adminName);
    console.log("Role:", adminUser.role);
    console.log("ID:", adminUser.id);
    console.log("");
    console.log("⚠️  IMPORTANT: Make sure this user exists in Supabase Auth!");
    console.log("   The user should sign up with email/password through your app,");
    console.log("   or you can create it manually in the Supabase dashboard.");
    console.log("");
    console.log("🔐 Login credentials for Supabase:");
    console.log("   Email: eleblununana@gmail.com");
    console.log("   Password: NUNANA123");
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
  }
}

createAdminFromSupabase();