/*
  Warnings:

  - You are about to drop the column `isActive` on the `Restaurant` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "isActive",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
