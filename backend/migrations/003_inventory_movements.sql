-- =============================================
-- MÓDULO INVENTORY - Movimientos
-- =============================================

-- Órdenes de compra
CREATE TABLE IF NOT EXISTS `purchase_orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `po_number` VARCHAR(50) UNIQUE NOT NULL,
    `supplier_id` BIGINT UNSIGNED NOT NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('draft','sent','partial','received','cancelled') DEFAULT 'draft',
    `expected_date` DATE NULL,
    `notes` TEXT NULL,
    `total_amount` DECIMAL(15,2) DEFAULT 0,
    `received_amount` DECIMAL(15,2) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Órdenes de compra';

CREATE TABLE IF NOT EXISTS `purchase_order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `purchase_order_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `quantity_ordered` DECIMAL(15,4) NOT NULL,
    `quantity_received` DECIMAL(15,4) DEFAULT 0,
    `cost_price` DECIMAL(15,4) NOT NULL,
    `total_cost` DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recepciones de mercancía
CREATE TABLE IF NOT EXISTS `receivings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `receiving_number` VARCHAR(50) UNIQUE NOT NULL,
    `purchase_order_id` BIGINT UNSIGNED NULL,
    `supplier_id` BIGINT UNSIGNED NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('pending','completed','cancelled') DEFAULT 'pending',
    `receiving_type` ENUM('purchase_order','direct') DEFAULT 'purchase_order',
    `total_amount` DECIMAL(15,2) DEFAULT 0,
    `notes` TEXT NULL,
    `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recepción de mercancía';

CREATE TABLE IF NOT EXISTS `receiving_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `receiving_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `quantity` DECIMAL(15,4) NOT NULL,
    `cost_price` DECIMAL(15,4) NOT NULL,
    `total_cost` DECIMAL(15,2) DEFAULT 0,
    `serial_numbers` JSON NULL,
    `expire_date` DATE NULL,
    `batch_number` VARCHAR(100) NULL,
    FOREIGN KEY (`receiving_id`) REFERENCES `receivings`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transferencias entre ubicaciones
CREATE TABLE IF NOT EXISTS `inventory_transfers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transfer_number` VARCHAR(50) UNIQUE NOT NULL,
    `from_location_id` BIGINT UNSIGNED NOT NULL,
    `to_location_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('pending','in_transit','completed','cancelled','rejected') DEFAULT 'pending',
    `requires_approval` TINYINT(1) DEFAULT 0,
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` TIMESTAMP NULL,
    `notes` TEXT NULL,
    `total_items` INT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`from_location_id`) REFERENCES `locations`(`id`),
    FOREIGN KEY (`to_location_id`) REFERENCES `locations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Traslados entre ubicaciones';

CREATE TABLE IF NOT EXISTS `inventory_transfer_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `transfer_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `quantity` DECIMAL(15,4) NOT NULL,
    `quantity_received` DECIMAL(15,4) DEFAULT 0,
    `status` ENUM('pending','in_transit','received','rejected') DEFAULT 'pending',
    FOREIGN KEY (`transfer_id`) REFERENCES `inventory_transfers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajustes y conteos físicos
CREATE TABLE IF NOT EXISTS `inventory_adjustments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `adjustment_number` VARCHAR(50) UNIQUE NOT NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `adjustment_type` ENUM('count','damage','theft','correction','loss','found') NOT NULL,
    `status` ENUM('draft','pending','completed','cancelled') DEFAULT 'draft',
    `notes` TEXT NULL,
    `total_items` INT UNSIGNED DEFAULT 0,
    `total_quantity_change` DECIMAL(15,4) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ajustes y conteos físicos';

CREATE TABLE IF NOT EXISTS `inventory_adjustment_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `adjustment_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `quantity_before` DECIMAL(15,4) NOT NULL,
    `quantity_counted` DECIMAL(15,4) NOT NULL,
    `quantity_difference` DECIMAL(15,4) NOT NULL,
    `unit_cost` DECIMAL(15,4) NOT NULL,
    `reason` VARCHAR(255) NULL,
    FOREIGN KEY (`adjustment_id`) REFERENCES `inventory_adjustments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial completo de movimientos (Audit Log)
CREATE TABLE IF NOT EXISTS `inventory_movements` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `quantity_change` DECIMAL(15,4) NOT NULL COMMENT 'Positivo o negativo',
    `quantity_before` DECIMAL(15,4) NOT NULL DEFAULT 0,
    `quantity_after` DECIMAL(15,4) NOT NULL DEFAULT 0,
    `movement_type` ENUM('purchase','receiving','sale','return','transfer_in','transfer_out','adjustment','count','reservation','reservation_release','damaged','lost','found') NOT NULL,
    `reference_type` VARCHAR(100) NULL COMMENT 'purchase_order, receiving, transfer, adjustment',
    `reference_id` BIGINT UNSIGNED NULL,
    `unit_cost` DECIMAL(15,4) DEFAULT 0,
    `total_cost` DECIMAL(15,2) DEFAULT 0,
    `serial_numbers` JSON NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`),
    INDEX `idx_movements_reference` (`reference_type`,`reference_id`),
    INDEX `idx_movements_item` (`item_id`),
    INDEX `idx_movements_location` (`location_id`),
    INDEX `idx_movements_type` (`movement_type`),
    INDEX `idx_movements_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial completo de movimientos (Audit Log)';
