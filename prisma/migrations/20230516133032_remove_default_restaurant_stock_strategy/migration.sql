/*
  Warnings:

  - You are about to drop the `RestaurantDefaultProductStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RestaurantDefaultProductStock" DROP CONSTRAINT "RestaurantDefaultProductStock_productId_fkey";

-- DropForeignKey
ALTER TABLE "RestaurantDefaultProductStock" DROP CONSTRAINT "RestaurantDefaultProductStock_restaurantId_fkey";

-- DropTable
DROP TABLE "RestaurantDefaultProductStock";
