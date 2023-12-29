-- AlterTable
ALTER TABLE "RestaurantManager" ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "RestaurantManager_restaurantId_isOwner_idx" ON "RestaurantManager"("restaurantId", "isOwner");
