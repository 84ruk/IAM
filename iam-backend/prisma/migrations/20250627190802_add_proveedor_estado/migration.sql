-- CreateEnum
CREATE TYPE "EstadoProveedor" AS ENUM ('ACTIVO', 'INACTIVO', 'ELIMINADO');

-- AlterTable
ALTER TABLE "Proveedor" ADD COLUMN     "estado" "EstadoProveedor" NOT NULL DEFAULT 'ACTIVO';
