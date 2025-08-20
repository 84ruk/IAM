-- CreateTable
CREATE TABLE "ConfiguracionAlerta" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sensorId" INTEGER NOT NULL,
    "tipoAlerta" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "frecuencia" TEXT NOT NULL,
    "ventanaEsperaMinutos" INTEGER,
    "umbralCritico" JSONB NOT NULL,
    "configuracionNotificacion" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionAlertaDestinatario" (
    "id" SERIAL NOT NULL,
    "configuracionAlertaId" INTEGER NOT NULL,
    "destinatarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfiguracionAlertaDestinatario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConfiguracionAlerta" ADD CONSTRAINT "ConfiguracionAlerta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlerta" ADD CONSTRAINT "ConfiguracionAlerta_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlertaDestinatario" ADD CONSTRAINT "ConfiguracionAlertaDestinatario_configuracionAlertaId_fkey" FOREIGN KEY ("configuracionAlertaId") REFERENCES "ConfiguracionAlerta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracionAlertaDestinatario" ADD CONSTRAINT "ConfiguracionAlertaDestinatario_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ConfiguracionAlerta_empresaId_idx" ON "ConfiguracionAlerta"("empresaId");
CREATE INDEX "ConfiguracionAlerta_sensorId_idx" ON "ConfiguracionAlerta"("sensorId");
CREATE INDEX "ConfiguracionAlertaDestinatario_configuracionAlertaId_idx" ON "ConfiguracionAlertaDestinatario"("configuracionAlertaId");
