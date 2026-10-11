-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "barcodeBatchId" TEXT;

-- CreateTable
CREATE TABLE "BarcodeBatch" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarcodeBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarcodeBatch_idempotencyKey_key" ON "BarcodeBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BarcodeBatch_productId_idx" ON "BarcodeBatch"("productId");

-- CreateIndex
CREATE INDEX "BarcodeBatch_warehouseId_idx" ON "BarcodeBatch"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_barcodeBatchId_idx" ON "InventoryItem"("barcodeBatchId");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_barcodeBatchId_fkey" FOREIGN KEY ("barcodeBatchId") REFERENCES "BarcodeBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
