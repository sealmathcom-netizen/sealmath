-- Migration: Fix Submit Upsert
-- Replaces the simple UPDATE with an UPSERT to ensure puzzle results are saved
-- even for puzzles that haven't been visited before in the history.

-- 1. Drop the old 2-argument version
DROP FUNCTION IF EXISTS public.submit_puzzle_result(INTEGER, BOOLEAN);

-- 2. Create the new 3-argument version with UPSERT logic
CREATE OR REPLACE FUNCTION public.submit_puzzle_result(
    p_puzzle_id INTEGER, 
    p_status_bool BOOLEAN,
    p_attempt_num INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Perform UPSERT into user_puzzles_24
    INSERT INTO public.user_puzzles_24 (user_id, puzzle_id, attempt_num, status)
    VALUES (v_user_id, p_puzzle_id, p_attempt_num, p_status_bool)
    ON CONFLICT (user_id, puzzle_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = now()
    WHERE user_puzzles_24.status IS NULL; -- Only allow updating from NULL to a result

    -- Update global statistics if the insert/update affected a row (meaning it wasn't already solved)
    IF FOUND THEN
        IF p_status_bool THEN
            UPDATE public.puzzles_24 SET correct_count = correct_count + 1 WHERE id = p_puzzle_id;
        ELSE
            UPDATE public.puzzles_24 SET incorrect_count = incorrect_count + 1 WHERE id = p_puzzle_id;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_puzzle_result(INTEGER, BOOLEAN, INTEGER) TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';
