CREATE TYPE "DeliveryRecipientType" AS ENUM ('SELF', 'OTHER');
CREATE TYPE "DeliveryConsentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'EXPIRED');

ALTER TABLE "DeliveryOrder"
ADD COLUMN "recipientType" "DeliveryRecipientType" NOT NULL DEFAULT 'SELF',
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "accuracy" DECIMAL(8,2),
ADD COLUMN "mapsUrl" TEXT;

CREATE TABLE "DeliveryConsent" (
  "id" TEXT NOT NULL,
  "deliveryOrderId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientPhone" TEXT,
  "status" "DeliveryConsentStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "confirmedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryConsent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryConsent_deliveryOrderId_key" ON "DeliveryConsent"("deliveryOrderId");
CREATE UNIQUE INDEX "DeliveryConsent_tokenHash_key" ON "DeliveryConsent"("tokenHash");
CREATE INDEX "DeliveryConsent_recipientEmail_status_expiresAt_idx" ON "DeliveryConsent"("recipientEmail", "status", "expiresAt");

ALTER TABLE "DeliveryConsent"
ADD CONSTRAINT "DeliveryConsent_deliveryOrderId_fkey"
FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
