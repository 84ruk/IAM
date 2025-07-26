-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnidadMedida" ADD VALUE 'KILOGRAMO';
ALTER TYPE "UnidadMedida" ADD VALUE 'LITROS';
ALTER TYPE "UnidadMedida" ADD VALUE 'METRO';
ALTER TYPE "UnidadMedida" ADD VALUE 'METROS';
ALTER TYPE "UnidadMedida" ADD VALUE 'GRAMO';
ALTER TYPE "UnidadMedida" ADD VALUE 'GRAMOS';
ALTER TYPE "UnidadMedida" ADD VALUE 'MILILITRO';
ALTER TYPE "UnidadMedida" ADD VALUE 'MILILITROS';
ALTER TYPE "UnidadMedida" ADD VALUE 'CENTIMETRO';
ALTER TYPE "UnidadMedida" ADD VALUE 'CENTIMETROS';

-- DropForeignKey
ALTER TABLE "AlertConfiguration" DROP CONSTRAINT "AlertConfiguration_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AlertHistory" DROP CONSTRAINT "AlertHistory_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AlertHistory" DROP CONSTRAINT "AlertHistory_productoId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "BlacklistedToken" DROP CONSTRAINT "BlacklistedToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_productoId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoInventario" DROP CONSTRAINT "PedidoInventario_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoInventario" DROP CONSTRAINT "PedidoInventario_productoId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoInventario" DROP CONSTRAINT "PedidoInventario_proveedorId_fkey";

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_proveedorId_fkey";

-- DropForeignKey
ALTER TABLE "Proveedor" DROP CONSTRAINT "Proveedor_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityEvent" DROP CONSTRAINT "SecurityEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "SensorLectura" DROP CONSTRAINT "SensorLectura_productoId_fkey";

-- DropForeignKey
ALTER TABLE "TwoFactorAuth" DROP CONSTRAINT "TwoFactorAuth_userId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_empresaId_fkey";
