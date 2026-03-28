-- =============================================
-- MÓDULO CUSTOMERS - Tablas de clientes
-- =============================================

-- Tabla 1: customers (Clientes)
CREATE TABLE IF NOT EXISTS `customers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_number` VARCHAR(50) UNIQUE NULL COMMENT 'Número de cliente opcional',
    `first_name` VARCHAR(100) NOT NULL COMMENT 'Nombre',
    `last_name` VARCHAR(100) NULL COMMENT 'Apellido',
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `company` VARCHAR(255) NULL,
    `tax_id` VARCHAR(50) NULL COMMENT 'RFC/Tax ID para facturas',
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL DEFAULT 'Mexico',
    `postal_code` VARCHAR(20) NULL,
    `customer_group_id` INT UNSIGNED NULL COMMENT 'Grupo de cliente',
    `points_balance` INT UNSIGNED DEFAULT 0 COMMENT 'Puntos de lealtad',
    `credit_limit` DECIMAL(15,4) DEFAULT 0.0000 COMMENT 'Límite de crédito',
    `credit_balance` DECIMAL(15,4) DEFAULT 0.0000 COMMENT 'Saldo actual',
    `price_tier` TINYINT UNSIGNED DEFAULT 1 COMMENT 'Nivel de precio (1-5)',
    `tax_exempt` TINYINT(1) DEFAULT 0 COMMENT 'Exento de impuestos',
    `notes` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customer_number` (`customer_number`),
    INDEX `idx_email` (`email`),
    INDEX `idx_phone` (`phone`),
    INDEX `idx_name` (`last_name`, `first_name`),
    INDEX `idx_customer_group_id` (`customer_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Clientes';

-- Tabla 2: customer_groups (Grupos de clientes)
CREATE TABLE IF NOT EXISTS `customer_groups` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `discount_percent` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Descuento % para el grupo',
    `price_tier` TINYINT UNSIGNED DEFAULT 1,
    `points_multiplier` DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Multiplicador de puntos',
    `is_default` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Grupos de clientes';

-- Tabla 3: customer_points_log (Historial de puntos)
CREATE TABLE IF NOT EXISTS `customer_points_log` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT UNSIGNED NOT NULL,
    `points` INT NOT NULL COMMENT 'Puntos ganados/redimidos (negativo = redimido)',
    `points_after` INT UNSIGNED NOT NULL COMMENT 'Saldo después',
    `reference_type` VARCHAR(50) NULL COMMENT 'sale, return, reward, adjustment',
    `reference_id` BIGINT UNSIGNED NULL,
    `description` VARCHAR(255) NULL,
    `expires_at` DATE NULL COMMENT 'Fecha de expiración de puntos',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    INDEX `idx_customer_id` (`customer_id`),
    INDEX `idx_reference` (`reference_type`, `reference_id`),
    INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de puntos';

-- Tabla 4: customer_rewards (Recompensas disponibles)
CREATE TABLE IF NOT EXISTS `customer_rewards` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `points_required` INT UNSIGNED NOT NULL,
    `discount_percent` DECIMAL(5,2) DEFAULT 0.00,
    `discount_amount` DECIMAL(15,4) DEFAULT 0.0000,
    `free_item_id` BIGINT UNSIGNED NULL COMMENT 'Item gratuitio',
    `free_item_quantity` DECIMAL(15,4) DEFAULT 1.0000,
    `is_active` TINYINT(1) DEFAULT 1,
    `valid_from` DATE NULL,
    `valid_until` DATE NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`free_item_id`) REFERENCES `items`(`id`) ON DELETE SET NULL,
    INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recompensas canjeables';

-- Tabla 5: customer_reward_redemptions (Canjes de recompensas)
CREATE TABLE IF NOT EXISTS `customer_reward_redemptions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT UNSIGNED NOT NULL,
    `reward_id` INT UNSIGNED NOT NULL,
    `points_used` INT UNSIGNED NOT NULL,
    `discount_provided` DECIMAL(15,4) DEFAULT 0.0000,
    `sale_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reward_id`) REFERENCES `customer_rewards`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL,
    INDEX `idx_customer_id` (`customer_id`),
    INDEX `idx_sale_id` (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Canjes de recompensas';

-- Insertar grupos de clientes por defecto
INSERT INTO `customer_groups` (name, description, discount_percent, is_default) VALUES 
    ('General', 'Clientes generales', 0.00, 1),
    ('Premium', 'Clientes premium con descuento', 10.00, 0),
    ('VIP', 'Clientes VIP con mayor descuento', 15.00, 0),
    ('Mayorista', 'Compras al por mayor', 20.00, 0)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insertar permisos para Customers
INSERT INTO `permissions` (`code`, `description`) VALUES 
    ('customers.view', 'View customers'),
    ('customers.create', 'Create customers'),
    ('customers.update', 'Update customers'),
    ('customers.delete', 'Delete customers'),
    ('customers.groups.manage', 'Manage customer groups'),
    ('customers.points.manage', 'Manage customer points'),
    ('customers.rewards.manage', 'Manage rewards')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Asignar permisos a admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions` WHERE `code` LIKE 'customers.%'
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM `permissions` WHERE `code` IN ('customers.view', 'customers.create', 'customers.update', 'customers.groups.manage', 'customers.points.manage', 'customers.rewards.manage')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a cashier
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, id FROM `permissions` WHERE `code` IN ('customers.view', 'customers.create')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;
