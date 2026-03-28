-- Migration: 032_merge_company_config_to_companies
-- Moves company_config data into companies table and adds missing fields

-- 1. Add new columns to companies (from company_config)
ALTER TABLE companies 
  ADD COLUMN address TEXT NULL AFTER logo_url,
  ADD COLUMN phone VARCHAR(50) NULL AFTER address,
  ADD COLUMN business_email VARCHAR(255) NULL AFTER phone,
  ADD COLUMN nit VARCHAR(50) NULL AFTER business_email,
  ADD COLUMN invoice_prefix VARCHAR(10) DEFAULT 'F' AFTER nit,
  ADD COLUMN invoice_sequence INT DEFAULT 1 AFTER invoice_prefix,
  ADD COLUMN currency_code VARCHAR(3) DEFAULT 'NIO' AFTER invoice_sequence,
  ADD COLUMN currency_symbol VARCHAR(5) DEFAULT 'C$' AFTER currency_code,
  ADD COLUMN decimal_places TINYINT DEFAULT 2 AFTER currency_symbol;

-- 2. Migrate data from company_config to companies
UPDATE companies c
JOIN company_config cc ON c.id = cc.company_id
SET 
  c.address = cc.address,
  c.phone = cc.phone,
  c.business_email = cc.email,
  c.nit = cc.nit,
  c.logo_url = COALESCE(NULLIF(c.logo_url, ''), cc.logo_url),
  c.invoice_prefix = COALESCE(cc.invoice_prefix, 'F'),
  c.invoice_sequence = COALESCE(cc.invoice_sequence, 1),
  c.currency_code = COALESCE(cc.currency_code, 'NIO'),
  c.currency_symbol = COALESCE(cc.currency_symbol, 'C$'),
  c.decimal_places = COALESCE(cc.decimal_places, 2)
WHERE cc.company_id IS NOT NULL;

-- 3. For companies without company_config, create default config values
UPDATE companies SET 
  address = COALESCE(address, 'Sin dirección'),
  invoice_prefix = COALESCE(invoice_prefix, 'F'),
  invoice_sequence = COALESCE(invoice_sequence, 1),
  currency_code = COALESCE(currency_code, 'NIO'),
  currency_symbol = COALESCE(currency_symbol, 'C$'),
  decimal_places = COALESCE(decimal_places, 2)
WHERE address IS NULL;

-- ROLLBACK:
-- ALTER TABLE companies 
--   DROP COLUMN IF EXISTS address,
--   DROP COLUMN IF EXISTS phone,
--   DROP COLUMN IF EXISTS business_email,
--   DROP COLUMN IF EXISTS nit,
--   DROP COLUMN IF EXISTS invoice_prefix,
--   DROP COLUMN IF EXISTS invoice_sequence,
--   DROP COLUMN IF EXISTS currency_code,
--   DROP COLUMN IF EXISTS currency_symbol,
--   DROP COLUMN IF EXISTS decimal_places;
