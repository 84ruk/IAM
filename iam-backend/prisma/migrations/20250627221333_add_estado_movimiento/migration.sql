-- CreateEnum
CREATE TYPE "EstadoMovimiento" AS ENUM ('ACTIVO', 'ELIMINADO');

-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "estado" "EstadoMovimiento" NOT NULL DEFAULT 'ACTIVO';
