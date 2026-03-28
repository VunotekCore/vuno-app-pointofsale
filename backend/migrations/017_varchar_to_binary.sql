-- =============================================
-- Migración: Convertir VARCHAR(36) a BINARY(16)
-- YA EJECUTADA - Solo para referencia
-- =============================================

USE vuno_pointofsale;

-- Tablas convertidas:
-- - sales: id, sale_number (PK)
-- - sale_items: id, sale_id (FK)
-- - sale_payments: id, sale_id (FK)
-- - sale_suspensions: id, sale_id (FK)
-- - returns: id, sale_id (FK)
-- - return_items: id, return_id, sale_item_id
-- - drawer_transactions: id, drawer_id, reference_id
-- - user_locations: id
-- - customer_reward_redemptions: sale_id
