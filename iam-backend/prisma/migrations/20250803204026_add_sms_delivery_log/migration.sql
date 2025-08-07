-- CreateTable
CREATE TABLE "SMSDeliveryLog" (
    "id" SERIAL NOT NULL,
    "messageId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "provider" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "alertaId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_empresaId_idx" ON "SMSDeliveryLog"("empresaId");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_messageId_idx" ON "SMSDeliveryLog"("messageId");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_status_idx" ON "SMSDeliveryLog"("status");

-- CreateIndex
CREATE INDEX "SMSDeliveryLog_timestamp_idx" ON "SMSDeliveryLog"("timestamp");

-- AddForeignKey
ALTER TABLE "SMSDeliveryLog" ADD CONSTRAINT "SMSDeliveryLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSDeliveryLog" ADD CONSTRAINT "SMSDeliveryLog_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "AlertHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
