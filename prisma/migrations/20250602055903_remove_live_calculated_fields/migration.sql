/*
  Warnings:

  - You are about to drop the column `current_balance` on the `game_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio_value` on the `game_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio_value` on the `portfolio_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_balance` on the `portfolio_snapshots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "game_sessions" DROP COLUMN "current_balance",
DROP COLUMN "portfolio_value";

-- AlterTable
ALTER TABLE "portfolio_snapshots" DROP COLUMN "portfolio_value",
DROP COLUMN "wallet_balance";
