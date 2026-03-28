-- =============================================
-- Migration: Convert employees.user_id from INT to BINARY(16)
-- =============================================

USE vuno_pointofsale;

-- First, delete employees with invalid user_id (no corresponding user)
DELETE FROM employees WHERE user_id NOT IN (1, 2, 3, 4);

-- Add temporary binary column
ALTER TABLE employees ADD COLUMN user_id_bin BINARY(16) NULL;

-- Update user_id_bin with converted UUIDs based on the pattern
UPDATE employees e 
SET e.user_id_bin = (
    SELECT u.id FROM users u 
    WHERE u.id = UUID_TO_BIN(CONCAT('bbbbbbbb-bbbb-', LPAD(e.user_id, 4, '0'), '-bbbb-bbbbbbbbbbbb'))
);

-- Verify the update
SELECT e.id, e.user_id, e.first_name, e.user_id_bin 
FROM employees e;

-- Drop old column (MySQL doesn't support DROP FOREIGN KEY IF EXISTS)
ALTER TABLE employees DROP FOREIGN KEY employees_ibfk_1;

-- Drop old INT column
ALTER TABLE employees DROP COLUMN user_id;

-- Rename new column
ALTER TABLE employees CHANGE COLUMN user_id_bin user_id BINARY(16) NOT NULL;

-- Add foreign key back
ALTER TABLE employees 
    ADD CONSTRAINT employees_ibfk_1 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify the change
DESCRIBE employees;
