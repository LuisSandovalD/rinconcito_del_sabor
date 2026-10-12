-- Guest ordering is granted only to an active table session through a hashed,
-- expiring secret. The raw secret is never persisted.
ALTER TABLE "TableSession"
  ADD COLUMN "guestTokenHash" TEXT,
  ADD COLUMN "guestTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "guestOrderingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "TableSession_guestTokenHash_key" ON "TableSession"("guestTokenHash");
CREATE INDEX "TableSession_guestTokenExpiresAt_guestOrderingEnabled_idx" ON "TableSession"("guestTokenExpiresAt", "guestOrderingEnabled");

-- Public customers use a separate identity and session store from employees.
ALTER TABLE "Customer"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

CREATE TABLE "CustomerSession" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "userAgent" TEXT,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");
CREATE INDEX "CustomerSession_customerId_expiresAt_revokedAt_idx" ON "CustomerSession"("customerId", "expiresAt", "revokedAt");
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;
CREATE INDEX "Order_customerId_openedAt_idx" ON "Order"("customerId", "openedAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
