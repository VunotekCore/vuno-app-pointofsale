-- Migration: 025_add_is_admin_to_roles
-- Agrega campo is_admin a la tabla roles

ALTER TABLE roles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Actualizar el rol admin para que tenga is_admin = true
UPDATE roles SET is_admin = TRUE WHERE name = 'admin';