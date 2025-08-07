-- DropForeignKey
ALTER TABLE "AlertConfiguration" DROP CONSTRAINT "AlertConfiguration_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AlertHistory" DROP CONSTRAINT "AlertHistory_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "BlacklistedToken" DROP CONSTRAINT "BlacklistedToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityEvent" DROP CONSTRAINT "SecurityEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "TwoFactorAuth" DROP CONSTRAINT "TwoFactorAuth_userId_fkey";

-- AlterTable
ALTER TABLE "MovimientoInventario" ADD COLUMN     "proveedorId" INTEGER;

-- CreateIndex
CREATE INDEX "MovimientoInventario_proveedorId_idx" ON "MovimientoInventario"("proveedorId");

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
