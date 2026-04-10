-- AddTransactionJsonbResponses
-- Remove ALL assumption-based fields and add JSONB columns for full API responses

-- Remove ALL fields that make assumptions about data structure
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "type";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "token_id";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "symbol";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "token_name";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "amount";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "price";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "total_value";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "entry_price";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "exit_price";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "realized_pnl";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "position_size";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "profit_loss";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "fees";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "platform_fee";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "slippage";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "blockchain_hash";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "is_live";

-- Add JSONB columns for full API responses
ALTER TABLE "transactions" ADD COLUMN "order_response" JSONB;
ALTER TABLE "transactions" ADD COLUMN "tx_response" JSONB;
ALTER TABLE "transactions" ADD COLUMN "route_plan" JSONB;
ALTER TABLE "transactions" ADD COLUMN "raw_api_data" JSONB;