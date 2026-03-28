-- Agregar campo is_default a customers
ALTER TABLE customers ADD COLUMN is_default TINYINT(1) DEFAULT 0 COMMENT 'Cliente por defecto' AFTER tax_exempt;

-- Crear índice para is_default
ALTER TABLE customers ADD INDEX idx_is_default (`is_default`);
