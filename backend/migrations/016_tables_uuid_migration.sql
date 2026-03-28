-- =============================================
-- Migración: Tablas a UUID v7
-- Objetivo: Convertir IDs autoincrementales a UUIDs binary(16)
-- Tablas: inventory_transfer_items, item_serials, payment_methods, 
--         permissions, purchase_orders, purchase_order_items, 
--         receivings, receiving_items
-- =============================================

USE vuno_pointofsale;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. INVENTORY_TRANSFER_ITEMS
-- =============================================
-- Crear tabla temporal para respaldar datos
CREATE TEMPORARY TABLE temp_inventory_transfer_items AS 
SELECT * FROM inventory_transfer_items;

-- Eliminar foreign keys
ALTER TABLE inventory_transfer_items DROP FOREIGN KEY inventory_transfer_items_ibfk_1;

-- Modificar la tabla para usar BINARY(16) para el id y transfer_id
ALTER TABLE inventory_transfer_items 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN transfer_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN item_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN variation_id VARCHAR(36) NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

-- Generar nuevos UUIDs para los datos existentes
UPDATE temp_inventory_transfer_items SET id = UUID();
-- Mapear transfer_id a los UUIDs de inventory_transfers
UPDATE temp_inventory_transfer_items tti
SET tti.transfer_id = (
    SELECT BIN_TO_UUID(it.id) 
    FROM inventory_transfers it 
    WHERE it.id = (SELECT id FROM (SELECT id FROM inventory_transfers LIMIT 1) AS t)
    LIMIT 1
);

-- Regenerar IDs únicos para cada registro
CREATE TEMPORARY TABLE temp_transfer_id_map AS
SELECT old.id as old_id, UUID() as new_id, UUID() as new_transfer_id
FROM (SELECT * FROM temp_inventory_transfer_items) old;

-- Recrear la tabla con los nuevos UUIDs
TRUNCATE TABLE inventory_transfer_items;

INSERT INTO inventory_transfer_items (
    id, transfer_id, item_id, variation_id, quantity, 
    quantity_received, status, created_by, updated_by, created_at, updated_at
)
SELECT 
    tm.new_id,
    tm.new_transfer_id,
    ti.item_id,
    ti.variation_id,
    ti.quantity,
    ti.quantity_received,
    ti.status,
    ti.created_by,
    ti.updated_by,
    ti.created_at,
    ti.updated_at
FROM temp_inventory_transfer_items ti
JOIN temp_transfer_id_map tm ON ti.id = tm.old_id;

-- Agregar la foreign key nuevamente
ALTER TABLE inventory_transfer_items 
    ADD CONSTRAINT inventory_transfer_items_ibfk_1 
    FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(id) ON DELETE CASCADE;

DROP TEMPORARY TABLE temp_inventory_transfer_items;
DROP TEMPORARY TABLE temp_transfer_id_map;

-- =============================================
-- 2. ITEM_SERIALS
-- =============================================
-- Crear tabla temporal
CREATE TEMPORARY TABLE temp_item_serials AS 
SELECT * FROM item_serials;

-- Modificar la tabla
ALTER TABLE item_serials 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN item_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN variation_id VARCHAR(36) NULL,
    MODIFY COLUMN location_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

-- Regenerar IDs
UPDATE temp_item_serials SET id = UUID();

CREATE TEMPORARY TABLE temp_serial_id_map AS
SELECT old.id as old_id, UUID() as new_id
FROM (SELECT * FROM temp_item_serials) old;

TRUNCATE TABLE item_serials;

INSERT INTO item_serials (
    id, item_id, variation_id, serial_number, cost_price, 
    sold_at, location_id, status, received_at, created_at, 
    updated_at, created_by, updated_by
)
SELECT 
    tm.new_id,
    is1.item_id,
    is1.variation_id,
    is1.serial_number,
    is1.cost_price,
    is1.sold_at,
    is1.location_id,
    is1.status,
    is1.received_at,
    is1.created_at,
    is1.updated_at,
    is1.created_by,
    is1.updated_by
FROM temp_item_serials is1
JOIN temp_serial_id_map tm ON is1.id = tm.old_id;

DROP TEMPORARY TABLE temp_item_serials;
DROP TEMPORARY TABLE temp_serial_id_map;

-- =============================================
-- 3. PAYMENT_METHODS
-- =============================================
-- Respaldar datos
CREATE TEMPORARY TABLE temp_payment_methods AS 
SELECT * FROM payment_methods;

-- Modificar la tabla para usar VARCHAR(36) - más flexible
ALTER TABLE payment_methods 
    MODIFY COLUMN id VARCHAR(36) NOT NULL;

-- Generar nuevos UUIDs
UPDATE temp_payment_methods SET id = UUID();

CREATE TEMPORARY TABLE temp_payment_method_id_map AS
SELECT old.id as old_id, new_id
FROM (SELECT id, ROW_NUMBER() OVER() as rn FROM temp_payment_methods) old
CROSS JOIN (SELECT UUID() as new_id FROM temp_payment_methods LIMIT 1) base
JOIN (SELECT UUID() as new_id FROM temp_payment_methods) p
WHERE old.rn = p.new_id;

--由于MySQL限制,手动映射
TRUNCATE TABLE payment_methods;

INSERT INTO payment_methods (
    id, name, code, type, is_active, is_default, 
    requires_reference, allow_partial, sort_order, created_at, updated_at
)
SELECT 
    UUID(),
    pm.name,
    pm.code,
    pm.type,
    pm.is_active,
    pm.is_default,
    pm.requires_reference,
    pm.allow_partial,
    pm.sort_order,
    pm.created_at,
    pm.updated_at
