-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_empresaId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "setupCompletado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "empresaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
