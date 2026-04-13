-- Migration: 048_add_return_sequence_to_companies
-- Description: Add return_sequence column to companies table for returns management

ALTER TABLE companies ADD COLUMN return_sequence INT DEFAULT '1' AFTER invoice_sequence;