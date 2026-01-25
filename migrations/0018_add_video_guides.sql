-- Create table for video guides
CREATE TABLE IF NOT EXISTS video_guides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- guest | customer | agent
  url TEXT NOT NULL,
  provider TEXT, -- youtube | vimeo | mp4 | other
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS video_guides_category_idx ON video_guides(category);
CREATE INDEX IF NOT EXISTS video_guides_published_idx ON video_guides(is_published);
