-- =============================================
-- Migración: Cambiar item_id y variation_id a BINARY(16) en sale_items
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Tabla: sale_items
-- =============================================
ALTER TABLE sale_items 
    MODIFY COLUMN item_id BINARY(16) NOT NULL,
    MODIFY COLUMN variation_id BINARY(16) NULL;

SET FOREIGN_KEY_CHECKS = 1;
