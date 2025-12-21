import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function testDatabaseConnection() {
  console.log("🧪 Testing Database Connection...\n");

  try {
    // Test basic connection
    console.log("1. Testing basic connection...");
    await db.execute("SELECT 1 as test");
    console.log("✅ Database connection successful");

    // Test admin user lookup
    console.log("\n2. Testing admin user lookup...");
    const adminEmail = "eleblununana@gmail.com";
    const adminUser = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    if (adminUser.length > 0) {
      console.log(`✅ Admin user found: ${adminUser[0].email}`);
      console.log(`   ID: ${adminUser[0].id}`);
      console.log(`   Role: ${adminUser[0].role}`);
      console.log(`   Active: ${adminUser[0].isActive}`);
    } else {
      console.log(`❌ Admin user '${adminEmail}' not found in database`);

      // Check what users exist
      console.log("\n   Checking existing users...");
      const allUsers = await db.select({ email: users.email, role: users.role }).from(users).limit(10);
      console.log(`   Found ${allUsers.length} users:`);
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

    // Test table counts
    console.log("\n3. Testing table access...");
    const tables = [
      { name: "users", table: users },
    ];

    for (const { name, table } of tables) {
      try {
        const result = await db.select({ count: "COUNT(*)" as any }).from(table);
        console.log(`✅ ${name} table accessible`);
      } catch (error) {
        console.log(`❌ ${name} table error: ${error.message}`);
      }
    }

    console.log("\n🎉 Database connection test completed successfully!");

  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    console.error("Error details:", error.message);

    if (error.code === 'ENOTFOUND') {
      console.log("\n💡 This error suggests:");
      console.log("   - DATABASE_URL environment variable is not set");
      console.log("   - Database server is not reachable");
      console.log("   - Network connectivity issues");
    }

    process.exit(1);
  }
}

testDatabaseConnection();