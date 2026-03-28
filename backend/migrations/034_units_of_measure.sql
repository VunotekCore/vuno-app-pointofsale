-- Migration: 034_units_of_measure
-- Description: Crear tablas para unidades de medida y precios por unidad
-- Date: 2026-03-20

-- Tabla de unidades de medida
CREATE TABLE IF NOT EXISTS units_of_measure (
    id BINARY(16) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    type ENUM('unit', 'weight', 'volume', 'length') NOT NULL DEFAULT 'unit',
    conversion_factor DECIMAL(15,6) DEFAULT 1.000000,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_units_type ON units_of_measure(type);
CREATE INDEX idx_units_active ON units_of_measure(is_active);

-- Tabla de precios/unidades por producto
CREATE TABLE IF NOT EXISTS item_units (
    id BINARY(16) PRIMARY KEY,
    item_id BINARY(16) NOT NULL,
    unit_id BINARY(16) NOT NULL,
    price DECIMAL(15,4) NOT NULL DEFAULT 0,
    cost_price DECIMAL(15,4) DEFAULT NULL,
    barcode VARCHAR(100) DEFAULT NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_item_unit (item_id, unit_id)
);

-- Índices
CREATE INDEX idx_item_units_item ON item_units(item_id);
CREATE INDEX idx_item_units_unit ON item_units(unit_id);
CREATE INDEX idx_item_units_default ON item_units(is_default);

-- Agregar default_unit_id a items
ALTER TABLE items ADD COLUMN default_unit_id BINARY(16) DEFAULT NULL AFTER unit_price;
ALTER TABLE items ADD CONSTRAINT fk_items_default_unit FOREIGN KEY (default_unit_id) REFERENCES units_of_measure(id) ON DELETE SET NULL;

-- Insertar unidades por defecto
INSERT INTO units_of_measure (id, name, abbreviation, type, conversion_factor) VALUES
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000001'), 'Unidad', 'und', 'unit', 1.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000002'), 'Libra', 'lb', 'weight', 453.592000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000003'), 'Kilogramo', 'kg', 'weight', 1000.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000004'), 'Gramo', 'g', 'weight', 1.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000005'), 'Onza', 'oz', 'weight', 28.349500),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000006'), 'Litro', 'L', 'volume', 1000.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000007'), 'Mililitro', 'ml', 'volume', 1.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000008'), 'Galón', 'gal', 'volume', 3785.410000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000009'), '1/2 Libra', '1/2lb', 'weight', 226.796000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000010'), '1/4 Libra', '1/4lb', 'weight', 113.398000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000011'), '1/2 Litro', '1/2L', 'volume', 500.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000012'), '1/4 Litro', '1/4L', 'volume', 250.000000),
(UUID_TO_BIN('a0000000-0000-0000-0000-000000000013'), 'Copa', 'copa', 'volume', 240.000000);

-- Crear unidad "Unidad" por defecto para todos los productos existentes
INSERT INTO item_units (id, item_id, unit_id, price, is_default, is_active)
SELECT 
    UUID_TO_BIN(UUID()),
    id,
    UUID_TO_BIN('a0000000-0000-0000-0000-000000000001'),
    unit_price,
    1,
    1
FROM items WHERE is_delete = 0 OR is_delete IS NULL;

-- Actualizar default_unit_id en items
UPDATE items 
SET default_unit_id = UUID_TO_BIN('a0000000-0000-0000-0000-000000000001')
WHERE default_unit_id IS NULL;