FROM temp_payment_methods pm;

-- Actualizar drawer_transactions
ALTER TABLE drawer_transactions 
    MODIFY COLUMN payment_method_id VARCHAR(36) NULL;

DROP TEMPORARY TABLE temp_payment_methods;

-- =============================================
-- 4. PERMISSIONS
-- =============================================
CREATE TEMPORARY TABLE temp_permissions AS 
SELECT * FROM permissions;

ALTER TABLE permissions 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

TRUNCATE TABLE permissions;

INSERT INTO permissions (
    id, code, description, created_at, updated_at, created_by, updated_by, is_delete
)
SELECT 
    UUID(),
    p.code,
    p.description,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    p.is_delete
FROM temp_permissions p;

-- Actualizar role_permissions
ALTER TABLE role_permissions 
    MODIFY COLUMN permission_id VARCHAR(36) NOT NULL;

DROP TEMPORARY TABLE temp_permissions;

-- =============================================
-- 5. PURCHASE_ORDERS y PURCHASE_ORDER_ITEMS
-- =============================================
-- Purchase Orders
CREATE TEMPORARY TABLE temp_purchase_orders AS 
SELECT * FROM purchase_orders;

ALTER TABLE purchase_orders 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN supplier_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN location_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

TRUNCATE TABLE purchase_orders;

INSERT INTO purchase_orders (
    id, po_number, supplier_id, location_id, status, expected_date, 
    notes, total_amount, received_amount, created_at, updated_at, 
    created_by, updated_by, is_delete
)
SELECT 
    UUID(),
    po.po_number,
    po.supplier_id,
    po.location_id,
    po.status,
    po.expected_date,
    po.notes,
    po.total_amount,
    po.received_amount,
    po.created_at,
    po.updated_at,
    po.created_by,
    po.updated_by,
    po.is_delete
FROM temp_purchase_orders po;

-- Purchase Order Items
CREATE TEMPORARY TABLE temp_purchase_order_items AS 
SELECT * FROM purchase_order_items;

ALTER TABLE purchase_order_items 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN purchase_order_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN item_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN variation_id VARCHAR(36) NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

TRUNCATE TABLE purchase_order_items;

INSERT INTO purchase_order_items (
    id, purchase_order_id, item_id, variation_id, quantity_ordered, 
    quantity_received, cost_price, total_cost, created_at, updated_at, 
    created_by, updated_by
)
SELECT 
    UUID(),
    poi.purchase_order_id,
    poi.item_id,
    poi.variation_id,
    poi.quantity_ordered,
    poi.quantity_received,
    poi.cost_price,
    poi.total_cost,
    poi.created_at,
    poi.updated_at,
    poi.created_by,
    poi.updated_by
FROM temp_purchase_order_items poi;

DROP TEMPORARY TABLE temp_purchase_orders;
DROP TEMPORARY TABLE temp_purchase_order_items;

-- =============================================
-- 6. RECEIVINGS y RECEIVING_ITEMS
-- =============================================
-- Receivings
CREATE TEMPORARY TABLE temp_receivings AS 
SELECT * FROM receivings;

ALTER TABLE receivings 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN purchase_order_id VARCHAR(36) NULL,
    MODIFY COLUMN supplier_id VARCHAR(36) NULL,
    MODIFY COLUMN location_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

TRUNCATE TABLE receivings;

INSERT INTO receivings (
    id, receiving_number, purchase_order_id, supplier_id, location_id, 
    status, receiving_type, total_amount, notes, received_at, 
    created_at, updated_at, created_by, updated_by, is_delete
)
SELECT 
    UUID(),
    r.receiving_number,
    r.purchase_order_id,
    r.supplier_id,
    r.location_id,
    r.status,
    r.receiving_type,
    r.total_amount,
    r.notes,
    r.received_at,
    r.created_at,
    r.updated_at,
    r.created_by,
    r.updated_by,
    r.is_delete
FROM temp_receivings r;

-- Receiving Items
CREATE TEMPORARY TABLE temp_receiving_items AS 
SELECT * FROM receiving_items;

ALTER TABLE receiving_items 
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN receiving_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN item_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN variation_id VARCHAR(36) NULL,
    MODIFY COLUMN created_by VARCHAR(36) NULL,
    MODIFY COLUMN updated_by VARCHAR(36) NULL;

TRUNCATE TABLE receiving_items;

INSERT INTO receiving_items (
    id, receiving_id, item_id, variation_id, quantity, cost_price, 
    total_cost, serial_numbers, expire_date, batch_number, 
    created_at, updated_at, created_by, updated_by
)
SELECT 
    UUID(),
    ri.receiving_id,
    ri.item_id,
    ri.variation_id,
    ri.quantity,
    ri.cost_price,
    ri.total_cost,
    ri.serial_numbers,
    ri.expire_date,
    ri.batch_number,
    ri.created_at,
    ri.updated_at,
    ri.created_by,
    ri.updated_by
FROM temp_receiving_items ri;

DROP TEMPORARY TABLE temp_receivings;
DROP TEMPORARY TABLE temp_receiving_items;

-- =============================================
-- HABILITAR FOREIGN KEYS
-- =============================================
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar las tablas
SELECT 'inventory_transfer_items' as table_name, COUNT(*) as count FROM inventory_transfer_items
UNION ALL
SELECT 'item_serials', COUNT(*) FROM item_serials
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'purchase_order_items', COUNT(*) FROM purchase_order_items
UNION ALL
SELECT 'receivings', COUNT(*) FROM receivings
UNION ALL
SELECT 'receiving_items', COUNT(*) FROM receiving_items;
