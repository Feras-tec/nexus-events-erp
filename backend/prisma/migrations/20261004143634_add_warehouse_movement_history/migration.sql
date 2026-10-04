-- AlterTable
ALTER TABLE "EquipmentMovement" ADD COLUMN     "fromWarehouseId" TEXT,
ADD COLUMN     "toWarehouseId" TEXT;

-- CreateIndex
CREATE INDEX "EquipmentMovement_fromWarehouseId_idx" ON "EquipmentMovement"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "EquipmentMovement_toWarehouseId_idx" ON "EquipmentMovement"("toWarehouseId");

-- AddForeignKey
ALTER TABLE "EquipmentMovement" ADD CONSTRAINT "EquipmentMovement_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMovement" ADD CONSTRAINT "EquipmentMovement_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
