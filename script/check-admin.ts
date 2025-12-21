import { storage } from "../server/storage";

async function checkAdminUser() {
  try {
    // Check for the admin user mentioned in the conversation
    const adminUser = await storage.getUserByEmail("eleblununana@gmail.com");
    if (adminUser) {
      console.log("Admin user found:");
      console.log("Email:", adminUser.email);
      console.log("Role:", adminUser.role);
      console.log("Name:", adminUser.name);
      console.log("Is Active:", adminUser.isActive);
    } else {
      console.log("Admin user 'eleblununana@gmail.com' not found in database");

      // Check for the default admin user
      const defaultAdmin = await storage.getUserByEmail("admin@smartdatastoregh.com");
      if (defaultAdmin) {
        console.log("Default admin user found:");
        console.log("Email:", defaultAdmin.email);
        console.log("Role:", defaultAdmin.role);
      } else {
        console.log("No admin users found in database");
      }
    }

    // List all users with admin role
    console.log("\nAll users with admin role:");
    // Note: This would require a method to get users by role, which might not exist
    // For now, we'll just check the specific users
  } catch (error) {
    console.error("Error checking admin user:", error);
  }
}

checkAdminUser();