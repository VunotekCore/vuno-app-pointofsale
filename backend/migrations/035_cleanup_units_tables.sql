-- Migration: 035_cleanup_units_tables
-- Description: Limpiar tablas de unidades - remover campos redundantes
-- Date: 2026-03-20

-- Eliminar columnas redundantes de item_units
ALTER TABLE item_units DROP COLUMN price;
ALTER TABLE item_units DROP COLUMN cost_price;
ALTER TABLE item_units DROP COLUMN barcode;

-- Truncar para limpiar datos
TRUNCATE TABLE item_units;
