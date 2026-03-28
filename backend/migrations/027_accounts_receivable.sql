-- Migration: 027_accounts_receivable
-- Tabla para gestionar cuentas por cobrar a empleados por faltantes de caja

CREATE TABLE IF NOT EXISTS accounts_receivable (
  id BINARY(16) PRIMARY KEY,
  user_id BINARY(16) NOT NULL,
  adjustment_id BINARY(16) NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  paid_amount DECIMAL(15,4) DEFAULT 0,
  status ENUM('pending', 'partial', 'paid', 'forgiven') DEFAULT 'pending',
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (adjustment_id) REFERENCES drawer_adjustments(id) ON DELETE CASCADE
);

CREATE INDEX idx_ar_user ON accounts_receivable(user_id);
CREATE INDEX idx_ar_status ON accounts_receivable(status);
CREATE INDEX idx_ar_adjustment ON accounts_receivable(adjustment_id);