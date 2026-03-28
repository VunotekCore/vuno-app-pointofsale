-- =============================================
-- Migration: Fix role_permissions to use BINARY(16)
-- =============================================

USE vuno_pointofsale;

-- Check current structure
DESCRIBE role_permissions;

-- Convert role_id and permission_id to BINARY(16)
ALTER TABLE role_permissions 
    MODIFY COLUMN role_id BINARY(16) NOT NULL,
    MODIFY COLUMN permission_id BINARY(16) NOT NULL;

-- Verify the change
DESCRIBE role_permissions;
