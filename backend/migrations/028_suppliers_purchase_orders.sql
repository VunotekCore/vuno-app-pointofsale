-- =============================================
-- MÓDULO PROVEEDORES & ÓRDENES DE COMPRA
-- Fase 1: Alter tables para nuevos campos
-- =============================================

-- 1. Verificar que suppliers tenga los campos nuevos (ya ejecutados en paso anterior)
-- ALTER TABLE suppliers
-- ADD COLUMN rfc VARCHAR(13) NULL AFTER address,
-- ADD COLUMN payment_terms VARCHAR(50) DEFAULT '30 días' AFTER rfc;

-- 2. Agregar proveedor preferido a items
-- ALTER TABLE items
-- ADD COLUMN preferred_supplier_id BINARY(16) NULL AFTER supplier_id,
-- ADD FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- NOTA: Las tablas ya usan BINARY(16) para IDs (UUID)
-- El ID de suppliers ya es BINARY(16), no BIGINT UNSIGNED

-- =============================================
-- Verificar estructura final
-- DESCRIBE suppliers;
-- DESCRIBE items;
-- =============================================