-- Digital products + library ownership
-- Run: yarn db:push

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isDigital" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "digitalAssetUrl" TEXT;

ALTER TABLE "LibraryItem" ADD COLUMN IF NOT EXISTS "orderId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "LibraryItem_userId_productId_key" ON "LibraryItem"("userId", "productId");
CREATE INDEX IF NOT EXISTS "LibraryItem_userId_idx" ON "LibraryItem"("userId");
CREATE INDEX IF NOT EXISTS "LibraryItem_productId_idx" ON "LibraryItem"("productId");
