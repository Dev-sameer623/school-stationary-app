-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('COUNTER', 'ONLINE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "passwordHash" TEXT;

-- AlterTable
DROP INDEX "Customer_email_idx";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastRefreshedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");
CREATE INDEX "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");

-- AddForeignKey
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "source" "OrderSource" NOT NULL DEFAULT 'COUNTER';
ALTER TABLE "Order" ADD COLUMN "pickupNote" TEXT;

-- AlterTable
ALTER TABLE "StockTransaction" ALTER COLUMN "userId" DROP NOT NULL;
