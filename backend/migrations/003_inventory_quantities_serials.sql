-- =============================================
-- MÓDULO INVENTORY - Stock y Seriales
-- =============================================

-- Item Quantities: Stock por sucursal/almacén
CREATE TABLE IF NOT EXISTS `item_quantities` (
    `id` CHAR(36) PRIMARY KEY,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `location_id` CHAR(36) NOT NULL,
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_reserved` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `quantity_in_transit` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_stock` (`item_id`, `variation_id`, `location_id`),
    INDEX `idx_stock_location` (`location_id`),
    INDEX `idx_stock_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stock por sucursal/almacén';

-- Item Serials: Números de serie
CREATE TABLE IF NOT EXISTS `item_serials` (
    `id` CHAR(36) PRIMARY KEY,
    `item_id` CHAR(36) NOT NULL,
    `variation_id` CHAR(36) NULL,
    `serial_number` VARCHAR(255) NOT NULL,
    `cost_price` DECIMAL(15,4) NOT NULL,
    `sold_at` TIMESTAMP NULL,
    `location_id` CHAR(36) NOT NULL,
    `status` ENUM('available','sold','reserved','in_transit','returned','damaged') DEFAULT 'available',
    `received_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    `updated_by` CHAR(36) NULL,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_serial` (`serial_number`, `item_id`),
    INDEX `idx_serials_location` (`location_id`),
    INDEX `idx_serials_item` (`item_id`),
    INDEX `idx_serials_status` (`status`),
    INDEX `idx_serials_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Números de serie';

-- =============================================
-- ROLLBACK: DROP TABLE IF EXISTS item_serials; DROP TABLE IF EXISTS item_quantities;
-- =============================================
