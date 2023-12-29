/*
  Warnings:

  - Made the column `maxTables` on table `Restaurant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Restaurant" ALTER COLUMN "maxTables" SET NOT NULL,
ALTER COLUMN "maxTables" DROP DEFAULT;
