import { db } from '../src/server/db.ts';
import { users } from '../src/shared/schema.ts';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'eleblununana@gmail.com')).limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists:', existingAdmin[0]);
      return;
    }

    // Create admin user
    const result = await db.insert(users).values({
      email: 'eleblununana@gmail.com',
      password: '', // Empty password for Supabase auth
      name: 'Admin User',
      phone: null,
      role: 'admin',
      firebase_uid: null,
      is_active: true,
    }).returning();

    console.log('Admin user created successfully:', result[0]);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();