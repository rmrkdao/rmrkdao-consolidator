-- CreateEnum
CREATE TYPE "vote_status" AS ENUM ('pending', 'counted', 'invalid');

-- CreateTable
CREATE TABLE "vote" (
    "id" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "caller" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "status" "vote_status" NOT NULL DEFAULT 'pending',
    "changes" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vote_block_idx" ON "vote"("block");

-- CreateIndex
CREATE INDEX "vote_caller_idx" ON "vote"("caller");

-- CreateIndex
CREATE INDEX "vote_proposal_id_idx" ON "vote"("proposal_id");

-- Track changes on vote table in case of needing to revert
create trigger vote_history before insert or update or delete on vote for each row execute function change_trigger();