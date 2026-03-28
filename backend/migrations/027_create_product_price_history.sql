-- Tabla para historial de cambios de precios de productos
CREATE TABLE IF NOT EXISTS product_price_history (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  item_id BINARY(16) NOT NULL,
  
  -- Precios anteriores
  cost_price_before DECIMAL(15,4) DEFAULT 0,
  unit_price_before DECIMAL(15,4) DEFAULT 0,
  margin_before DECIMAL(15,4) DEFAULT 0,
  
  -- Precios nuevos
  cost_price_after DECIMAL(15,4) DEFAULT 0,
  unit_price_after DECIMAL(15,4) DEFAULT 0,
  margin_after DECIMAL(15,4) DEFAULT 0,
  
  -- Metadatos del cambio
  change_reason VARCHAR(255) DEFAULT NULL,
  created_by BINARY(16) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_item_id (item_id),
  INDEX idx_created_at (created_at),
  INDEX idx_created_by (created_by),
  
  CONSTRAINT fk_price_history_item
    FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
