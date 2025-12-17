import 'dotenv/config';
import { db } from '../server/db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // The user already exists in Supabase Auth with this ID
    const userId = 'dd0dfb4e-530e-4813-a7ef-f11b24bc1b49';

    // Hash the password
    const hashedPassword = await bcrypt.hash('NUNANA123', 10);

    const userData = {
      id: userId,
      email: 'eleblununana@gmail.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      isActive: true,
    };

    // Insert into database
    await db.insert(users).values(userData);

    console.log('Admin user inserted into database successfully');
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
}

createAdminUser();