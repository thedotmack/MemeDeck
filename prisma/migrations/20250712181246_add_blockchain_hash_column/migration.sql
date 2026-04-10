/*
  Warnings:

  - You are about to drop the column `points` on the `achievements` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('privy_embedded', 'external', 'demo');

-- AlterTable
ALTER TABLE "achievements" DROP COLUMN "points";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "blockchain_hash" TEXT,
ADD COLUMN     "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "is_live" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platform_fee" DOUBLE PRECISION,
ADD COLUMN     "slippage" DOUBLE PRECISION,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'confirmed';

-- CreateTable
CREATE TABLE "wallet_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "wallet_type" "WalletType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "can_trade_live" BOOLEAN NOT NULL DEFAULT false,
    "last_balance_check" TIMESTAMP(3),
    "last_sol_balance" DOUBLE PRECISION,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),

    CONSTRAINT "wallet_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_connections_user_id_idx" ON "wallet_connections"("user_id");

-- CreateIndex
CREATE INDEX "wallet_connections_wallet_address_idx" ON "wallet_connections"("wallet_address");

-- CreateIndex
CREATE INDEX "wallet_connections_is_active_idx" ON "wallet_connections"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_connections_user_id_wallet_address_key" ON "wallet_connections"("user_id", "wallet_address");

-- CreateIndex
CREATE INDEX "transactions_blockchain_hash_idx" ON "transactions"("blockchain_hash");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_is_live_idx" ON "transactions"("is_live");

-- AddForeignKey
ALTER TABLE "wallet_connections" ADD CONSTRAINT "wallet_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
