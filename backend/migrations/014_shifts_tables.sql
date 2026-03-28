-- =============================================
-- MÓDULO SHIFTS - Configuración de turnos/cajas
-- =============================================

-- Tabla 1: shift_configs (Configuración de turnos por ubicación)
CREATE TABLE IF NOT EXISTS `shift_configs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `location_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ubicación',
    `name` VARCHAR(50) NOT NULL COMMENT 'Nombre del turno (ej: Mañana, Tarde, Noche)',
    `start_time` TIME NOT NULL COMMENT 'Hora de inicio del turno',
    `end_time` TIME NOT NULL COMMENT 'Hora de fin del turno',
    `default_initial_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Monto inicial por defecto',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Si el turno está activo',
    `sort_order` INT DEFAULT 0 COMMENT 'Orden de visualización',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_location_name` (`location_id`, `name`),
    INDEX `idx_location_id` (`location_id`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración de turnos por ubicación';

-- Tabla 2: shift_sessions (Sesiones de turno - apertura/cierre de caja)
CREATE TABLE IF NOT EXISTS `shift_sessions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `shift_config_id` INT UNSIGNED NOT NULL COMMENT 'Configuración del turno',
    `location_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ubicación',
    `user_id` INT NOT NULL COMMENT 'Usuario que abrió el turno',
    `date` DATE NOT NULL COMMENT 'Fecha del turno',
    `day_of_week` TINYINT NOT NULL COMMENT 'Día de la semana (0=Domingo, 6=Sábado)',
    `scheduled_start` TIME NOT NULL COMMENT 'Hora programada de inicio',
    `scheduled_end` TIME NOT NULL COMMENT 'Hora programada de fin',
    `actual_start` DATETIME NULL COMMENT 'Hora real de inicio',
    `actual_end` DATETIME NULL COMMENT 'Hora real de fin',
    `initial_amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Monto inicial registrado',
    `expected_end` DATETIME NULL COMMENT 'Hora esperada de cierre',
    `status` ENUM('pending', 'open', 'closing', 'closed', 'cancelled') DEFAULT 'pending' COMMENT 'Estado del turno',
    `closing_amount` DECIMAL(15,4) NULL COMMENT 'Monto de cierre',
    `difference` DECIMAL(15,4) NULL COMMENT 'Diferencia (sobrante/faltante)',
    `notes` TEXT NULL COMMENT 'Notas del turno',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`shift_config_id`) REFERENCES `shift_configs`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_location_date` (`location_id`, `date`),
    INDEX `idx_status` (`status`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sesiones de turno';

-- Agregar campo shift_session_id a cash_drawers para vincular con el turno
ALTER TABLE `cash_drawers` ADD COLUMN `shift_session_id` INT UNSIGNED NULL AFTER `notes`;
ALTER TABLE `cash_drawers` ADD FOREIGN KEY (`shift_session_id`) REFERENCES `shift_sessions`(`id`) ON DELETE SET NULL;

-- Insertar permisos para Shift Management
INSERT INTO `permissions` (`code`, `description`) VALUES 
    ('shifts.view', 'View shift configuration'),
    ('shifts.manage', 'Manage shift configuration'),
    ('shifts.open', 'Open shift/session'),
    ('shifts.close', 'Close shift/session')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Asignar permisos a admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions` WHERE `code` LIKE 'shifts.%'
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM `permissions` WHERE `code` IN ('shifts.view', 'shifts.open', 'shifts.close')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Asignar permisos a cashier
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, id FROM `permissions` WHERE `code` IN ('shifts.view', 'shifts.open')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;
