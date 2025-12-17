import 'dotenv/config';
import { supabaseServer } from '../server/supabase';

async function updateAdminUser() {
  if (!supabaseServer) {
    console.error('Supabase server client not initialized. Check environment variables.');
    return;
  }

  try {
    // Update the existing user
    const { data, error } = await supabaseServer.auth.admin.updateUserById(
      'dd0dfb4e-530e-4813-a7ef-f11b24bc1b49',
      {
        password: 'NUNANA123',
        user_metadata: {
          name: 'Admin User',
          role: 'admin'
        },
        email_confirm: true
      }
    );

    if (error) {
      console.error('Error updating admin user:', error);
      return;
    }

    console.log('Admin user updated successfully:', data.user);
  } catch (error) {
    console.error('Failed to update admin user:', error);
  }
}

updateAdminUser();