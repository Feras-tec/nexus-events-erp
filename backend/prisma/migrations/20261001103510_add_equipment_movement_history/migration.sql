-- CreateEnum
CREATE TYPE "EquipmentMovementType" AS ENUM ('RECEIVED', 'RESERVED', 'PICKED', 'PACKED', 'LOADED', 'TRANSFERRED', 'DELIVERED_TO_EVENT', 'RETURNED_FROM_EVENT', 'INSPECTION', 'MAINTENANCE', 'REPAIRED', 'LOST', 'RETIRED', 'MANUAL_ADJUSTMENT');

-- CreateTable
CREATE TABLE "EquipmentMovement" (
    "id" TEXT NOT NULL,
    "type" "EquipmentMovementType" NOT NULL,
    "fromStatus" "InventoryItemStatus",
    "toStatus" "InventoryItemStatus" NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryItemId" TEXT NOT NULL,

    CONSTRAINT "EquipmentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentMovement_inventoryItemId_idx" ON "EquipmentMovement"("inventoryItemId");

-- CreateIndex
CREATE INDEX "EquipmentMovement_createdAt_idx" ON "EquipmentMovement"("createdAt");

-- CreateIndex
CREATE INDEX "EquipmentMovement_type_idx" ON "EquipmentMovement"("type");

-- AddForeignKey
ALTER TABLE "EquipmentMovement" ADD CONSTRAINT "EquipmentMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
