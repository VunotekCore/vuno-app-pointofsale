-- =============================================
-- MÓDULO INVENTORY - Ajustes y Movimientos
-- =============================================

-- Adjustments: Conteos físicos y ajustes
CREATE TABLE IF NOT EXISTS `adjustments` (
    `id` CHAR(36) PRIMARY KEY,
    `adjustment_number` VARCHAR(50) UNIQUE NOT NULL,
    `location_id` CHAR(36) NOT NULL,
    `adjustment_type` ENUM('count','damage','loss','found','correction') NOT NULL,
    `status` ENUM('draft','pending','completed','cancelled') DEFAULT 'draft',
    `total_items` INT UNSIGNED DEFAULT 0,
    `total_quantity_change` DECIMAL(15,4) DEFAULT 0.0000,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`),
    INDEX `idx_adjustment_status` (`status`),
    INDEX `idx_adjustment_location` (`location_id`),
    INDEX `idx_adjustment_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ajustes de inventario';

-- Adjustment Items: Detalles de ajuste
CREATE TABLE IF NOT EXISTS `adjustment_items` (
    `id` CHAR(36) PRIMARY KEY,
    `adjustment_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `quantity_counted` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_system` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_difference` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(15,4) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`adjustment_id`) REFERENCES `adjustments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    INDEX `idx_ai_adjustment` (`adjustment_id`),
    INDEX `idx_ai_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de ajuste de inventario';

-- Inventory Movements: Historial de movimientos (auditoría)
CREATE TABLE IF NOT EXISTS `inventory_movements` (
    `id` CHAR(36) PRIMARY KEY,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `location_id` CHAR(36) NOT NULL,
    `movement_type` ENUM(
        'purchase',
        'receiving',
        'sale',
        'return',
        'transfer_out',
        'transfer_in',
        'adjustment_in',
        'adjustment_out',
        'reservation',
        'reservation_release',
        'damaged',
        'lost',
        'found'
    ) NOT NULL,
    `quantity` DECIMAL(15,4) NOT NULL,
    `quantity_before` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_after` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `total_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `reference_type` VARCHAR(50) NULL COMMENT 'purchase_order, receiving, transfer, adjustment, sale',
    `reference_id` CHAR(36) NULL,
    `serial_numbers` JSON NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    INDEX `idx_movements_item` (`item_id`),
    INDEX `idx_movements_location` (`location_id`),
    INDEX `idx_movements_type` (`movement_type`),
    INDEX `idx_movements_reference` (`reference_type`, `reference_id`),
    INDEX `idx_movements_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de movimientos de inventario';

-- =============================================
-- ROLLBACK: DROP TABLE IF EXISTS inventory_movements; DROP TABLE IF EXISTS adjustment_items; DROP TABLE IF EXISTS adjustments;
-- =============================================
