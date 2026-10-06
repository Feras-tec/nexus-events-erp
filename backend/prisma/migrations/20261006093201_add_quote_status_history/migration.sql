-- CreateTable
CREATE TABLE "QuoteStatusHistory" (
    "id" TEXT NOT NULL,
    "fromStatus" "QuoteStatus" NOT NULL,
    "toStatus" "QuoteStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT NOT NULL,

    CONSTRAINT "QuoteStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteStatusHistory_quoteId_idx" ON "QuoteStatusHistory"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteStatusHistory_createdAt_idx" ON "QuoteStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "QuoteStatusHistory" ADD CONSTRAINT "QuoteStatusHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
