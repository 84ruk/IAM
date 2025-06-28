/*
  Warnings:

  - You are about to drop the column `categoria` on the `Producto` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Producto_empresaId_categoria_idx";

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "categoria",
ADD COLUMN     "etiqueta" TEXT;

-- CreateIndex
CREATE INDEX "Producto_empresaId_etiqueta_idx" ON "Producto"("empresaId", "etiqueta");
