-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('PROVIDER_MANAGER', 'RESTAURANT_MANAGER', 'WAITER', 'CUSTOMER');

-- CreateTable
CREATE TABLE "Session" (
    "userId" TEXT NOT NULL,
    "role" "SessionRole" NOT NULL,
    "token" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
