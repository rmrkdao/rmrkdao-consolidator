-- CreateTable
CREATE TABLE "custodian" (
    "custodian" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "proposalFee" TEXT NOT NULL,
    "voteFee" TEXT NOT NULL,
    "recertifyFee" TEXT NOT NULL,
    "maxOptions" INTEGER NOT NULL,
    "changes" JSONB NOT NULL,

    CONSTRAINT "custodian_pkey" PRIMARY KEY ("custodian")
);

-- CreateTable
CREATE TABLE "proposal" (
    "id" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "custodian" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "collections" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "passingThreshold" DOUBLE PRECISION,
    "startDate" DOUBLE PRECISION NOT NULL,
    "snapshot" DOUBLE PRECISION NOT NULL,
    "endDate" DOUBLE PRECISION NOT NULL,
    "nftWeight" BOOLEAN NOT NULL,
    "electorate" BOOLEAN NOT NULL,

    CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_time" (
    "block" INTEGER NOT NULL,
    "unix_milliseconds" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "block_time_pkey" PRIMARY KEY ("block")
);

-- CreateIndex
CREATE INDEX "custodian_block_idx" ON "custodian"("block");

-- CreateIndex
CREATE INDEX "proposal_block_idx" ON "proposal"("block");

-- CreateIndex
CREATE INDEX "block_time_unix_milliseconds_idx" ON "block_time"("unix_milliseconds");
