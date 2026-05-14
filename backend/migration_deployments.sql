-- ============================================================
-- DEPLOYMENTS TABLE -- Schema Migration for Persistence Fix
-- Run ALL of this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add tracking_id column (text, unique) for our string IDs
ALTER TABLE public.deployments 
    ADD COLUMN IF NOT EXISTS tracking_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_deployments_tracking_id 
    ON public.deployments(tracking_id) 
    WHERE tracking_id IS NOT NULL;

-- Step 2: Fix user_id column type (UUID -> text so 'dev-user' works)
-- Only run if user_id is currently UUID type:
ALTER TABLE public.deployments 
    ALTER COLUMN user_id TYPE text USING user_id::text;

-- Step 3: Verify the schema looks correct
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deployments'
ORDER BY ordinal_position;

-- ============================================================
-- After running above SQL, restart the backend server.
-- All new deployments will now persist to Supabase.
-- ============================================================
