-- CreateEnum
CREATE TYPE "ProductTrackingType" AS ENUM ('SERIALIZED', 'QUANTITY');

-- CreateEnum
CREATE TYPE "ProductUsageType" AS ENUM ('RENTAL', 'SALE', 'BOTH');

-- CreateEnum
CREATE TYPE "InventoryItemStatus" AS ENUM ('RECEIVED', 'AVAILABLE', 'RESERVED', 'PICKING', 'PACKED', 'IN_TRANSIT', 'AT_EVENT', 'RETURNING', 'INSPECTION', 'DAMAGED', 'MAINTENANCE', 'REPAIRED', 'LOST', 'RETIRED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "category" TEXT,
    "description" TEXT,
    "trackingType" "ProductTrackingType" NOT NULL DEFAULT 'SERIALIZED',
    "usageType" "ProductUsageType" NOT NULL DEFAULT 'RENTAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "assetNo" TEXT NOT NULL,
    "manufacturerSerial" TEXT,
    "barcode" TEXT,
    "status" "InventoryItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_productNo_key" ON "Product"("productNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_assetNo_key" ON "InventoryItem"("assetNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_manufacturerSerial_key" ON "InventoryItem"("manufacturerSerial");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_barcode_key" ON "InventoryItem"("barcode");

-- CreateIndex
CREATE INDEX "InventoryItem_productId_idx" ON "InventoryItem"("productId");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
