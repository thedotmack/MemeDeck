-- RemoveTransactionStatus
-- Remove status field since everything goes in JSONB

-- Drop the index on status first
DROP INDEX IF EXISTS "transactions_status_idx";

-- Remove the status column
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "status";