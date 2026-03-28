-- Migration: Add ImageKit configuration to companies table
-- Date: 2026-03-23

ALTER TABLE companies 
ADD COLUMN imagekit_private_key VARCHAR(255) DEFAULT NULL AFTER decimal_places,
ADD COLUMN imagekit_url_endpoint VARCHAR(255) DEFAULT NULL AFTER imagekit_private_key;
