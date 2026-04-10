# Database Migration Rollback Instructions

This document provides step-by-step rollback procedures for each phase of the database migration.

## ⚠️ IMPORTANT: Execute rollbacks in REVERSE order

If you need to rollback, execute these steps in the OPPOSITE order of the original migration.

## Phase 3 Rollback: Remove Foreign Key Constraints

```sql
BEGIN;

-- Remove foreign key constraint
ALTER TABLE partners DROP CONSTRAINT IF EXISTS fk_partners_user_id;

-- Drop the index
DROP INDEX IF EXISTS idx_partners_user_id;

-- Make Partner.user_id nullable again
ALTER TABLE partners ALTER COLUMN user_id DROP NOT NULL;

COMMIT;
```

## Phase 2 Rollback: Clear Partner.userId Data

```sql
BEGIN;

-- Clear user_id values from partners table
UPDATE partners SET user_id = NULL;

-- Verify all partner user_id values are cleared
DO $$
DECLARE
    partners_with_userid int;
BEGIN
    SELECT COUNT(*) INTO partners_with_userid FROM partners WHERE user_id IS NOT NULL;
    
    IF partners_with_userid > 0 THEN
        RAISE EXCEPTION 'Rollback verification failed: % partners still have user_id', partners_with_userid;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All partner user_id values cleared';
END
$$;

COMMIT;
```

## Phase 1 Rollback: Rename userId back to privyId

```sql
BEGIN;

-- Rename the column back
ALTER TABLE users RENAME COLUMN user_id TO privy_id;

-- Verify the rollback worked
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'privy_id'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: privy_id column not found';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'user_id'
    ) THEN
        RAISE EXCEPTION 'Rollback failed: user_id column still exists';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Column renamed back to privy_id';
END
$$;

COMMIT;
```

## Code Rollback Instructions

### 1. Revert Prisma Schema
Restore the original `prisma/schema.prisma`:
- Change `userId` back to `privyId` in Users model
- Remove foreign key relationships
- Make Partner.userId nullable again

### 2. Revert API Endpoints
Restore all API endpoints to use the original patterns:
- `/app/api/partners/route.ts` - Use walletAddress lookups
- `/app/api/store/[key]/route.ts` - Use privyId field
- `/app/api/partners/update-code/route.ts` - Use walletAddress
- `/app/api/partners/claim-earnings/route.ts` - Use walletAddress + partnerId
- `/app/api/referrals/route.ts` - Use walletAddress

### 3. Regenerate Prisma Client
```bash
npx prisma generate
```

## Emergency Rollback (Full System)

If you need to completely rollback the entire migration:

```bash
# 1. Stop the application
pm2 stop memedeck-ui

# 2. Execute SQL rollbacks in reverse order (3, 2, 1)
psql $DATABASE_URL -f prisma/migrations/rollback_003.sql
psql $DATABASE_URL -f prisma/migrations/rollback_002.sql  
psql $DATABASE_URL -f prisma/migrations/rollback_001.sql

# 3. Revert code changes
git checkout HEAD~1 -- prisma/schema.prisma
git checkout HEAD~1 -- app/api/

# 4. Regenerate client
npx prisma generate

# 5. Restart application
pm2 start memedeck-ui
```

## Data Backup Before Migration

**CRITICAL**: Always backup your database before running migrations:

```bash
# Create backup
pg_dump $DATABASE_URL > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup (if needed)
psql $DATABASE_URL < backup_before_migration_YYYYMMDD_HHMMSS.sql
```

## Testing Rollback Procedures

Test each rollback step on a staging environment first:

1. Apply migration to staging
2. Test rollback procedures
3. Verify data integrity
4. Only then apply to production

## Monitoring During Migration

Watch for these issues during migration:
- Failed foreign key constraint creation
- Data mapping failures
- API endpoint errors
- Authentication failures

## Support Contacts

If rollback fails:
1. Immediately create database backup
2. Document the exact error
3. Stop the application
4. Contact development team with full error logs