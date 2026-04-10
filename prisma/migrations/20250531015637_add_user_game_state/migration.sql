-- CreateTable
CREATE TABLE "user_game_states" (
    "user_id" TEXT NOT NULL,
    "wallet_balance" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "portfolio_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realized_pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positions" JSONB NOT NULL DEFAULT '{}',
    "hand" JSONB NOT NULL DEFAULT '[]',
    "bet_amount" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "round" INTEGER NOT NULL DEFAULT 1,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_game_states_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "user_game_states" ADD CONSTRAINT "user_game_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
