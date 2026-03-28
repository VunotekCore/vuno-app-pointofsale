-- =============================================
-- MÓDULO INVENTORY - Transferencias entre ubicaciones
-- =============================================

-- Transfers: Transferencias entre ubicaciones
CREATE TABLE IF NOT EXISTS `transfers` (
    `id` CHAR(36) PRIMARY KEY,
    `transfer_number` VARCHAR(50) UNIQUE NOT NULL,
    `from_location_id` CHAR(36) NOT NULL,
    `to_location_id` CHAR(36) NOT NULL,
    `status` ENUM('pending','in_transit','received','cancelled','rejected') DEFAULT 'pending',
    `requires_approval` TINYINT(1) DEFAULT 0,
    `approved_by` CHAR(36) NULL,
    `approved_at` TIMESTAMP NULL,
    `notes` TEXT NULL,
    `total_items` INT UNSIGNED DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`from_location_id`) REFERENCES `locations`(`id`),
    FOREIGN KEY (`to_location_id`) REFERENCES `locations`(`id`),
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`),
    INDEX `idx_transfer_status` (`status`),
    INDEX `idx_transfer_from` (`from_location_id`),
    INDEX `idx_transfer_to` (`to_location_id`),
    INDEX `idx_transfer_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transferencias entre ubicaciones';

-- Transfer Items: Detalles de transferencia
CREATE TABLE IF NOT EXISTS `transfer_items` (
    `id` CHAR(36) PRIMARY KEY,
    `transfer_id` CHAR(36) NOT NULL,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_received` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `status` ENUM('pending','in_transit','received','rejected') DEFAULT 'pending',
    `reject_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`transfer_id`) REFERENCES `transfers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`),
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE SET NULL,
    INDEX `idx_ti_transfer` (`transfer_id`),
    INDEX `idx_ti_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de transferencia';

-- =============================================
-- ROLLBACK: DROP TABLE IF EXISTS transfer_items; DROP TABLE IF EXISTS transfers;
-- =============================================
