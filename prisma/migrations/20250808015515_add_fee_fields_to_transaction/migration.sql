-- Add fee tracking fields to Transaction table
ALTER TABLE "transactions" ADD COLUMN "fee_transaction_id" TEXT;
ALTER TABLE "transactions" ADD COLUMN "fee_amount_lamports" BIGINT;