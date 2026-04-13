-- Migration: Fix Function Permissions
-- Ensures that the Supabase API (PostgREST) has permission to execute the updated functions

-- 1. Grant execute on the updated get_next_puzzle_for_user (UUID, BOOLEAN)
GRANT EXECUTE ON FUNCTION public.get_next_puzzle_for_user(UUID, BOOLEAN) TO authenticated, anon, service_role;

-- 2. Ensure other key functions have correct permissions for their latest signatures
GRANT EXECUTE ON FUNCTION public.submit_puzzle_result(INTEGER, BOOLEAN) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_manual_puzzle(INTEGER[]) TO authenticated, anon, service_role;

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
