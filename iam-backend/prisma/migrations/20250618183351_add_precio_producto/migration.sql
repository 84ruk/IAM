/*
  Warnings:

  - You are about to drop the column `precio` on the `Producto` table. All the data in the column will be lost.
  - Added the required column `empresaId` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioCompra` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioVenta` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "empresaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "precio",
ADD COLUMN     "precioCompra" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "precioVenta" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 10;

-- DropEnum
DROP TYPE "UnidadMedida";

-- CreateIndex
CREATE INDEX "PedidoInventario_empresaId_estado_idx" ON "PedidoInventario"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Producto_empresaId_categoria_idx" ON "Producto"("empresaId", "categoria");

-- CreateIndex
CREATE INDEX "SensorLectura_productoId_tipo_idx" ON "SensorLectura"("productoId", "tipo");

-- CreateIndex
CREATE INDEX "SensorLectura_productoId_fecha_idx" ON "SensorLectura"("productoId", "fecha");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
