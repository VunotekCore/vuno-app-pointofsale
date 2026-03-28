-- =============================================
-- MÓDULO SALES - Tablas de ventas y transacciones
-- Ejecutar DESPUÉS de Inventory y Users
-- =============================================

-- Tabla 1: sales (Ventas principales)
CREATE TABLE IF NOT EXISTS `sales` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de venta (ej. SALE-2026-001)',
    `customer_id` INT NULL COMMENT 'Cliente (futuro módulo customers)',
    `employee_id` INT NOT NULL COMMENT 'Cajero',
    `location_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sucursal',
    `subtotal` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Subtotal antes de descuentos/impuestos',
    `discount_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Descuento total',
    `tax_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Impuestos totales',
    `total` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total final',
    `notes` TEXT NULL COMMENT 'Notas de la venta',
    `status` ENUM('pending', 'completed', 'suspended', 'cancelled', 'layaway') DEFAULT 'pending' COMMENT 'Estado',
    `sale_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de la venta',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT,
    INDEX `idx_sale_number` (`sale_number`),
    INDEX `idx_status` (`status`),
    INDEX `idx_sale_date` (`sale_date`),
    INDEX `idx_customer_id` (`customer_id`),
    INDEX `idx_employee_id` (`employee_id`),
    INDEX `idx_location_id` (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ventas principales';

-- Tabla 2: sale_items (Detalles de ítems en venta)
CREATE TABLE IF NOT EXISTS `sale_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_id` BIGINT UNSIGNED NOT NULL COMMENT 'Venta',
    `item_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ítem de items',
    `variation_id` BIGINT UNSIGNED NULL COMMENT 'Variación',
    `serial_number` VARCHAR(255) NULL COMMENT 'Si es serializado',
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad vendida',
    `unit_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Precio unitario al momento de venta',
    `discount_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Descuento por ítem',
    `tax_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Impuesto por ítem',
    `cost_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Costo al momento (para COGS)',
    `line_total` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total de la línea',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    INDEX `idx_sale_id` (`sale_id`),
    INDEX `idx_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de ítems en venta';

-- Tabla 3: sale_payments (Pagos de la venta)
CREATE TABLE IF NOT EXISTS `sale_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_id` BIGINT UNSIGNED NOT NULL COMMENT 'Venta',
    `payment_type` ENUM('cash', 'credit', 'debit', 'check', 'gift_card', 'store_credit', 'custom') NOT NULL COMMENT 'Tipo',
    `amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Monto pagado',
    `payment_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha del pago',
    `transaction_id` VARCHAR(255) NULL COMMENT 'ID de procesador externo (ej. Stripe)',
    `reference_number` VARCHAR(100) NULL COMMENT 'Número de referencia',
    `notes` TEXT NULL COMMENT 'Notas del pago',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
    INDEX `idx_sale_id` (`sale_id`),
    INDEX `idx_payment_type` (`payment_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pagos de la venta';

-- Tabla 4: sale_suspensions (Ventas suspendidas / Layaways)
CREATE TABLE IF NOT EXISTS `sale_suspensions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `sale_id` BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'Venta suspendida',
    `suspension_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de suspensión',
    `payments_made` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Pagos parciales acumulados',
    `balance_due` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Saldo pendiente',
    `due_date` DATE NULL COMMENT 'Fecha de vencimiento del layaway',
    `notes` TEXT NULL COMMENT 'Notas de la suspensión',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
    INDEX `idx_sale_id` (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ventas suspendidas y layaways';

-- Tabla 5: returns (Devoluciones)
CREATE TABLE IF NOT EXISTS `returns` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_number` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de devolución',
    `sale_id` BIGINT UNSIGNED NOT NULL COMMENT 'Venta original',
    `employee_id` INT NOT NULL COMMENT 'Quién procesa',
    `location_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sucursal',
    `subtotal` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `tax_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `total` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total devuelto',
    `refund_method` ENUM('cash', 'credit', 'original_payment') DEFAULT 'cash' COMMENT 'Método de reembolso',
    `notes` TEXT NULL COMMENT 'Razón de devolución',
    `return_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT,
    INDEX `idx_return_number` (`return_number`),
    INDEX `idx_sale_id` (`sale_id`),
    INDEX `idx_return_date` (`return_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Devoluciones';

-- Tabla 6: return_items (Detalles de ítems devueltos)
CREATE TABLE IF NOT EXISTS `return_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_id` BIGINT UNSIGNED NOT NULL COMMENT 'Devolución',
    `sale_item_id` BIGINT UNSIGNED NULL COMMENT 'Ítem original de la venta',
    `item_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ítem',
    `variation_id` BIGINT UNSIGNED NULL COMMENT 'Variación',
    `serial_number` VARCHAR(255) NULL COMMENT 'Número de serie',
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad devuelta',
    `unit_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Precio unitario',
    `tax_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `line_total` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total línea',
    `reason` VARCHAR(255) NULL COMMENT 'Razón de la devolución',
    `condition` ENUM('new', 'opened', 'damaged') DEFAULT 'new' COMMENT 'Condición del ítem',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    INDEX `idx_return_id` (`return_id`),
    INDEX `idx_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de ítems devueltos';

-- Tabla 7: kit_components (para vender kits como un solo producto)
-- Ya existe en migración 008, verificar si existe
-- CREATE TABLE IF NOT EXISTS `kit_components` (
--     `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     `kit_item_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ítem kit (padre)',
--     `component_item_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ítem componente',
--     `quantity` DECIMAL(15,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad del componente',
--     `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (`kit_item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
--     FOREIGN KEY (`component_item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT,
--     UNIQUE KEY `uq_kit_component` (`kit_item_id`, `component_item_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Componentes de kits';

-- Insertar permisos para Sales
INSERT INTO `permissions` (`code`, `description`) VALUES 
    ('sales.view', 'View sales'),
    ('sales.create', 'Create sales'),
    ('sales.update', 'Update sales'),
    ('sales.delete', 'Cancel/delete sales'),
    ('sales.suspend', 'Suspend sales/layaways'),
    ('sales.return', 'Process returns'),
    ('sales.reports', 'View sales reports')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Asignar permisos a admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions` WHERE `code` LIKE 'sales.%'
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM `permissions` WHERE `code` IN ('sales.view', 'sales.create', 'sales.suspend', 'sales.return', 'sales.reports')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a cashier
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, id FROM `permissions` WHERE `code` IN ('sales.view', 'sales.create')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;
