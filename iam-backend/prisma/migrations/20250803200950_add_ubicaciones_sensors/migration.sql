/*
  Warnings:

  - Added the required column `empresaId` to the `SensorLectura` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SensorLectura_productoId_fecha_idx";

-- DropIndex
DROP INDEX "SensorLectura_productoId_tipo_idx";

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "ubicacionId" INTEGER;

-- AlterTable
ALTER TABLE "SensorLectura" ADD COLUMN     "empresaId" INTEGER NOT NULL,
ADD COLUMN     "sensorId" INTEGER,
ADD COLUMN     "ubicacionId" INTEGER;

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "empresaId" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "SensorTipo" NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ubicacion_empresaId_idx" ON "Ubicacion"("empresaId");

-- CreateIndex
CREATE INDEX "Ubicacion_empresaId_activa_idx" ON "Ubicacion"("empresaId", "activa");

-- CreateIndex
CREATE INDEX "Sensor_ubicacionId_idx" ON "Sensor"("ubicacionId");

-- CreateIndex
CREATE INDEX "Sensor_empresaId_idx" ON "Sensor"("empresaId");

-- CreateIndex
CREATE INDEX "Sensor_tipo_idx" ON "Sensor"("tipo");

-- CreateIndex
CREATE INDEX "Producto_ubicacionId_idx" ON "Producto"("ubicacionId");

-- CreateIndex
CREATE INDEX "SensorLectura_sensorId_fecha_idx" ON "SensorLectura"("sensorId", "fecha");

-- CreateIndex
CREATE INDEX "SensorLectura_ubicacionId_fecha_idx" ON "SensorLectura"("ubicacionId", "fecha");

-- CreateIndex
CREATE INDEX "SensorLectura_empresaId_fecha_idx" ON "SensorLectura"("empresaId", "fecha");

-- CreateIndex
CREATE INDEX "SensorLectura_tipo_fecha_idx" ON "SensorLectura"("tipo", "fecha");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorLectura" ADD CONSTRAINT "SensorLectura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
