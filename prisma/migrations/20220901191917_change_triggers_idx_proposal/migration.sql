-- CreateIndex
CREATE INDEX "proposal_custodian_idx" ON "proposal"("custodian");

-- CreateIndex
CREATE INDEX "proposal_startDate_idx" ON "proposal"("startDate");

-- CreateIndex
CREATE INDEX "proposal_snapshot_idx" ON "proposal"("snapshot");

-- CreateIndex
CREATE INDEX "proposal_endDate_idx" ON "proposal"("endDate");

-- Track changes on custodian and proposal tables in case of needing to revert
create trigger custodian_history before insert or update or delete on custodian for each row execute function change_trigger();
create trigger proposal_history before insert or update or delete on proposal for each row execute function change_trigger();