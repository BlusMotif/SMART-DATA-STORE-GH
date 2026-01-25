-- Drop custom domain name field (white-label support removed)
ALTER TABLE agents DROP COLUMN IF EXISTS custom_domain_name;
