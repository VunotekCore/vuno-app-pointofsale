-- Migration: 038_add_payments_sales_permissions
-- Agrega permisos para payments y sales

INSERT INTO permissions (id, code, description) VALUES 
  (UUID_TO_BIN(UUID()), 'payments.read', 'Ver pagos y cajas'),
  (UUID_TO_BIN(UUID()), 'payments.view', 'Ver pagos y cajas'),
  (UUID_TO_BIN(UUID()), 'payments.create', 'Crear pagos y ajustes'),
  (UUID_TO_BIN(UUID()), 'payments.update', 'Actualizar pagos y cajas'),
  (UUID_TO_BIN(UUID()), 'payments.delete', 'Eliminar pagos'),
  (UUID_TO_BIN(UUID()), 'sales.read', 'Ver ventas'),
  (UUID_TO_BIN(UUID()), 'sales.view', 'Ver ventas'),
  (UUID_TO_BIN(UUID()), 'sales.create', 'Crear ventas'),
  (UUID_TO_BIN(UUID()), 'sales.update', 'Actualizar ventas'),
  (UUID_TO_BIN(UUID()), 'sales.delete', 'Eliminar ventas'),
  (UUID_TO_BIN(UUID()), 'cash_drawers.read', 'Ver cajas'),
  (UUID_TO_BIN(UUID()), 'cash_drawers.view', 'Ver cajas'),
  (UUID_TO_BIN(UUID()), 'cash_drawers.create', 'Abrir cajas'),
  (UUID_TO_BIN(UUID()), 'cash_drawers.update', 'Actualizar cajas'),
  (UUID_TO_BIN(UUID()), 'cash_drawers.delete', 'Cerrar cajas')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ROLLBACK: DELETE FROM permissions WHERE code IN ('payments.read', 'payments.view', 'payments.create', 'payments.update', 'payments.delete', 'sales.read', 'sales.view', 'sales.create', 'sales.update', 'sales.delete', 'cash_drawers.read', 'cash_drawers.view', 'cash_drawers.create', 'cash_drawers.update', 'cash_drawers.delete');
