-- Migration: Add foreign key constraints and make Partner.userId NOT NULL
-- This migration adds referential integrity between Users and Partner tables

BEGIN;

-- Step 1: Verify all partners have user_id populated
DO $$
DECLARE
    partners_without_userid int;
BEGIN
    SELECT COUNT(*) INTO partners_without_userid FROM partners WHERE user_id IS NULL;
    
    IF partners_without_userid > 0 THEN
        RAISE EXCEPTION 'Cannot add foreign key: % partners still have NULL user_id', partners_without_userid;
    END IF;
    
    RAISE NOTICE 'Verification passed: All partners have user_id populated';
END
$$;

-- Step 2: Verify all partner user_ids exist in users table
DO $$
DECLARE
    orphaned_partners int;
BEGIN
    SELECT COUNT(*) INTO orphaned_partners 
    FROM partners p 
    WHERE p.user_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = p.user_id);
    
    IF orphaned_partners > 0 THEN
        RAISE NOTICE 'Found % partners with user_ids that don''t exist in users table:', orphaned_partners;
        
        -- List the problematic partners
        FOR r IN (
            SELECT p.id, p.user_id, p.wallet_address
            FROM partners p 
            WHERE p.user_id IS NOT NULL 
              AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = p.user_id)
        ) LOOP
            RAISE NOTICE '  Partner ID: %, User ID: %, Wallet: %', r.id, r.user_id, r.wallet_address;
        END LOOP;
        
        RAISE EXCEPTION 'Cannot add foreign key: Partners reference non-existent users';
    END IF;
    
    RAISE NOTICE 'Verification passed: All partner user_ids exist in users table';
END
$$;

-- Step 3: Make Partner.user_id NOT NULL
ALTER TABLE partners 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraint from Partner to Users
ALTER TABLE partners 
ADD CONSTRAINT fk_partners_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);

-- Step 6: Verify the constraints were added successfully
DO $$
DECLARE
    constraint_exists boolean;
    index_exists boolean;
BEGIN
    -- Check foreign key constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_partners_user_id'
        AND table_name = 'partners'
        AND constraint_type = 'FOREIGN KEY'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Foreign key constraint was not created successfully';
    END IF;
    
    -- Check index
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_partners_user_id'
        AND tablename = 'partners'
    ) INTO index_exists;
    
    IF NOT index_exists THEN
        RAISE EXCEPTION 'Index was not created successfully';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Foreign key constraint and index added successfully';
END
$$;

-- Step 7: Test the constraint by attempting an invalid insert (should fail)
DO $$
BEGIN
    BEGIN
        INSERT INTO partners (user_id, partner_code, wallet_address) 
        VALUES ('non-existent-user-id', 'TEST123', '0xtest');
        RAISE EXCEPTION 'Foreign key constraint test failed - invalid insert succeeded';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'SUCCESS: Foreign key constraint is working correctly';
            -- This is expected, continue
    END;
END
$$;

COMMIT;