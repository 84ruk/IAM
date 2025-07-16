-- CreateTable
CREATE TABLE "BlacklistedToken" (
    "id" SERIAL NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'manual_revocation',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedToken_jti_key" ON "BlacklistedToken"("jti");

-- CreateIndex
CREATE INDEX "BlacklistedToken_userId_idx" ON "BlacklistedToken"("userId");

-- CreateIndex
CREATE INDEX "BlacklistedToken_expiresAt_idx" ON "BlacklistedToken"("expiresAt");

-- CreateIndex
CREATE INDEX "BlacklistedToken_reason_idx" ON "BlacklistedToken"("reason");

-- AddForeignKey
ALTER TABLE "BlacklistedToken" ADD CONSTRAINT "BlacklistedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE; 