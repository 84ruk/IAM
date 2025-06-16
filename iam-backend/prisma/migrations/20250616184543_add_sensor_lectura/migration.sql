/*
  Warnings:

  - The `estado` column on the `PedidoInventario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[codigoBarras]` on the table `Producto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rfid]` on the table `Producto` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `Producto` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `tipo` on the `MovimientoInventario` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `actualizadoEn` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidad` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('PIEZA', 'KG', 'LITRO', 'CAJA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'ENVIADO', 'RECIBIDO');

-- CreateEnum
CREATE TYPE "SensorTipo" AS ENUM ('PESO', 'TEMPERATURA', 'HUMEDAD', 'RFID');

-- AlterTable
ALTER TABLE "MovimientoInventario" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoMovimiento" NOT NULL;

-- AlterTable
ALTER TABLE "PedidoInventario" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "codigoBarras" TEXT,
ADD COLUMN     "humedadOptima" DOUBLE PRECISION,
ADD COLUMN     "rfid" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "temperaturaOptima" DOUBLE PRECISION,
ADD COLUMN     "ubicacion" TEXT,
ADD COLUMN     "unidad" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SensorLectura" (
    "id" SERIAL NOT NULL,
    "tipo" "SensorTipo" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "productoId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorLectura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigoBarras_key" ON "Producto"("codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_rfid_key" ON "Producto"("rfid");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
