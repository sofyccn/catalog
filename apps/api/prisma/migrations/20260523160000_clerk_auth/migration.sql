-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "clerkId" TEXT,
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ALTER COLUMN "role" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
