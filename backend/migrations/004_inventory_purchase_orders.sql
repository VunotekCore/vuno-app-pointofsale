-- =============================================
-- MÓDULO INVENTORY - Órdenes de Compra y Recepciones
-- =============================================

-- Purchase Orders: Órdenes de compra
CREATE TABLE IF NOT EXISTS `purchase_orders` (
    `id` CHAR(36) PRIMARY KEY,
    `po_number` VARCHAR(50) UNIQUE NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `location_id` CHAR(36) NOT NULL,
    `status` ENUM('draft','sent','partial','received','cancelled') DEFAULT 'draft',
    `expected_date` DATE NULL,
    `notes` TEXT NULL,
    `total_amount` DECIMAL(15,2) DEFAULT 0.00,
    `received_amount` DECIMAL(15,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`),
    INDEX `idx_po_status` (`status`),
    INDEX `idx_po_supplier` (`supplier_id`),
    INDEX `idx_po_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de compra';

-- Purchase Order Items: Detalles de orden de compra
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
    `id` CHAR(36) PRIMARY KEY,
    `purchase_order_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `quantity_ordered` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_received` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(15,4) NOT NULL,
    `total_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    INDEX `idx_poi_order` (`purchase_order_id`),
    INDEX `idx_poi_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de orden de compra';

-- Receivings: Recepciones de mercancía
CREATE TABLE IF NOT EXISTS `receivings` (
    `id` CHAR(36) PRIMARY KEY,
    `receiving_number` VARCHAR(50) UNIQUE NOT NULL,
    `purchase_order_id` CHAR(36) NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `location_id` CHAR(36) NOT NULL,
    `status` ENUM('pending','completed','cancelled') DEFAULT 'pending',
    `receiving_type` ENUM('purchase_order','direct') DEFAULT 'purchase_order',
    `total_amount` DECIMAL(15,2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`),
    INDEX `idx_receiving_status` (`status`),
    INDEX `idx_receiving_date` (`received_at`),
    INDEX `idx_receiving_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recepciones de mercancía';

-- Receiving Items: Detalles de recepción
CREATE TABLE IF NOT EXISTS `receiving_items` (
    `id` CHAR(36) PRIMARY KEY,
    `receiving_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `serial_numbers` JSON NULL COMMENT 'Array de números de serie',
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(15,4) NOT NULL,
    `total_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `expire_date` DATE NULL,
    `batch_number` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`receiving_id`) REFERENCES `receivings`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    INDEX `idx_ri_receiving` (`receiving_id`),
    INDEX `idx_ri_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de recepción';

-- =============================================
-- ROLLBACK: DROP TABLE IF EXISTS receiving_items; DROP TABLE IF EXISTS receivings; DROP TABLE IF EXISTS purchase_order_items; DROP TABLE IF EXISTS purchase_orders;
-- =============================================
