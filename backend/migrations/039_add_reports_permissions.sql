-- Migration: 039_add_reports_permissions
-- Agrega permisos para reportes

INSERT INTO permissions (id, code, description) VALUES 
  (UUID_TO_BIN(UUID()), 'menu.reports', 'Acceder al módulo de reportes'),
  (UUID_TO_BIN(UUID()), 'reports.view', 'Ver reportes'),
  (UUID_TO_BIN(UUID()), 'reports.sales', 'Ver reporte de ventas'),
  (UUID_TO_BIN(UUID()), 'reports.inventory', 'Ver reporte de inventario'),
  (UUID_TO_BIN(UUID()), 'reports.purchases', 'Ver reporte de compras'),
  (UUID_TO_BIN(UUID()), 'reports.cash', 'Ver reporte de caja')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ROLLBACK: DELETE FROM permissions WHERE code IN ('menu.reports', 'reports.view', 'reports.sales', 'reports.inventory', 'reports.purchases', 'reports.cash');
