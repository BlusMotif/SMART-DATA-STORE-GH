-- Add audience targeting to announcements table
DO $$
BEGIN
  -- Add audiences column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'audiences'
  ) THEN
    ALTER TABLE announcements ADD COLUMN audiences TEXT DEFAULT '["all"]';
  END IF;
END $$;
