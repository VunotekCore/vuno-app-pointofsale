-- =============================================
-- MÓDULO CORE - Configuración de Empresa
-- Ejecutar PRIMERO
-- =============================================

CREATE TABLE IF NOT EXISTS `locations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT 'Nombre Sucursal / Almacén',
    `code` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código corto (CEN, ALM01)',
    `address` TEXT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(255) NULL,
    `manager_user_id` BIGINT UNSIGNED NULL,
    `is_warehouse` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `timezone` VARCHAR(50) DEFAULT 'America/New_York',
    `default_tax_rate` DECIMAL(5,2) DEFAULT 0.00,
    `custom_fields` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_locations_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ubicaciones - Módulo Core';

CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `parent_id` BIGINT UNSIGNED NULL,
    `description` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorías - Módulo Core';
