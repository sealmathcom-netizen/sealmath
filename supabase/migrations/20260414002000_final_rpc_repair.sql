-- Migration: Final RPC Signature Repair
-- This migration explicitly clears all overloaded versions of the game functions
-- to resolve 400 Bad Request errors caused by signature ambiguity.

-- 1. Drop ALL versions of get_next_puzzle_for_user
DROP FUNCTION IF EXISTS public.get_next_puzzle_for_user(UUID);
DROP FUNCTION IF EXISTS public.get_next_puzzle_for_user(UUID, BOOLEAN);

-- 2. Drop submission function just in case of overload
DROP FUNCTION IF EXISTS public.submit_puzzle_result(INTEGER, BOOLEAN);

-- 3. Re-create the definitive get_next_puzzle_for_user
CREATE OR REPLACE FUNCTION public.get_next_puzzle_for_user(p_user_id UUID, p_force_new BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
    puzzle_id INTEGER,
    numbers INTEGER[],
    attempt_num INTEGER,
    status BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_puzzle_id INTEGER;
BEGIN
    -- Handle 'Force New' request
    IF p_force_new THEN
        -- Mark current active as FALSE before counting global stats
        WITH current_pending AS (
            SELECT up.puzzle_id 
            FROM public.user_puzzles_24 up 
            WHERE up.user_id = p_user_id AND up.status IS NULL
        )
        UPDATE public.puzzles_24 
        SET incorrect_count = incorrect_count + 1 
        WHERE id IN (SELECT puzzle_id FROM current_pending);

        UPDATE public.user_puzzles_24
        SET status = FALSE, updated_at = now()
        WHERE user_puzzles_24.user_id = p_user_id AND user_puzzles_24.status IS NULL;
    END IF;

    -- 1. Get current active puzzle
    SELECT up.puzzle_id, up.attempt_num, up.status 
    INTO puzzle_id, attempt_num, status
    FROM public.user_puzzles_24 up
    WHERE up.user_id = p_user_id AND up.status IS NULL
    ORDER BY up.attempt_num DESC
    LIMIT 1;

    IF FOUND THEN
        SELECT p.numbers INTO numbers FROM public.puzzles_24 p WHERE p.id = puzzle_id;
        RETURN NEXT;
        RETURN;
    END IF;

    -- 2. Find new puzzle
    SELECT p.id INTO v_next_puzzle_id
    FROM public.puzzles_24 p
    WHERE p.id NOT IN (SELECT up.puzzle_id FROM public.user_puzzles_24 up WHERE up.user_id = p_user_id)
    ORDER BY (p.correct_count + p.incorrect_count) ASC, random()
    LIMIT 1;

    IF v_next_puzzle_id IS NULL THEN
        RETURN;
    END IF;

    -- 3. Create attempt record
    INSERT INTO public.user_puzzles_24 (user_id, puzzle_id, attempt_num, status)
    SELECT 
        p_user_id, 
        v_next_puzzle_id, 
        COALESCE(MAX(up.attempt_num), 0) + 1, 
        NULL
    FROM public.user_puzzles_24 up
    WHERE up.user_id = p_user_id
    ON CONFLICT (user_id, puzzle_id) DO NOTHING
    RETURNING user_puzzles_24.puzzle_id, user_puzzles_24.attempt_num INTO puzzle_id, attempt_num;

    -- Fallback for new user
    IF attempt_num IS NULL THEN
       INSERT INTO public.user_puzzles_24 (user_id, puzzle_id, attempt_num, status)
       VALUES (p_user_id, v_next_puzzle_id, 1, NULL)
       RETURNING user_puzzles_24.puzzle_id, user_puzzles_24.attempt_num INTO puzzle_id, attempt_num;
    END IF;

    SELECT p.numbers INTO numbers FROM public.puzzles_24 p WHERE p.id = puzzle_id;
    status := NULL;
    
    RETURN NEXT;
END;
$$;

-- 4. Re-grant permissions to the clean signatures
GRANT EXECUTE ON FUNCTION public.get_next_puzzle_for_user(UUID, BOOLEAN) TO authenticated, anon, service_role;

-- 5. Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
