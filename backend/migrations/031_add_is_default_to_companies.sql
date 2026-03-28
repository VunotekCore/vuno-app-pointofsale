-- Migration: 031_add_is_default_to_companies
-- Adds is_default field to companies table for default company selection

ALTER TABLE companies ADD COLUMN is_default TINYINT(1) DEFAULT 0 AFTER is_active;

ALTER TABLE companies ADD INDEX idx_companies_default (is_default);

UPDATE companies SET is_default = 1 WHERE slug = 'empresa-principal';

-- ROLLBACK:
-- ALTER TABLE companies DROP INDEX idx_companies_default;
-- ALTER TABLE companies DROP COLUMN is_default;
