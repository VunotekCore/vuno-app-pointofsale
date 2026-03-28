-- Migration: 009_add_transfer_permissions
-- Agrega permisos para transferencias

INSERT INTO permissions (code, description) VALUES 
  ('transfers.read', 'Ver transferencias'),
  ('transfers.create', 'Crear transferencias'),
  ('transfers.update', 'Actualizar transferencias'),
  ('transfers.delete', 'Eliminar transferencias')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ROLLBACK: DELETE FROM permissions WHERE code IN ('transfers.read', 'transfers.create', 'transfers.update', 'transfers.delete');
