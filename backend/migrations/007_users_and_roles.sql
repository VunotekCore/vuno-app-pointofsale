-- Migration: 007_create_users_and_roles
-- Creates users, roles, permissions tables for authentication

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
  ('admin', 'Administrator with full access'),
  ('manager', 'Manager with limited access'),
  ('cashier', 'Cashier with sales access');

-- Insert default permissions
INSERT INTO permissions (code, description) VALUES 
  ('dashboard.view', 'View dashboard'),
  ('sales.create', 'Create sales'),
  ('sales.view', 'View sales'),
  ('inventory.manage', 'Manage inventory'),
  ('inventory.view', 'View inventory'),
  ('reports.view', 'View reports'),
  ('users.manage', 'Manage users'),
  ('settings.manage', 'Manage settings');

-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role_id) VALUES 
  ('admin', 'admin@example.com', '$2a$10$YourHashedPasswordHere', 1);

-- ROLLBACK: DROP TABLE IF EXISTS users, role_permissions, permissions, roles;
