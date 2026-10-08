-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'READY' BEFORE 'COMPLETED';

-- CreateEnum
CREATE TYPE "CollectionPayment" AS ENUM ('CASH', 'UPI');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "studentName" TEXT,
ADD COLUMN "studentClass" TEXT,
ADD COLUMN "studentSection" TEXT,
ADD COLUMN "paymentMethod" "CollectionPayment",
ADD COLUMN "collectedAt" TIMESTAMP(3),
ADD COLUMN "collectedById" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_collectedById_idx" ON "Order"("collectedById");
