-- CreateEnum
CREATE TYPE "ProductAvailabilityType" AS ENUM ('QUANTITY', 'AVAILABILITY');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availabilityType" "ProductAvailabilityType" NOT NULL DEFAULT 'QUANTITY',
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;
