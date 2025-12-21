import { storage } from "../server/storage";

async function ensureAdminUser() {
  try {
    const adminEmail = "eleblununana@gmail.com";

    // Check if admin user exists
    let adminUser = await storage.getUserByEmail(adminEmail);

    if (adminUser) {
      console.log("Admin user found:", adminUser.email);
      console.log("Current role:", adminUser.role);

      // Update role if not admin
      if (adminUser.role !== "admin") {
        console.log("Updating role to admin...");
        // Note: This would require an update method in storage
        // For now, we'll just log the issue
        console.log("Admin user exists but role is not 'admin'. Please update manually.");
      } else {
        console.log("Admin user has correct role.");
      }
    } else {
      console.log("Admin user not found. Creating...");

      // Create admin user
      const newAdmin = await storage.createUser({
        email: adminEmail,
        password: "", // Password handled by Supabase
        name: "Admin User",
        role: "admin",
        isActive: true,
      });

      console.log("Admin user created:", newAdmin.email, "with role:", newAdmin.role);
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}

ensureAdminUser();