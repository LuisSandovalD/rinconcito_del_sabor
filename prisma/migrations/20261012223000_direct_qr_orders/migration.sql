BEGIN;

INSERT INTO "KitchenTicket" ("id", "orderId", "stationId", "status", "sentAt")
SELECT
  md5(random()::text || clock_timestamp()::text || orders."id" || products."stationId"),
  orders."id",
  products."stationId",
  'NEW',
  CURRENT_TIMESTAMP
FROM "Order" AS orders
JOIN "OrderItem" AS items ON items."orderId" = orders."id"
JOIN "Product" AS products ON products."id" = items."productId"
WHERE orders."type" = 'DINE_IN'
  AND orders."status" = 'NEW'
  AND orders."tableSessionId" IS NOT NULL
  AND products."stationId" IS NOT NULL
GROUP BY orders."id", products."stationId"
ON CONFLICT ("orderId", "stationId") DO NOTHING;

INSERT INTO "OrderStatusHistory" ("id", "orderId", "fromStatus", "toStatus", "device", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || orders."id"),
  orders."id",
  'NEW',
  'SENT',
  'direct-qr-migration',
  CURRENT_TIMESTAMP
FROM "Order" AS orders
WHERE orders."type" = 'DINE_IN'
  AND orders."status" = 'NEW'
  AND orders."tableSessionId" IS NOT NULL;

UPDATE "RestaurantTable" AS tables
SET "status" = 'SENT', "version" = tables."version" + 1
FROM "Order" AS orders
WHERE orders."tableId" = tables."id"
  AND orders."type" = 'DINE_IN'
  AND orders."status" = 'NEW'
  AND orders."tableSessionId" IS NOT NULL;

UPDATE "Order"
SET "status" = 'SENT',
    "confirmedAt" = COALESCE("confirmedAt", CURRENT_TIMESTAMP),
    "sentAt" = COALESCE("sentAt", CURRENT_TIMESTAMP),
    "version" = "version" + 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'DINE_IN'
  AND "status" = 'NEW'
  AND "tableSessionId" IS NOT NULL;

ALTER TABLE "RestaurantSettings" DROP COLUMN "waiterApprovalRequired";

COMMIT;
