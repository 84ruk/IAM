-- Script para agregar eliminación en cascada a las relaciones de Producto
-- Este script soluciona el error de clave foránea al eliminar productos

-- 1. Eliminar las restricciones existentes
ALTER TABLE "MovimientoInventario" 
DROP CONSTRAINT IF EXISTS "MovimientoInventario_productId_fkey";

ALTER TABLE "PedidoInventario" 
DROP CONSTRAINT IF EXISTS "PedidoInventario_productId_fkey";

-- 2. Agregar las nuevas restricciones con CASCADE DELETE
ALTER TABLE "MovimientoInventario" 
ADD CONSTRAINT "MovimientoInventario_productId_fkey" 
FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE;

ALTER TABLE "PedidoInventario" 
ADD CONSTRAINT "PedidoInventario_productId_fkey" 
FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE;

-- 3. Verificar que las restricciones se aplicaron correctamente
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('MovimientoInventario', 'PedidoInventario')
  AND ccu.table_name = 'Producto';

-- 4. Mensaje de confirmación
SELECT 'Foreign key constraints updated successfully!' as status; 