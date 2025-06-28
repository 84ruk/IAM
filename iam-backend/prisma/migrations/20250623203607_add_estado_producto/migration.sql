-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('ACTIVO', 'INACTIVO');

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "estado" "EstadoProducto" NOT NULL DEFAULT 'ACTIVO';
