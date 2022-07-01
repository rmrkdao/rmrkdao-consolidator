-- CreateTable
CREATE TABLE "nft2" (
    "id" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "collection" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "transferable" INTEGER NOT NULL,
    "sn" TEXT NOT NULL,
    "metadata" TEXT,
    "forsale" BIGINT NOT NULL,
    "reactions" JSONB NOT NULL,
    "changes" JSONB NOT NULL,
    "owner" TEXT NOT NULL,
    "rootowner" TEXT NOT NULL,
    "burned" TEXT NOT NULL,
    "equipped" TEXT,
    "priority" JSONB NOT NULL,
    "children" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "properties" JSONB,
    "pending" BOOLEAN NOT NULL,

    CONSTRAINT "nft2_pkey" PRIMARY KEY ("id")
);
