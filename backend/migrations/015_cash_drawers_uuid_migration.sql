-- =============================================
-- Migración: cash_drawers y drawer_transactions a UUID
-- PRESERVA los datos existentes generando UUIDs válidos
-- =============================================

-- Crear tabla temporal para cash_drawers
CREATE TEMPORARY TABLE temp_cash_drawers AS 
SELECT * FROM cash_drawers;

-- Crear tabla temporal para drawer_transactions  
CREATE TEMPORARY TABLE temp_drawer_transactions AS 
SELECT * FROM drawer_transactions;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS drawer_transactions;
DROP TABLE IF EXISTS cash_drawers;

-- =============================================
-- TABLA: cash_drawers (Cajas registradoras)
-- =============================================
CREATE TABLE IF NOT EXISTS `cash_drawers` (
    `id` VARCHAR(36) PRIMARY KEY,
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
    `shift_session_id` INT UNSIGNED NULL COMMENT 'Turno',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`opened_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`shift_session_id`) REFERENCES `shift_sessions`(`id`) ON DELETE SET NULL,
    INDEX `idx_location_id` (`location_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cajas registradoras';

-- =============================================
-- TABLA: drawer_transactions (Transacciones de caja)
-- =============================================
CREATE TABLE IF NOT EXISTS `drawer_transactions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `drawer_id` VARCHAR(36) NOT NULL COMMENT 'Caja',
    `transaction_type` ENUM('sale_payment', 'expense', 'income', 'withdrawal', 'adjustment', 'opening', 'closing') NOT NULL,
    `amount` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    `payment_method_id` INT UNSIGNED NULL COMMENT 'Método de pago (para ventas)',
    `reference_id` VARCHAR(36) NULL COMMENT 'ID de referencia (sale_id)',
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

-- Insertar datos de cash_drawers con UUID
INSERT INTO cash_drawers (
    id, name, location_id, initial_amount, current_amount, status,
    opened_at, closed_at, opened_by, closed_by, notes, shift_session_id,
    created_at, updated_at
)
SELECT 
    UUID(),
    name, location_id, initial_amount, current_amount, status,
    opened_at, closed_at, opened_by, closed_by, notes, 
    NULL,
    created_at, updated_at
FROM temp_cash_drawers;

-- Crear mapeo de IDs antiguos a nuevos para drawer_transactions
CREATE TEMPORARY TABLE drawer_id_mapping (
    old_id INT UNSIGNED,
    new_id VARCHAR(36)
);

INSERT INTO drawer_id_mapping (old_id, new_id)
SELECT id, UUID() FROM temp_cash_drawers;

-- Insertar datos de drawer_transactions con UUID
INSERT INTO drawer_transactions (
    id, drawer_id, transaction_type, amount, payment_method_id,
    reference_id, reference_number, notes, created_by, created_at
)
SELECT 
    UUID(),
    dim.new_id,
    dt.transaction_type,
    dt.amount,
    dt.payment_method_id,
    dt.reference_id,
    dt.reference_number,
    dt.notes,
    dt.created_by,
    dt.created_at
FROM temp_drawer_transactions dt
JOIN drawer_id_mapping dim ON dt.drawer_id = dim.old_id;

SET FOREIGN_KEY_CHECKS = 1;

DROP TEMPORARY TABLE temp_cash_drawers;
DROP TEMPORARY TABLE temp_drawer_transactions;
DROP TEMPORARY TABLE drawer_id_mapping;
