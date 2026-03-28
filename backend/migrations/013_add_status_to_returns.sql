-- Agregar campo status a returns
ALTER TABLE returns ADD COLUMN status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' AFTER notes;

-- Actualizar devoluciones existentes que tienen items como procesadas
UPDATE returns r
SET r.status = 'completed'
WHERE EXISTS (
  SELECT 1 FROM return_items ri WHERE ri.return_id = r.id
);

-- Crear índice para status
ALTER TABLE returns ADD INDEX idx_status (`status`);
