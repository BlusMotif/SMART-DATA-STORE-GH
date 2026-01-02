-- Add user to database (run this in Supabase SQL Editor)
INSERT INTO users (id, email, password, name, phone, role, wallet_balance, is_active, created_at)
VALUES (
  'cf6e6338-9b01-4eaf-9cf8-ef34d2af97af',
  'enyonam@gmail.com',
  '', -- Empty password since auth is handled by Supabase
  'ENYONAM DANGO',
  NULL,
  'user',
  0.00,
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify user was added
SELECT id, email, name, role, wallet_balance FROM users WHERE email = 'enyonam@gmail.com';
