/*
  Warnings:

  - You are about to drop the column `waiterId` on the `TableSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TableSession" DROP CONSTRAINT "TableSession_waiterId_fkey";

-- AlterTable
ALTER TABLE "TableSession" DROP COLUMN "waiterId";
