/*
  Warnings:

  - A unique constraint covering the columns `[empresaId,nombre]` on the table `Proveedor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[empresaId,email]` on the table `Proveedor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_empresaId_nombre_key" ON "Proveedor"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_empresaId_email_key" ON "Proveedor"("empresaId", "email");
