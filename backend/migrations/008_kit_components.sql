-- =============================================
-- MÓDULO INVENTORY - Componentes de Kit
-- =============================================

CREATE TABLE IF NOT EXISTS `kit_components` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `kit_item_id` BIGINT UNSIGNED NOT NULL,
    `component_item_id` BIGINT UNSIGNED NOT NULL,
    `quantity` DECIMAL(15,4) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`kit_item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`component_item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_kit_component` (`kit_item_id`, `component_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Componentes de kits/paquetes';
