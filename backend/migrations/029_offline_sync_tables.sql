-- Migration: 029_offline_sync_tables.sql
-- Tables for offline sales synchronization

-- Log de sincronizaciones
CREATE TABLE IF NOT EXISTS sync_logs (
    id CHAR(36) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    user_id BINARY(16) NOT NULL,
    location_id BINARY(16),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_sales INT DEFAULT 0,
    successful_sales INT DEFAULT 0,
    failed_sales INT DEFAULT 0,
    status ENUM('completed', 'partial', 'failed') DEFAULT 'completed',
    metadata JSON,
    INDEX idx_device_id (device_id),
    INDEX idx_user_id (user_id),
    INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mapeo de IDs offline a IDs del servidor
CREATE TABLE IF NOT EXISTS offline_id_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offline_id VARCHAR(100) NOT NULL UNIQUE,
    server_id BINARY(16) NOT NULL,
    sale_number VARCHAR(50),
    device_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_offline_id (offline_id),
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detalle de ventas sincronizadas
CREATE TABLE IF NOT EXISTS sync_sales_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_log_id CHAR(36) NOT NULL,
    offline_id VARCHAR(100) NOT NULL,
    sale_data JSON NOT NULL,
    items_data JSON NOT NULL,
    payments_data JSON,
    status ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    error_message TEXT,
    server_sale_id BINARY(16),
    server_sale_number VARCHAR(50),
    synced_at TIMESTAMP NULL,
    FOREIGN KEY (sync_log_id) REFERENCES sync_logs(id) ON DELETE CASCADE,
    INDEX idx_sync_log_id (sync_log_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conflictos de sincronización (stock insuficiente, etc)
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_log_id CHAR(36) NOT NULL,
    offline_id VARCHAR(100) NOT NULL,
    conflict_type ENUM('insufficient_stock', 'duplicate', 'invalid_data', 'permission_denied') NOT NULL,
    details JSON,
    resolution ENUM('pending', 'resolved', 'skipped') DEFAULT 'pending',
    resolved_at TIMESTAMP NULL,
    resolved_by BINARY(16),
    FOREIGN KEY (sync_log_id) REFERENCES sync_logs(id) ON DELETE CASCADE,
    INDEX idx_sync_log_id (sync_log_id),
    INDEX idx_resolution (resolution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
