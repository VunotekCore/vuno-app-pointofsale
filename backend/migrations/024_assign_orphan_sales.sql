-- =============================================
-- Asignar ventas huérfanas (sin drawer_id) al cajón abierto actual
-- Solo ventas completadas y de la misma ubicación
-- =============================================

UPDATE sales s
JOIN cash_drawers cd ON s.location_id = cd.location_id AND cd.status = 'open'
SET s.drawer_id = cd.id
WHERE s.drawer_id IS NULL 
  AND s.status = 'completed'
  AND s.location_id = cd.location_id;
