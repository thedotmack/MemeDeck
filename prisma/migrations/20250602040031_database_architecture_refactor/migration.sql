/*
  Warnings:

  - You are about to drop the column `portfolio_value` on the `user_game_states` table. All the data in the column will be lost.
  - You are about to drop the column `realized_pnl` on the `user_game_states` table. All the data in the column will be lost.
  - You are about to drop the column `total_fees` on the `user_game_states` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_balance` on the `user_game_states` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "entry_price" DOUBLE PRECISION,
ADD COLUMN     "exit_price" DOUBLE PRECISION,
ADD COLUMN     "position_size" DOUBLE PRECISION,
ADD COLUMN     "realized_pnl" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user_game_states" DROP COLUMN "portfolio_value",
DROP COLUMN "realized_pnl",
DROP COLUMN "total_fees",
DROP COLUMN "wallet_balance";
