-- Migration: Unambiguous RPC Naming
-- Renames output variables to prevent "column reference is ambiguous" errors

DROP FUNCTION IF EXISTS public.get_next_puzzle_for_user(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_next_puzzle_for_user(p_user_id UUID, p_force_new BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
    out_puzzle_id INTEGER,
    out_numbers INTEGER[],
    out_attempt_num INTEGER,
    out_status BOOLEAN
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
        UPDATE public.puzzles_24 
        SET incorrect_count = incorrect_count + 1 
        WHERE id IN (
            SELECT up.puzzle_id 
            FROM public.user_puzzles_24 up 
            WHERE up.user_id = p_user_id AND up.status IS NULL
        );

        UPDATE public.user_puzzles_24
        SET status = FALSE, updated_at = now()
        WHERE user_puzzles_24.user_id = p_user_id AND user_puzzles_24.status IS NULL;
    END IF;

    -- 1. Get current active puzzle
    SELECT up.puzzle_id, up.attempt_num, up.status 
    INTO out_puzzle_id, out_attempt_num, out_status
    FROM public.user_puzzles_24 up
    WHERE up.user_id = p_user_id AND up.status IS NULL
    ORDER BY up.attempt_num DESC
    LIMIT 1;

    IF FOUND THEN
        SELECT p.numbers INTO out_numbers FROM public.puzzles_24 p WHERE p.id = out_puzzle_id;
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
    RETURNING user_puzzles_24.puzzle_id, user_puzzles_24.attempt_num INTO out_puzzle_id, out_attempt_num;

    -- Fallback for new user
    IF out_attempt_num IS NULL THEN
       INSERT INTO public.user_puzzles_24 (user_id, puzzle_id, attempt_num, status)
       VALUES (p_user_id, v_next_puzzle_id, 1, NULL)
       RETURNING user_puzzles_24.puzzle_id, user_puzzles_24.attempt_num INTO out_puzzle_id, out_attempt_num;
    END IF;

    SELECT p.numbers INTO out_numbers FROM public.puzzles_24 p WHERE p.id = out_puzzle_id;
    out_status := NULL;
    
    RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_puzzle_for_user(UUID, BOOLEAN) TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';
