-- CreateTable
CREATE TABLE "TwoFactorAuth" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastUsed" TIMESTAMP(3),
    "lastUsedBackupCode" TIMESTAMP(3),
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "backupCodesRegeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorAuth_userId_key" ON "TwoFactorAuth"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorAuth_isEnabled_idx" ON "TwoFactorAuth"("isEnabled");

-- CreateIndex
CREATE INDEX "TwoFactorAuth_setupCompleted_idx" ON "TwoFactorAuth"("setupCompleted");

-- AddForeignKey
ALTER TABLE "TwoFactorAuth" ADD CONSTRAINT "TwoFactorAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE; 