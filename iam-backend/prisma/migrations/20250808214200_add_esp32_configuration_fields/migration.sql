/*
  Warnings:

  - A unique constraint covering the columns `[nombre,ubicacionId]` on the table `Sensor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_productoId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoInventario" DROP CONSTRAINT "PedidoInventario_productoId_fkey";

-- AlterTable
ALTER TABLE "AlertHistory" ADD COLUMN     "sensorId" INTEGER,
ADD COLUMN     "ubicacionId" INTEGER,
ADD COLUMN     "valor" TEXT;

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "dispositivoIoTId" INTEGER;

-- CreateTable
CREATE TABLE "DispositivoIoT" (
    "id" SERIAL NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ESP32',
    "ubicacionId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "wifiSSID" TEXT,
    "wifiPassword" TEXT,
    "apiBaseUrl" TEXT,
    "apiToken" TEXT,
    "apiEndpoint" TEXT,
    "sensoresConfigurados" JSONB,
    "intervaloLecturas" INTEGER DEFAULT 30000,
    "ultimaLectura" TIMESTAMP(3),
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispositivoIoT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiEvento" (
    "id" SERIAL NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "KpiEvento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoIoT_deviceId_key" ON "DispositivoIoT"("deviceId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_deviceId_idx" ON "DispositivoIoT"("deviceId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_ubicacionId_idx" ON "DispositivoIoT"("ubicacionId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_empresaId_idx" ON "DispositivoIoT"("empresaId");

-- CreateIndex
CREATE INDEX "DispositivoIoT_tipo_idx" ON "DispositivoIoT"("tipo");

-- CreateIndex
CREATE INDEX "DispositivoIoT_activo_idx" ON "DispositivoIoT"("activo");

-- CreateIndex
CREATE INDEX "KpiEvento_ubicacionId_idx" ON "KpiEvento"("ubicacionId");

-- CreateIndex
CREATE INDEX "KpiEvento_tipo_idx" ON "KpiEvento"("tipo");

-- CreateIndex
CREATE INDEX "KpiEvento_evento_idx" ON "KpiEvento"("evento");

-- CreateIndex
CREATE INDEX "KpiEvento_timestamp_idx" ON "KpiEvento"("timestamp");

-- CreateIndex
CREATE INDEX "Sensor_dispositivoIoTId_idx" ON "Sensor"("dispositivoIoTId");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_nombre_ubicacionId_key" ON "Sensor"("nombre", "ubicacionId");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoInventario" ADD CONSTRAINT "PedidoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_dispositivoIoTId_fkey" FOREIGN KEY ("dispositivoIoTId") REFERENCES "DispositivoIoT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoIoT" ADD CONSTRAINT "DispositivoIoT_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoIoT" ADD CONSTRAINT "DispositivoIoT_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiEvento" ADD CONSTRAINT "KpiEvento_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
