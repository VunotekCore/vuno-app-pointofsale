-- =============================================
-- Agregar drawer_id a sales para vincular ventas con cajas
-- =============================================

ALTER TABLE sales 
    ADD COLUMN drawer_id BINARY(16) NULL;

ALTER TABLE sales
    ADD CONSTRAINT fk_sales_drawer FOREIGN KEY (drawer_id) REFERENCES cash_drawers(id) ON DELETE SET NULL;

CREATE INDEX idx_sales_drawer ON sales(drawer_id);
