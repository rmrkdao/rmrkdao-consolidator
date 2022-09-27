/*
  Warnings:

  - You are about to drop the column `status` on the `proposal` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `vote` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "result_creation_queue_status" AS ENUM ('waiting', 'about_to_submit', 'result_submitted', 'failed_to_submit');

-- DropIndex
DROP INDEX "proposal_status_idx";

-- AlterTable
ALTER TABLE "proposal" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "vote" DROP COLUMN "status";

-- DropEnum
DROP TYPE "proposal_status";

-- CreateTable
CREATE TABLE "result_creation_queue" (
    "proposal_id" TEXT NOT NULL,
    "status" "result_creation_queue_status" NOT NULL DEFAULT 'waiting',

    CONSTRAINT "result_creation_queue_pkey" PRIMARY KEY ("proposal_id")
);

-- CreateIndex
CREATE INDEX "result_creation_queue_status_idx" ON "result_creation_queue"("status");

-- AddForeignKey
ALTER TABLE "result_creation_queue" ADD CONSTRAINT "result_creation_queue_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
