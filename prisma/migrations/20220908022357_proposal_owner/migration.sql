-- AlterTable
ALTER TABLE "proposal" ADD COLUMN     "owner" TEXT NOT NULL DEFAULT '';

-- Remove default
ALTER TABLE "proposal" ALTER COLUMN "owner" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "proposal_owner_idx" ON "proposal"("owner");
