/*
  Warnings:

  - The `unidad` column on the `Producto` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TipoIndustria" AS ENUM ('GENERICA', 'ROPA', 'ALIMENTOS', 'ELECTRONICA', 'FARMACIA');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('UNIDAD', 'KILO', 'LITRO', 'CAJA', 'PAQUETE');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "TipoIndustria" "TipoIndustria" NOT NULL DEFAULT 'GENERICA';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "color" TEXT,
ADD COLUMN     "talla" TEXT,
ADD COLUMN     "tipoProducto" "TipoProducto" NOT NULL DEFAULT 'GENERICO',
DROP COLUMN "unidad",
ADD COLUMN     "unidad" "UnidadMedida" NOT NULL DEFAULT 'UNIDAD';
