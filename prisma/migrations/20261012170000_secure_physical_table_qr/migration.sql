ALTER TABLE "RestaurantTable"
ADD COLUMN "physicalQrTokenHash" TEXT,
ADD COLUMN "physicalQrRotatedAt" TIMESTAMP(3),
ADD COLUMN "physicalQrOrderingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "RestaurantTable_physicalQrTokenHash_key"
ON "RestaurantTable"("physicalQrTokenHash");

CREATE INDEX "RestaurantTable_physicalQrOrderingEnabled_active_idx"
ON "RestaurantTable"("physicalQrOrderingEnabled", "active");
