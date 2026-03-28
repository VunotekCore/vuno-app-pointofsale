-- =============================================
-- Migración: Sales Tables - Recrear con UUID
-- NOTA: Se perderán los datos existentes
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS return_items;
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS sale_suspensions;
DROP TABLE IF EXISTS sale_payments;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;

-- =============================================
-- TABLA: sales
-- =============================================
CREATE TABLE sales (
    id VARCHAR(36) PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de venta (ej. SALE-2026-001)',
    customer_id INT NULL COMMENT 'Cliente',
    employee_id INT NOT NULL COMMENT 'Cajero',
    location_id BIGINT UNSIGNED NOT NULL COMMENT 'Sucursal',
    subtotal DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Subtotal',
    discount_amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Descuento',
    tax_amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Impuestos',
    total DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total',
    notes TEXT NULL COMMENT 'Notas',
    status ENUM('pending', 'completed', 'suspended', 'cancelled', 'layaway') DEFAULT 'pending' COMMENT 'Estado',
    sale_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    INDEX idx_sale_number (sale_number),
    INDEX idx_status (status),
    INDEX idx_sale_date (sale_date),
    INDEX idx_customer_id (customer_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_location_id (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ventas';

-- =============================================
-- TABLA: sale_items
-- =============================================
CREATE TABLE sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL COMMENT 'Venta',
    item_id BIGINT UNSIGNED NOT NULL COMMENT 'Ítem',
    variation_id BIGINT UNSIGNED NULL COMMENT 'Variación',
    serial_number VARCHAR(255) NULL COMMENT 'Serial',
    quantity DECIMAL(15,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad',
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Precio',
    discount_amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Descuento',
    tax_amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Impuesto',
    cost_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Costo',
    line_total DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total línea',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    FOREIGN KEY (variation_id) REFERENCES item_variations(id) ON DELETE SET NULL,
    INDEX idx_sale_id (sale_id),
    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Items de venta';

-- =============================================
-- TABLA: sale_payments
-- =============================================
CREATE TABLE sale_payments (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL COMMENT 'Venta',
    payment_type ENUM('cash', 'credit', 'debit', 'check', 'gift_card', 'store_credit', 'custom') NOT NULL COMMENT 'Tipo',
    amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Monto',
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha',
    transaction_id VARCHAR(255) NULL COMMENT 'ID transacción',
    reference_number VARCHAR(100) NULL COMMENT 'Referencia',
    notes TEXT NULL COMMENT 'Notas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    INDEX idx_sale_id (sale_id),
    INDEX idx_payment_type (payment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pagos';

-- =============================================
-- TABLA: sale_suspensions
-- =============================================
CREATE TABLE sale_suspensions (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'Venta',
    suspension_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha',
    payments_made DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Pagos realizados',
    balance_due DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Saldo',
    due_date DATE NULL COMMENT 'Vencimiento',
    notes TEXT NULL COMMENT 'Notas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    INDEX idx_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ventas suspendidas';

-- =============================================
-- TABLA: returns
-- =============================================
CREATE TABLE returns (
    id VARCHAR(36) PRIMARY KEY,
    return_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número',
    sale_id VARCHAR(36) NOT NULL COMMENT 'Venta original',
    employee_id INT NOT NULL COMMENT 'Empleado',
    location_id BIGINT UNSIGNED NOT NULL COMMENT 'Sucursal',
    subtotal DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    tax_amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    total DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total',
    refund_method ENUM('cash', 'credit', 'original_payment') DEFAULT 'cash' COMMENT 'Método',
    notes TEXT NULL COMMENT 'Notas',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' COMMENT 'Estado',
    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    INDEX idx_return_number (return_number),
    INDEX idx_sale_id (sale_id),
    INDEX idx_return_date (return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Devoluciones';

-- =============================================
-- TABLA: return_items
-- =============================================
CREATE TABLE return_items (
    id VARCHAR(36) PRIMARY KEY,
    return_id VARCHAR(36) NOT NULL COMMENT 'Devolución',
    sale_item_id VARCHAR(36) NULL COMMENT 'Item original',
    item_id BIGINT UNSIGNED NOT NULL COMMENT 'Ítem',
    variation_id BIGINT UNSIGNED NULL COMMENT 'Variación',
    serial_number VARCHAR(255) NULL COMMENT 'Serial',
    quantity DECIMAL(15,4) NOT NULL DEFAULT 1.0000 COMMENT 'Cantidad',
    unit_price DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Precio',
    tax_amount DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
    line_total DECIMAL(15,4) NOT NULL DEFAULT 0.0000 COMMENT 'Total',
    reason VARCHAR(255) NULL COMMENT 'Razón',
    item_condition ENUM('new', 'opened', 'damaged') DEFAULT 'new' COMMENT 'Condición',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    FOREIGN KEY (variation_id) REFERENCES item_variations(id) ON DELETE SET NULL,
    INDEX idx_return_id (return_id),
    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Items devueltos';

SET FOREIGN_KEY_CHECKS = 1;
