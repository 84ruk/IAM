-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "BlacklistedToken_jti_idx" ON "BlacklistedToken"("jti");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_fecha_idx" ON "MovimientoInventario"("empresaId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_productoId_fecha_idx" ON "MovimientoInventario"("productoId", "fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresaId_estado_idx" ON "MovimientoInventario"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "MovimientoInventario_tipo_fecha_idx" ON "MovimientoInventario"("tipo", "fecha" DESC);

-- CreateIndex
CREATE INDEX "Producto_empresaId_estado_idx" ON "Producto"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Producto_empresaId_stock_idx" ON "Producto"("empresaId", "stock" ASC);

-- CreateIndex
CREATE INDEX "Producto_empresaId_tipoProducto_idx" ON "Producto"("empresaId", "tipoProducto");

-- CreateIndex
CREATE INDEX "Producto_proveedorId_idx" ON "Producto"("proveedorId");

-- CreateIndex
CREATE INDEX "Producto_codigoBarras_idx" ON "Producto"("codigoBarras");

-- CreateIndex
CREATE INDEX "Producto_sku_idx" ON "Producto"("sku");

-- CreateIndex
CREATE INDEX "Producto_rfid_idx" ON "Producto"("rfid");

-- CreateIndex
CREATE INDEX "Producto_nombre_idx" ON "Producto"("nombre" ASC);

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_estado_idx" ON "Proveedor"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Proveedor_empresaId_nombre_idx" ON "Proveedor"("empresaId", "nombre" ASC);

-- CreateIndex
CREATE INDEX "Proveedor_email_idx" ON "Proveedor"("email");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_rol_idx" ON "Usuario"("empresaId", "rol");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_activo_idx" ON "Usuario"("empresaId", "activo");

-- CreateIndex
CREATE INDEX "Usuario_rol_activo_idx" ON "Usuario"("rol", "activo");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_googleId_idx" ON "Usuario"("googleId");

-- CreateIndex
CREATE INDEX "Usuario_setupCompletado_idx" ON "Usuario"("setupCompletado");
