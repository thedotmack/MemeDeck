/*
  Warnings:

  - You are about to drop the column `snapshot_time` on the `portfolio_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `total_value` on the `portfolio_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `price_per_token` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `token_symbol` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_type` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `price` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `symbol` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'paused', 'ended');

-- CreateEnum
CREATE TYPE "SnapshotReason" AS ENUM ('periodic', 'major_change', 'manual', 'session_end');

-- DropIndex
DROP INDEX "portfolio_snapshots_user_id_snapshot_time_idx";

-- DropIndex
DROP INDEX "transactions_created_at_idx";

-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN     "current_balance" DOUBLE PRECISION,
ADD COLUMN     "last_activity" TIMESTAMP(3),
ADD COLUMN     "portfolio_value" DOUBLE PRECISION,
ADD COLUMN     "position_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "transaction_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "portfolio_snapshots" DROP COLUMN "snapshot_time",
DROP COLUMN "total_value",
ADD COLUMN     "reason" "SnapshotReason" NOT NULL DEFAULT 'manual',
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "created_at",
DROP COLUMN "price_per_token",
DROP COLUMN "token_symbol",
DROP COLUMN "transaction_type",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "symbol" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- CreateIndex
CREATE INDEX "game_sessions_status_idx" ON "game_sessions"("status");

-- CreateIndex
CREATE INDEX "portfolio_snapshots_user_id_timestamp_idx" ON "portfolio_snapshots"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "transactions_timestamp_idx" ON "transactions"("timestamp");
