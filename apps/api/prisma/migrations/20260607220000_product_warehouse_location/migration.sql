-- AlterTable: store the warehouse "casillero" code (e.g. "A28") on each product.
-- Only shown to dispatchers/admin in the order-review screen.
ALTER TABLE "Product" ADD COLUMN "warehouseLocation" TEXT;
