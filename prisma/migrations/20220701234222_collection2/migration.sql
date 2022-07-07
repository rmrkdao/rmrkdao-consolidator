-- CreateTable
CREATE TABLE "collection2" (
    "id" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "issuer" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "collection2_pkey" PRIMARY KEY ("id")
);
