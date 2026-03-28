-- =============================================
-- MÓDULO INVENTORY - Tablas principales
-- Ejecutar DESPUÉS del Core
-- =============================================

CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `contact_name` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `custom_fields` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Proveedores - Inventory';

CREATE TABLE IF NOT EXISTS `items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_number` VARCHAR(255) UNIQUE NOT NULL COMMENT 'SKU interno',
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category_id` BIGINT UNSIGNED NULL,
    `supplier_id` BIGINT UNSIGNED NULL,
    `cost_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `unit_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `reorder_level` INT UNSIGNED DEFAULT 0,
    `reorder_quantity` INT UNSIGNED DEFAULT 0,
    `is_serialized` TINYINT(1) DEFAULT 0,
    `is_service` TINYINT(1) DEFAULT 0,
    `is_kit` TINYINT(1) DEFAULT 0,
    `image_url` VARCHAR(512) NULL,
    `custom_fields` JSON NULL,
    `status` ENUM('active','inactive','discontinued') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Productos padre';

CREATE TABLE IF NOT EXISTS `item_variations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `sku` VARCHAR(255) UNIQUE NOT NULL,
    `unit_price` DECIMAL(15,4) NOT NULL,
    `cost_price` DECIMAL(15,4) NOT NULL,
    `attributes` JSON NOT NULL COMMENT '{"color":"Rojo","talla":"M"}',
    `image_url` VARCHAR(512) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Variaciones (tallas, colores)';

CREATE TABLE IF NOT EXISTS `item_quantities` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 0,
    `quantity_reserved` DECIMAL(15,4) DEFAULT 0,
    `quantity_in_transit` DECIMAL(15,4) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_stock` (`item_id`,`variation_id`,`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stock por ubicación';

CREATE TABLE IF NOT EXISTS `item_serials` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `variation_id` BIGINT UNSIGNED NULL,
    `serial_number` VARCHAR(255) NOT NULL,
    `cost_price` DECIMAL(15,4) NOT NULL,
    `sold_at` TIMESTAMP NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('available','sold','reserved','in_transit','returned','damaged') DEFAULT 'available',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`variation_id`) REFERENCES `item_variations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_serial` (`serial_number`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Números de serie';
