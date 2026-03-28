-- Migration: 036_add_is_variable_sale_to_items
-- Description: Agregar campo para productos de venta variada
-- Date: 2026-03-20

ALTER TABLE items 
ADD COLUMN is_variable_sale TINYINT(1) NOT NULL DEFAULT 0 AFTER is_part_of_kit;

CREATE INDEX idx_items_variable_sale ON items(is_variable_sale);
