-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoProducto" ADD VALUE 'MEDICAMENTO';
ALTER TYPE "TipoProducto" ADD VALUE 'SUPLEMENTO';
ALTER TYPE "TipoProducto" ADD VALUE 'EQUIPO_MEDICO';
ALTER TYPE "TipoProducto" ADD VALUE 'CUIDADO_PERSONAL';
ALTER TYPE "TipoProducto" ADD VALUE 'BIOLOGICO';
ALTER TYPE "TipoProducto" ADD VALUE 'MATERIAL_QUIRURGICO';
