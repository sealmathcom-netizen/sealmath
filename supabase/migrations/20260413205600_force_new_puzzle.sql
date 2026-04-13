-- Migration: Update 24-challenge skip logic
-- Adds support for forcing a new puzzle by skipping the current unsolved one

-- Drop old version to allow changing parameters
DROP FUNCTION IF EXISTS public.get_next_puzzle_for_user(UUID);

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
    -- 0. If force_new is true, mark any currently active puzzle as FALSE (skipped/failed)
    IF p_force_new THEN
        UPDATE public.user_puzzles_24
        SET status = FALSE, updated_at = now()
        WHERE user_puzzles_24.user_id = p_user_id AND user_puzzles_24.status IS NULL;
        
        -- Update global stats for the skipped puzzle(s)
        UPDATE public.puzzles_24 
        SET incorrect_count = incorrect_count + 1 
        WHERE id IN (
            SELECT up.puzzle_id 
            FROM public.user_puzzles_24 up 
            WHERE up.user_id = p_user_id AND up.status IS NULL
        );
    END IF;

    -- 1. Get the current active puzzle if exists (status is NULL in user_puzzles_24)
    -- Unless we're forcing a new one, in which case we just skipped it.
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

    -- 2. Find a new puzzle
    SELECT p.id INTO v_next_puzzle_id
    FROM public.puzzles_24 p
    WHERE p.id NOT IN (SELECT up.puzzle_id FROM public.user_puzzles_24 up WHERE up.user_id = p_user_id)
    ORDER BY (p.correct_count + p.incorrect_count) ASC, random()
    LIMIT 1;

    IF v_next_puzzle_id IS NULL THEN
        RETURN;
    END IF;

    -- 3. Calculate next attempt_num and create record in one step
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

    -- Handle case where user has no rows yet (MAX=NULL)
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
