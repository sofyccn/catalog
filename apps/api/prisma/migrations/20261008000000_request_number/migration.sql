-- Human-friendly order number (1, 2, 3…) instead of showing part of the cuid.
-- Equivalent to Prisma's `"number" SERIAL NOT NULL`, except existing orders are
-- numbered by creation date (oldest = 1) rather than physical row order.

-- AlterTable
ALTER TABLE "Request" ADD COLUMN "number" INTEGER;

UPDATE "Request" AS r
SET "number" = s.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn FROM "Request") AS s
WHERE r."id" = s."id";

CREATE SEQUENCE "Request_number_seq" AS INTEGER OWNED BY "Request"."number";
SELECT setval('"Request_number_seq"', COALESCE((SELECT MAX("number") FROM "Request"), 0) + 1, false);

ALTER TABLE "Request" ALTER COLUMN "number" SET DEFAULT nextval('"Request_number_seq"');
ALTER TABLE "Request" ALTER COLUMN "number" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Request_number_key" ON "Request"("number");
