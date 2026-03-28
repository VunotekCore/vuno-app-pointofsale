-- Migration: 033_add_is_part_of_kit_to_items
-- Description: Agregar campo is_part_of_kit para identificar productos que son componentes de kits
-- Date: 2026-03-20

ALTER TABLE items 
ADD COLUMN is_part_of_kit TINYINT(1) NOT NULL DEFAULT 0 AFTER is_kit;

-- Crear índice para búsqueda rápida de kits por componente
CREATE INDEX idx_kit_components_component ON kit_components(component_item_id);

-- Actualizar el campo is_part_of_kit basado en componentes existentes
UPDATE items i 
SET i.is_part_of_kit = 1 
WHERE EXISTS (
    SELECT 1 FROM kit_components kc 
    WHERE kc.component_item_id = i.id
);

-- Trigger: Al insertar en kit_components, marcar componente como parte de kit
DELIMITER //

DROP TRIGGER IF EXISTS trg_kit_components_after_insert//

CREATE TRIGGER trg_kit_components_after_insert
AFTER INSERT ON kit_components
FOR EACH ROW
BEGIN
    UPDATE items 
    SET is_part_of_kit = 1 
    WHERE id = NEW.component_item_id;
END//

-- Trigger: Al eliminar de kit_components, verificar si sigue siendo componente de algún kit
DROP TRIGGER IF EXISTS trg_kit_components_after_delete//

CREATE TRIGGER trg_kit_components_after_delete
AFTER DELETE ON kit_components
FOR EACH ROW
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM kit_components 
        WHERE component_item_id = OLD.component_item_id
    ) THEN
        UPDATE items 
        SET is_part_of_kit = 0 
        WHERE id = OLD.component_item_id;
    END IF;
END//

DELIMITER ;
