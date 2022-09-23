-- CreateTable
CREATE TABLE "result" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "count" JSONB NOT NULL,
    "winningOptions" JSONB NOT NULL,
    "thresholdDenominator" DOUBLE PRECISION NOT NULL,
    "recertify" BOOLEAN NOT NULL,

    CONSTRAINT "result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "result_proposalId_idx" ON "result"("proposalId");
