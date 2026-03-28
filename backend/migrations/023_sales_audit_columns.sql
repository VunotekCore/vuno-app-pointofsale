-- =============================================
-- Eliminar employee_id de sales (usaremos created_by)
-- =============================================

ALTER TABLE sales DROP FOREIGN KEY fk_sales_employee;
ALTER TABLE sales DROP INDEX fk_sales_employee;
ALTER TABLE sales DROP COLUMN employee_id;
