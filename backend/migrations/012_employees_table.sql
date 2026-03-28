-- =============================================
-- MÓDULO EMPLOYEES - Datos de empleados
-- Ejecutar DESPUÉS de Users
-- =============================================

CREATE TABLE IF NOT EXISTS `employees` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL COMMENT 'Usuario relacionado (para login)',
    `employee_number` VARCHAR(20) UNIQUE NULL COMMENT 'Número de empleado',
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) DEFAULT 'Mexico',
    `postal_code` VARCHAR(20) NULL,
    `photo_url` VARCHAR(512) NULL,
    `hire_date` DATE NULL,
    `position` VARCHAR(100) NULL COMMENT 'Puesto',
    `department` VARCHAR(100) NULL,
    `salary` DECIMAL(15,2) NULL,
    `emergency_contact_name` VARCHAR(100) NULL,
    `emergency_contact_phone` VARCHAR(30) NULL,
    `notes` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_employee_number` (`employee_number`),
    INDEX `idx_first_name` (`first_name`),
    INDEX `idx_last_name` (`last_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos de empleados';

-- Insertar permisos
INSERT INTO `permissions` (`code`, `description`) VALUES 
    ('employees.view', 'View employees'),
    ('employees.create', 'Create employees'),
    ('employees.update', 'Update employees'),
    ('employees.delete', 'Delete employees')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Asignar permisos a admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions` WHERE `code` LIKE 'employees.%'
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM `permissions` WHERE `code` IN ('employees.view', 'employees.create', 'employees.update')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;
