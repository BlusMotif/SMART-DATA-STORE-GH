-- Update admin user role to 'admin'
UPDATE users
SET role = 'admin'
WHERE email = 'eleblununana@gmail.com';

-- Verify the update
SELECT id, email, role, created_at
FROM users
WHERE email = 'eleblununana@gmail.com';