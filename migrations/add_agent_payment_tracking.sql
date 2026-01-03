-- Add payment tracking fields to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS payment_pending BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS activation_fee NUMERIC(10, 2) DEFAULT 60.00;

-- Update existing agents to mark payment as received (backward compatibility)
UPDATE agents 
SET payment_pending = false 
WHERE is_approved = true;

-- Add comment for documentation
COMMENT ON COLUMN agents.payment_pending IS 'Whether the agent activation payment is still pending';
COMMENT ON COLUMN agents.activation_fee IS 'The activation fee amount paid by the agent';
