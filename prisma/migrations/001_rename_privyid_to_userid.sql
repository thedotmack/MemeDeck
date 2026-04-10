-- Migration: Rename privyId to userId in Users table
-- This migration renames the primary key column for better semantic clarity
-- while preserving all existing data and relationships

BEGIN;

-- Step 1: Rename the column in the users table
ALTER TABLE users RENAME COLUMN privy_id TO user_id;

-- Step 2: Update any indexes that reference the old column name
-- (Prisma should handle this automatically, but we're being explicit)

-- Step 3: Verify the change worked
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'user_id'
    ) THEN
        RAISE EXCEPTION 'Migration failed: user_id column not found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'privy_id'
    ) THEN
        RAISE EXCEPTION 'Migration failed: privy_id column still exists';
    END IF;
END
$$;

COMMIT;