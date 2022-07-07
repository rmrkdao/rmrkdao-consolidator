-- CreateTable
CREATE TABLE "base2" (
    "id" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "type" TEXT,
    "parts" JSONB,
    "changes" JSONB NOT NULL,
    "themes" JSONB,
    "metadata" TEXT,

    CONSTRAINT "base2_pkey" PRIMARY KEY ("id")
);
