-- AlterTable
ALTER TABLE "result_creation_queue" ADD COLUMN     "custodian" TEXT;

-- AlterTable
ALTER TABLE "result_submission" ADD COLUMN     "custodian" TEXT;

-- CreateIndex
CREATE INDEX "result_creation_queue_custodian_idx" ON "result_creation_queue"("custodian");

-- CreateIndex
CREATE INDEX "result_submission_custodian_idx" ON "result_submission"("custodian");
