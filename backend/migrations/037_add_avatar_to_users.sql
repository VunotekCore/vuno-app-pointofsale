-- Migration: 037_add_avatar_to_users.sql
-- Description: Agregar campo avatar a la tabla users
-- Date: 2026-03-23

ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL AFTER email;