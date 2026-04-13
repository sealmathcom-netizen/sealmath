-- Migration: Cleanup and Harden 24-challenge
-- 1. Wipe the corrupted test progress to allow adding the constraint
TRUNCATE TABLE public.user_puzzles_24;

-- 2. Apply the missing unique constraint
-- This prevents concurrent requests from creating duplicate attempt numbers
ALTER TABLE public.user_puzzles_24 
DROP CONSTRAINT IF EXISTS user_puzzles_24_user_id_attempt_num_key;

ALTER TABLE public.user_puzzles_24 
ADD CONSTRAINT user_puzzles_24_user_id_attempt_num_key UNIQUE (user_id, attempt_num);

-- 3. Ensure the RPC function is the latest version (with race condition protection)
CREATE OR REPLACE FUNCTION public.get_next_puzzle_for_user(p_user_id UUID)
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
    -- 1. Get the current active puzzle if exists (status is NULL in user_puzzles_24)
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

    -- 3. Calculate next attempt_num and create record in one step to minimize race window
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
