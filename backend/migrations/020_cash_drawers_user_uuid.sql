-- =============================================
-- Migración: Cambiar created_by y updated_by a BINARY(16) en cash_drawers y drawer_transactions
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Tabla: cash_drawers
-- =============================================
UPDATE cash_drawers SET opened_by = NULL;
UPDATE cash_drawers SET closed_by = NULL;

ALTER TABLE cash_drawers 
    MODIFY COLUMN opened_by BINARY(16) NULL,
    MODIFY COLUMN closed_by BINARY(16) NULL;

-- =============================================
-- Tabla: drawer_transactions
-- =============================================
-- Cambiar a BINARY(16) primero
ALTER TABLE drawer_transactions 
    MODIFY COLUMN created_by BINARY(16) NOT NULL;

-- Eliminar índice orphan si existe
ALTER TABLE drawer_transactions DROP INDEX drawer_transactions_ibfk_3;

-- Recrear FK
ALTER TABLE drawer_transactions 
    ADD CONSTRAINT fk_drawer_transactions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

SET FOREIGN_KEY_CHECKS = 1;
