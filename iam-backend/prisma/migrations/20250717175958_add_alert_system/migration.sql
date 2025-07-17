-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "productoId" INTEGER,
    "productoNombre" TEXT,
    "destinatarios" TEXT[],
    "estado" TEXT NOT NULL DEFAULT 'ENVIADA',
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLectura" TIMESTAMP(3),
    "fechaResolucion" TIMESTAMP(3),
    "condicionActivacion" JSONB,
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertConfiguration" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "tipoAlerta" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destinatarios" TEXT[],
    "frecuencia" TEXT NOT NULL,
    "ventanaEsperaMinutos" INTEGER,
    "umbralCritico" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenidoHtml" TEXT NOT NULL,
    "contenidoTexto" TEXT,
    "variables" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertHistory_empresaId_idx" ON "AlertHistory"("empresaId");

-- CreateIndex
CREATE INDEX "AlertHistory_tipo_idx" ON "AlertHistory"("tipo");

-- CreateIndex
CREATE INDEX "AlertHistory_estado_idx" ON "AlertHistory"("estado");

-- CreateIndex
CREATE INDEX "AlertHistory_fechaEnvio_idx" ON "AlertHistory"("fechaEnvio" DESC);

-- CreateIndex
CREATE INDEX "AlertConfiguration_empresaId_idx" ON "AlertConfiguration"("empresaId");

-- CreateIndex
CREATE INDEX "AlertConfiguration_tipoAlerta_idx" ON "AlertConfiguration"("tipoAlerta");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_name_idx" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_tipo_idx" ON "NotificationTemplate"("tipo");

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertConfiguration" ADD CONSTRAINT "AlertConfiguration_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
