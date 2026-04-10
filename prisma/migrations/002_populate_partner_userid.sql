-- Migration: Populate Partner.userId from existing data
-- This migration attempts to link existing partners to users via wallet addresses
-- This is a critical step before adding foreign key constraints

BEGIN;

-- Step 1: Create a temporary function to extract wallet address from privyUser JSON
CREATE OR REPLACE FUNCTION get_wallet_from_privy_user(privy_data jsonb)
RETURNS text AS $$
DECLARE
    wallet_addr text;
BEGIN
    -- Try to extract wallet address from various possible paths in the JSON
    -- This may need adjustment based on actual Privy user object structure
    SELECT coalesce(
        privy_data #>> '{linkedAccounts,0,address}',
        privy_data #>> '{wallet,address}',
        privy_data #>> '{wallets,0,address}',
        privy_data #>> '{address}'
    ) INTO wallet_addr;
    
    RETURN wallet_addr;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a mapping table to track our matches
CREATE TEMP TABLE partner_user_mapping AS
SELECT 
    p.id as partner_id,
    p.wallet_address as partner_wallet,
    u.user_id,
    get_wallet_from_privy_user(u.privy_user) as user_wallet
FROM partners p
LEFT JOIN users u ON LOWER(p.wallet_address) = LOWER(get_wallet_from_privy_user(u.privy_user))
WHERE p.user_id IS NULL -- Only update partners that don't have userId set
ORDER BY p.created_at;

-- Step 3: Show mapping results for verification
DO $$
DECLARE
    total_partners int;
    partners_needing_update int;
    successful_matches int;
    failed_matches int;
BEGIN
    SELECT COUNT(*) INTO total_partners FROM partners;
    SELECT COUNT(*) INTO partners_needing_update FROM partners WHERE user_id IS NULL;
    SELECT COUNT(*) INTO successful_matches FROM partner_user_mapping WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO failed_matches FROM partner_user_mapping WHERE user_id IS NULL;
    
    RAISE NOTICE 'Migration Analysis:';
    RAISE NOTICE '  Total partners: %', total_partners;
    RAISE NOTICE '  Partners needing userId: %', partners_needing_update;
    RAISE NOTICE '  Successful matches: %', successful_matches;
    RAISE NOTICE '  Failed matches: %', failed_matches;
    
    -- Stop migration if we have too many failed matches
    IF failed_matches > 0 THEN
        RAISE NOTICE 'WARNING: % partners could not be matched to users', failed_matches;
        RAISE NOTICE 'These partners will need manual intervention:';
        
        -- List the problematic partners
        FOR r IN (
            SELECT partner_id, partner_wallet 
            FROM partner_user_mapping 
            WHERE user_id IS NULL
        ) LOOP
            RAISE NOTICE '  Partner ID: %, Wallet: %', r.partner_id, r.partner_wallet;
        END LOOP;
        
        RAISE EXCEPTION 'Migration halted due to unmatched partners. Please resolve manually.';
    END IF;
END
$$;

-- Step 4: Update partners with matched user IDs
UPDATE partners 
SET user_id = pum.user_id,
    updated_at = NOW()
FROM partner_user_mapping pum
WHERE partners.id = pum.partner_id
  AND pum.user_id IS NOT NULL;

-- Step 5: Verify all partners now have user_id
DO $$
DECLARE
    partners_without_userid int;
BEGIN
    SELECT COUNT(*) INTO partners_without_userid FROM partners WHERE user_id IS NULL;
    
    IF partners_without_userid > 0 THEN
        RAISE EXCEPTION 'Migration verification failed: % partners still without user_id', partners_without_userid;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All partners now have user_id populated';
END
$$;

-- Step 6: Clean up temporary function
DROP FUNCTION IF EXISTS get_wallet_from_privy_user(jsonb);

COMMIT;