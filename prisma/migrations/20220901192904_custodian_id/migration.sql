/*
  Warnings:

  - The primary key for the `custodian` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `custodian` on the `custodian` table. All the data in the column will be lost.
  - Added the required column `id` to the `custodian` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "custodian" DROP CONSTRAINT "custodian_pkey",
DROP COLUMN "custodian",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "custodian_pkey" PRIMARY KEY ("id");
