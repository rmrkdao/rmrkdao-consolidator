-- CreateEnum
CREATE TYPE "latest_consolidating_rmrk_status" AS ENUM ('processing', 'complete');

-- CreateTable
CREATE TABLE "consolidation_info" (
    "version" TEXT NOT NULL,
    "latest_block" INTEGER NOT NULL,
    "latest_rmrk_offset" INTEGER NOT NULL,
    "status" "latest_consolidating_rmrk_status" NOT NULL,

    CONSTRAINT "consolidation_info_pkey" PRIMARY KEY ("version")
);
