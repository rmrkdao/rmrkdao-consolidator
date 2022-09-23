-- DropIndex
DROP INDEX "result_proposalId_idx";

-- AlterTable
ALTER TABLE "result" RENAME "proposalId" TO "proposal_id";
ALTER TABLE "result" RENAME "thresholdDenominator" TO "threshold_denominator";
ALTER TABLE "result" RENAME "winningOptions" TO "winning_options";

-- CreateIndex
CREATE INDEX "result_proposal_id_idx" ON "result"("proposal_id");

-- Track changes on result table in case of needing to revert
create trigger result_history before insert or update or delete on result for each row execute function change_trigger();