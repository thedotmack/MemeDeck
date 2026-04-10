-- Migration: Clean up fee system complexity
-- Remove unused FeeRecoveryQueue table and unused columns from FeeTransaction

-- Drop fee recovery queue table completely (was never actually created in production)
DROP TABLE IF EXISTS fee_recovery_queue;

-- Remove unused columns from fee_transactions
ALTER TABLE fee_transactions 
DROP COLUMN IF EXISTS error_details,
DROP COLUMN IF EXISTS refund_transaction_hash,
DROP COLUMN IF EXISTS refunded_at,
DROP COLUMN IF EXISTS retry_count;

-- Note: Keeping core fee tracking columns:
-- - id, tradeId, referrerId
-- - tradeAmountLamports, platformFeeLamports, referrerShareLamports, userDiscountLamports
-- - tier, status, feeTransactionHash, tradeTransactionHash
-- - createdAt, referrer relation