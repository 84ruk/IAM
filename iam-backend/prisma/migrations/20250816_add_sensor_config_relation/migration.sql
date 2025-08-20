/*
  Warnings:

  - A unique constraint covering the columns `[sensorId]` on the table `ConfiguracionAlerta` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sensorId` to the `ConfiguracionAlerta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConfiguracionAlerta" ADD COLUMN     "sensorId" INTEGER NOT NULL,
ADD COLUMN     "configuracionNotificacion" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionAlerta_sensorId_key" ON "ConfiguracionAlerta"("sensorId");

-- AddForeignKey
ALTER TABLE "ConfiguracionAlerta" ADD CONSTRAINT "ConfiguracionAlerta_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
