-- Tabla de relación usuario-ubicaciones
CREATE TABLE IF NOT EXISTS `user_locations` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` INT NOT NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `is_default` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_user_location` (`user_id`, `location_id`),
    INDEX `idx_user_locations_user` (`user_id`),
    INDEX `idx_user_locations_location` (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relación usuarios-ubicaciones';

-- Agregar ubicación por defecto al usuario existente
INSERT INTO `user_locations` (`id`, `user_id`, `location_id`, `is_default`)
SELECT UUID(), u.id, l.id, 1
FROM users u
CROSS JOIN locations l
WHERE l.is_default = 1
ON DUPLICATE KEY UPDATE is_default = 1;
