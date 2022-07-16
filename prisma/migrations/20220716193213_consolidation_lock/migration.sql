-- CreateTable
CREATE TABLE "consolidation_lock" (
    "version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" TEXT NOT NULL,

    CONSTRAINT "consolidation_lock_pkey" PRIMARY KEY ("version")
);
