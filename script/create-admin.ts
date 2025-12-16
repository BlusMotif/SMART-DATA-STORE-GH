import 'dotenv/config';
import { supabaseServer } from '../server/supabase';

async function createAdminUser() {
  if (!supabaseServer) {
    console.error('Supabase server client not initialized. Check environment variables.');
    return;
  }

  try {
    const { data, error } = await supabaseServer.auth.admin.createUser({
      email: 'eleblununana@gmail.com',
      password: 'NUNANA123',
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      },
      email_confirm: true // Auto-confirm email
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('Admin user created successfully:', data.user);
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
}

createAdminUser();