-- CreateEnum
CREATE TYPE "proposal_status" AS ENUM ('waiting', 'ready_to_count', 'counted');

-- AlterTable
ALTER TABLE "proposal" ADD COLUMN     "status" "proposal_status" NOT NULL DEFAULT 'waiting';

-- CreateIndex
CREATE INDEX "proposal_status_idx" ON "proposal"("status");
