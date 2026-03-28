-- Migration: 026_drawer_adjustments
-- Tabla para registrar faltantes y sobrantes de dinero en cajas

CREATE TABLE IF NOT EXISTS drawer_adjustments (
  id BINARY(16) PRIMARY KEY,
  drawer_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  adjustment_type ENUM('overage', 'shortage') NOT NULL,
  amount DECIMAL(15,4) NOT NULL,
  notes TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (drawer_id) REFERENCES cash_drawers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_drawer_adjustments_drawer ON drawer_adjustments(drawer_id);
CREATE INDEX idx_drawer_adjustments_user ON drawer_adjustments(user_id);
CREATE INDEX idx_drawer_adjustments_status ON drawer_adjustments(status);