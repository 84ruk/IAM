/*
  Warnings:

  - You are about to drop the column `etiqueta` on the `Producto` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Producto_empresaId_etiqueta_idx";

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "etiqueta",
ADD COLUMN     "etiquetas" TEXT[];

-- CreateIndex
CREATE INDEX "Producto_empresaId_etiquetas_idx" ON "Producto"("empresaId", "etiquetas");
