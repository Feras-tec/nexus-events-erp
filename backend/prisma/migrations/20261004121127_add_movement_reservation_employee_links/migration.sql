-- AlterTable
ALTER TABLE "EquipmentMovement" ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "responsibleEmployeeId" TEXT;

-- CreateIndex
CREATE INDEX "EquipmentMovement_reservationId_idx" ON "EquipmentMovement"("reservationId");

-- CreateIndex
CREATE INDEX "EquipmentMovement_responsibleEmployeeId_idx" ON "EquipmentMovement"("responsibleEmployeeId");

-- AddForeignKey
ALTER TABLE "EquipmentMovement" ADD CONSTRAINT "EquipmentMovement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMovement" ADD CONSTRAINT "EquipmentMovement_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
