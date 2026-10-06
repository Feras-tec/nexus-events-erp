-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "lastSentAt" TIMESTAMP(3),
ADD COLUMN     "lastSentTo" TEXT;
