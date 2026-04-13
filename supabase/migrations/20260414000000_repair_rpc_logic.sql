-- Migration: Repair 24-challenge RPC logic
-- Fixes the statistics update order and improves robustness

DROP FUNCTION IF EXISTS public.get_next_puzzle_for_user(UUID, BOOLEAN);

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
    -- 0. Handle 'Force New' request
    IF p_force_new THEN
        -- IMPORTANT: Update global stats FIRST before marking status as FALSE
        UPDATE public.puzzles_24 
        SET incorrect_count = incorrect_count + 1 
        WHERE id IN (
            SELECT up.puzzle_id 
            FROM public.user_puzzles_24 up 
            WHERE up.user_id = p_user_id AND up.status IS NULL
        );

        -- Then mark any currently active puzzle as FALSE (skipped)
        UPDATE public.user_puzzles_24
        SET status = FALSE, updated_at = now()
        WHERE user_puzzles_24.user_id = p_user_id AND user_puzzles_24.status IS NULL;
    END IF;

    -- 1. Get the current active puzzle if exists
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

    -- 2. Find a new puzzle (prioritizing least played)
    SELECT p.id INTO v_next_puzzle_id
    FROM public.puzzles_24 p
    WHERE p.id NOT IN (SELECT up.puzzle_id FROM public.user_puzzles_24 up WHERE up.user_id = p_user_id)
    ORDER BY (p.correct_count + p.incorrect_count) ASC, random()
    LIMIT 1;

    IF v_next_puzzle_id IS NULL THEN
        RETURN;
    END IF;

    -- 3. Create new attempt record
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

    -- Fallback for first-ever puzzle
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
