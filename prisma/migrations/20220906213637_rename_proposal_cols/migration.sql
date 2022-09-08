/*
  Warnings:

  - You are about to drop the column `endDate` on the `proposal` table. All the data in the column will be lost.
  - You are about to drop the column `nftWeight` on the `proposal` table. All the data in the column will be lost.
  - You are about to drop the column `passingThreshold` on the `proposal` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `proposal` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nft_weight` to the `proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `proposal` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "proposal_endDate_idx";

-- DropIndex
DROP INDEX "proposal_startDate_idx";

-- AlterTable

ALTER TABLE "proposal" RENAME "endDate" TO "end_date";
ALTER TABLE "proposal" RENAME "nftWeight" TO "nft_weight";
ALTER TABLE "proposal" RENAME "passingThreshold" TO "passing_threshold";
ALTER TABLE "proposal" RENAME "startDate" TO "start_date";

-- CreateIndex
CREATE INDEX "proposal_start_date_idx" ON "proposal"("start_date");

-- CreateIndex
CREATE INDEX "proposal_end_date_idx" ON "proposal"("end_date");
