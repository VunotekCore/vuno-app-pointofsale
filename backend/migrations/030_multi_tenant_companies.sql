-- Migration: 030_multi_tenant_companies
-- Creates companies and platform_users tables for multi-tenancy

-- 1. Companies table (tenants)
CREATE TABLE IF NOT EXISTS companies (
  id BINARY(16) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url VARCHAR(512),
  settings JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_slug (slug),
  INDEX idx_companies_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Platform users (super admins)
CREATE TABLE IF NOT EXISTS platform_users (
  id BINARY(16) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_super_admin TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_platform_email (email),
  INDEX idx_platform_super (is_super_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add company_id to existing tables
ALTER TABLE users ADD COLUMN company_id BINARY(16) AFTER role_id;
ALTER TABLE users ADD INDEX idx_users_company (company_id);
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE locations ADD COLUMN company_id BINARY(16) AFTER default_tax_rate;
ALTER TABLE locations ADD INDEX idx_locations_company (company_id);
ALTER TABLE locations ADD CONSTRAINT fk_locations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE categories ADD COLUMN company_id BINARY(16);
ALTER TABLE categories ADD INDEX idx_categories_company (company_id);
ALTER TABLE categories ADD CONSTRAINT fk_categories_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE items ADD COLUMN company_id BINARY(16);
ALTER TABLE items ADD INDEX idx_items_company (company_id);
ALTER TABLE items ADD CONSTRAINT fk_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE customers ADD COLUMN company_id BINARY(16);
ALTER TABLE customers ADD INDEX idx_customers_company (company_id);
ALTER TABLE customers ADD CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE suppliers ADD COLUMN company_id BINARY(16);
ALTER TABLE suppliers ADD INDEX idx_suppliers_company (company_id);
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE sales ADD COLUMN company_id BINARY(16);
ALTER TABLE sales ADD INDEX idx_sales_company (company_id);
ALTER TABLE sales ADD CONSTRAINT fk_sales_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE sale_items ADD COLUMN company_id BINARY(16);
ALTER TABLE sale_items ADD INDEX idx_sale_items_company (company_id);
ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE sale_payments ADD COLUMN company_id BINARY(16);
ALTER TABLE sale_payments ADD INDEX idx_sale_payments_company (company_id);
ALTER TABLE sale_payments ADD CONSTRAINT fk_sale_payments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE returns ADD COLUMN company_id BINARY(16);
ALTER TABLE returns ADD INDEX idx_returns_company (company_id);
ALTER TABLE returns ADD CONSTRAINT fk_returns_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE return_items ADD COLUMN company_id BINARY(16);
ALTER TABLE return_items ADD INDEX idx_return_items_company (company_id);
ALTER TABLE return_items ADD CONSTRAINT fk_return_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE purchase_orders ADD COLUMN company_id BINARY(16);
ALTER TABLE purchase_orders ADD INDEX idx_purchase_orders_company (company_id);
ALTER TABLE purchase_orders ADD CONSTRAINT fk_purchase_orders_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE purchase_order_items ADD COLUMN company_id BINARY(16);
ALTER TABLE purchase_order_items ADD INDEX idx_purchase_order_items_company (company_id);
ALTER TABLE purchase_order_items ADD CONSTRAINT fk_purchase_order_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE receivings ADD COLUMN company_id BINARY(16);
ALTER TABLE receivings ADD INDEX idx_receivings_company (company_id);
ALTER TABLE receivings ADD CONSTRAINT fk_receivings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE receiving_items ADD COLUMN company_id BINARY(16);
ALTER TABLE receiving_items ADD INDEX idx_receiving_items_company (company_id);
ALTER TABLE receiving_items ADD CONSTRAINT fk_receiving_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE inventory_adjustments ADD COLUMN company_id BINARY(16);
ALTER TABLE inventory_adjustments ADD INDEX idx_inventory_adjustments_company (company_id);
ALTER TABLE inventory_adjustments ADD CONSTRAINT fk_inventory_adjustments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE inventory_adjustment_items ADD COLUMN company_id BINARY(16);
ALTER TABLE inventory_adjustment_items ADD INDEX idx_inventory_adjustment_items_company (company_id);
ALTER TABLE inventory_adjustment_items ADD CONSTRAINT fk_inventory_adjustment_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE inventory_transfers ADD COLUMN company_id BINARY(16);
ALTER TABLE inventory_transfers ADD INDEX idx_inventory_transfers_company (company_id);
ALTER TABLE inventory_transfers ADD CONSTRAINT fk_inventory_transfers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE inventory_transfer_items ADD COLUMN company_id BINARY(16);
ALTER TABLE inventory_transfer_items ADD INDEX idx_inventory_transfer_items_company (company_id);
ALTER TABLE inventory_transfer_items ADD CONSTRAINT fk_inventory_transfer_items_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE inventory_movements ADD COLUMN company_id BINARY(16);
ALTER TABLE inventory_movements ADD INDEX idx_inventory_movements_company (company_id);
ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE cash_drawers ADD COLUMN company_id BINARY(16);
ALTER TABLE cash_drawers ADD INDEX idx_cash_drawers_company (company_id);
ALTER TABLE cash_drawers ADD CONSTRAINT fk_cash_drawers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE drawer_transactions ADD COLUMN company_id BINARY(16);
ALTER TABLE drawer_transactions ADD INDEX idx_drawer_transactions_company (company_id);
ALTER TABLE drawer_transactions ADD CONSTRAINT fk_drawer_transactions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE drawer_adjustments ADD COLUMN company_id BINARY(16);
ALTER TABLE drawer_adjustments ADD INDEX idx_drawer_adjustments_company (company_id);
ALTER TABLE drawer_adjustments ADD CONSTRAINT fk_drawer_adjustments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE accounts_receivable ADD COLUMN company_id BINARY(16);
ALTER TABLE accounts_receivable ADD INDEX idx_accounts_receivable_company (company_id);
ALTER TABLE accounts_receivable ADD CONSTRAINT fk_accounts_receivable_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE roles ADD COLUMN company_id BINARY(16);
ALTER TABLE roles ADD INDEX idx_roles_company (company_id);
ALTER TABLE roles ADD CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE permissions ADD COLUMN company_id BINARY(16);
ALTER TABLE permissions ADD INDEX idx_permissions_company (company_id);
ALTER TABLE permissions ADD CONSTRAINT fk_permissions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE role_permissions ADD COLUMN company_id BINARY(16);
ALTER TABLE role_permissions ADD INDEX idx_role_permissions_company (company_id);
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE employees ADD COLUMN company_id BINARY(16);
ALTER TABLE employees ADD INDEX idx_employees_company (company_id);
ALTER TABLE employees ADD CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE shift_sessions ADD COLUMN company_id BINARY(16);
ALTER TABLE shift_sessions ADD INDEX idx_shift_sessions_company (company_id);
ALTER TABLE shift_sessions ADD CONSTRAINT fk_shift_sessions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE shift_configs ADD COLUMN company_id BINARY(16);
ALTER TABLE shift_configs ADD INDEX idx_shift_configs_company (company_id);
ALTER TABLE shift_configs ADD CONSTRAINT fk_shift_configs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE item_quantities ADD COLUMN company_id BINARY(16);
ALTER TABLE item_quantities ADD INDEX idx_item_quantities_company (company_id);
ALTER TABLE item_quantities ADD CONSTRAINT fk_item_quantities_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE item_variations ADD COLUMN company_id BINARY(16);
ALTER TABLE item_variations ADD INDEX idx_item_variations_company (company_id);
ALTER TABLE item_variations ADD CONSTRAINT fk_item_variations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE customer_groups ADD COLUMN company_id BINARY(16);
ALTER TABLE customer_groups ADD INDEX idx_customer_groups_company (company_id);
ALTER TABLE customer_groups ADD CONSTRAINT fk_customer_groups_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE customer_rewards ADD COLUMN company_id BINARY(16);
ALTER TABLE customer_rewards ADD INDEX idx_customer_rewards_company (company_id);
ALTER TABLE customer_rewards ADD CONSTRAINT fk_customer_rewards_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE customer_points_log ADD COLUMN company_id BINARY(16);
ALTER TABLE customer_points_log ADD INDEX idx_customer_points_log_company (company_id);
ALTER TABLE customer_points_log ADD CONSTRAINT fk_customer_points_log_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE customer_reward_redemptions ADD COLUMN company_id BINARY(16);
ALTER TABLE customer_reward_redemptions ADD INDEX idx_customer_reward_redemptions_company (company_id);
ALTER TABLE customer_reward_redemptions ADD CONSTRAINT fk_customer_reward_redemptions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE item_serials ADD COLUMN company_id BINARY(16);
ALTER TABLE item_serials ADD INDEX idx_item_serials_company (company_id);
ALTER TABLE item_serials ADD CONSTRAINT fk_item_serials_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE kit_components ADD COLUMN company_id BINARY(16);
ALTER TABLE kit_components ADD INDEX idx_kit_components_company (company_id);
ALTER TABLE kit_components ADD CONSTRAINT fk_kit_components_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE user_locations ADD COLUMN company_id BINARY(16);
ALTER TABLE user_locations ADD INDEX idx_user_locations_company (company_id);
ALTER TABLE user_locations ADD CONSTRAINT fk_user_locations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE company_config ADD COLUMN company_id BINARY(16);
ALTER TABLE company_config ADD INDEX idx_company_config_company (company_id);
ALTER TABLE company_config ADD CONSTRAINT fk_company_config_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE payment_methods ADD COLUMN company_id BINARY(16);
ALTER TABLE payment_methods ADD INDEX idx_payment_methods_company (company_id);
ALTER TABLE payment_methods ADD CONSTRAINT fk_payment_methods_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;

-- 4. Create default company for existing data
INSERT INTO companies (id, name, slug, is_active, created_at, updated_at)
VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000001'), 'Empresa Principal', 'empresa-principal', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- 5. Migrate existing data to default company
UPDATE users SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE locations SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE categories SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE customers SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE suppliers SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE sales SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE sale_items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE sale_payments SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE returns SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE return_items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE purchase_orders SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE purchase_order_items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE receivings SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE receiving_items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE inventory_adjustments SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE inventory_adjustment_items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE inventory_transfers SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE inventory_transfer_items SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE inventory_movements SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE cash_drawers SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE drawer_transactions SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE drawer_adjustments SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE accounts_receivable SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE roles SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE permissions SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE role_permissions SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE employees SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE shift_sessions SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE shift_configs SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE item_quantities SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE item_variations SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE customer_groups SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE customer_rewards SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE customer_points_log SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE customer_reward_redemptions SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE item_serials SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE kit_components SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE user_locations SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE company_config SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;
UPDATE payment_methods SET company_id = UUID_TO_BIN('00000000-0000-0000-0000-000000000001') WHERE company_id IS NULL;

-- 6. Create super admin platform user (password: superadmin123)
INSERT INTO platform_users (id, email, password_hash, name, is_super_admin, is_active)
VALUES (
  UUID_TO_BIN('00000000-0000-0000-0000-000000000002'),
  'superadmin@vuno.com',
  '$2a$10$dA.P9t3ZZu9YeceILASK1.9DgCJ0Sw.0fdc1Yj2bt14rKxochIp3.',
  'Super Admin',
  1,
  1
)
ON DUPLICATE KEY UPDATE password_hash = '$2a$10$dA.P9t3ZZu9YeceILASK1.9DgCJ0Sw.0fdc1Yj2bt14rKxochIp3.';

-- ROLLBACK:
-- ALTER TABLE users DROP FOREIGN KEY fk_users_company;
-- ALTER TABLE users DROP INDEX idx_users_company;
-- ALTER TABLE users DROP COLUMN company_id;
-- (repeat for all tables)
-- DROP TABLE IF EXISTS platform_users;
-- DROP TABLE IF EXISTS companies;
