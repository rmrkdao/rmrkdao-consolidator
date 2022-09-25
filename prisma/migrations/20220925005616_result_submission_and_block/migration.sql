/*
  Warnings:

  - Added the required column `block` to the `result` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "result" ADD COLUMN     "block" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "result_submission" (
    "extrinsic" TEXT NOT NULL,
    "added_to_db" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposal_id" TEXT NOT NULL,
    "count" JSONB NOT NULL,
    "winning_options" JSONB NOT NULL,
    "threshold_denominator" DOUBLE PRECISION NOT NULL,
    "recertify" BOOLEAN NOT NULL,

    CONSTRAINT "result_submission_pkey" PRIMARY KEY ("extrinsic")
);

-- CreateIndex
CREATE INDEX "result_submission_added_to_db_idx" ON "result_submission"("added_to_db");

-- CreateIndex
CREATE INDEX "result_submission_proposal_id_idx" ON "result_submission"("proposal_id");

-- CreateIndex
CREATE INDEX "result_block_idx" ON "result"("block");
