-- =============================================
-- MÓDULO PAYMENTS - Gestión de pagos y cajas
-- Ejecutar DESPUÉS de Sales
-- =============================================

-- Tabla 1: payment_methods (Métodos de pago)
CREATE TABLE IF NOT EXISTS `payment_methods` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL COMMENT 'Nombre del método',
    `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único',
    `type` ENUM('cash', 'card', 'transfer', 'other') NOT NULL DEFAULT 'cash' COMMENT 'Tipo de método',
    `is_active` TINYINT(1) DEFAULT 1,
    `is_default` TINYINT(1) DEFAULT 0,
    `requires_reference` TINYINT(1) DEFAULT 0 COMMENT 'Requiere número de referencia',
    `allow_partial` TINYINT(1) DEFAULT 1 COMMENT 'Permite pagos parciales',
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Métodos de pago disponibles';

-- Tabla 2: cash_drawers (Cajas registradoras)
CREATE TABLE IF NOT EXISTS `cash_drawers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL COMMENT 'Nombre de la caja',
    `location_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ubicación',
    `initial_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Monto inicial',
    `current_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Monto actual',
    `status` ENUM('open', 'closed', 'suspended') DEFAULT 'closed',
    `opened_at` TIMESTAMP NULL,
    `closed_at` TIMESTAMP NULL,
    `opened_by` INT NULL,
    `closed_by` INT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`opened_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_location_id` (`location_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cajas registradoras';

-- Tabla 3: drawer_transactions (Transacciones de caja)
CREATE TABLE IF NOT EXISTS `drawer_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `drawer_id` INT UNSIGNED NOT NULL COMMENT 'Caja',
    `transaction_type` ENUM('sale_payment', 'expense', 'income', 'withdrawal', 'adjustment', 'opening', 'closing') NOT NULL,
    `amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `payment_method_id` INT UNSIGNED NULL COMMENT 'Método de pago (para ventas)',
    `reference_id` BIGINT UNSIGNED NULL COMMENT 'ID de referencia (sale_id)',
    `reference_number` VARCHAR(100) NULL COMMENT 'Número de referencia',
    `notes` TEXT NULL,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`drawer_id`) REFERENCES `cash_drawers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_drawer_id` (`drawer_id`),
    INDEX `idx_transaction_type` (`transaction_type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transacciones de caja';

-- Insertar métodos de pago por defecto
INSERT INTO `payment_methods` (`name`, `code`, `type`, `is_default`, `sort_order`) VALUES
    ('Efectivo', 'cash', 'cash', 1, 1),
    ('Tarjeta de Débito', 'debit', 'card', 0, 2),
    ('Tarjeta de Crédito', 'credit', 'card', 0, 3),
    ('Transferencia Bancaria', 'transfer', 'transfer', 0, 4),
    ('Cheque', 'check', 'other', 0, 5),
    ('Gift Card', 'gift_card', 'other', 0, 6),
    ('Crédito Cliente', 'store_credit', 'other', 0, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Insertar permisos para Payments
INSERT INTO `permissions` (`code`, `description`) VALUES 
    ('payments.view', 'View payment methods and drawer'),
    ('payments.manage', 'Manage payment methods'),
    ('drawer.open', 'Open cash drawer'),
    ('drawer.close', 'Close cash drawer'),
    ('drawer.transactions', 'View drawer transactions')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Asignar permisos a admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions` WHERE `code` LIKE 'payments.%' OR `code` LIKE 'drawer.%'
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM `permissions` WHERE `code` IN ('payments.view', 'drawer.open', 'drawer.close', 'drawer.transactions')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a cashier
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, id FROM `permissions` WHERE `code` IN ('payments.view', 'drawer.open')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;
