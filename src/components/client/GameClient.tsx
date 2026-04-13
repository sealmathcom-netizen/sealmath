'use client'

import { useMemo, useEffect, useState, useRef, useCallback } from 'react'
import { createSupabaseClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { solve24 } from '../../logic/solve24'
import type { Lang } from '../../i18n/translations'

const supabase = createSupabaseClient()

type Props = {
  lang: Lang
  dict: Record<string, string>
  children?: React.ReactNode
}

const TOTAL_POSSIBLE = 1820

function emptyNumbers() {
  return [NaN, NaN, NaN, NaN] as number[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function formatKey(nums: number[]) {
  return [...nums].sort((a, b) => a - b).join(',')
}

export default function GameClient({ lang, dict, children }: Props) {
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }


  const { user, loading: authLoading } = useAuth()
  const [currentAttempt, setCurrentAttempt] = useState<{
    puzzleId: number;
    numbers: number[];
    attemptNum: number;
    status: boolean | null;
  } | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const isFetchingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)

  const [inputs, setInputs] = useState<number[]>(() => emptyNumbers())
  const [userExpr, setUserExpr] = useState('')

  const [feedback, setFeedback] = useState('')
  const [feedbackColor, setFeedbackColor] = useState<string>('var(--dark)')
  const [resultText, setResultText] = useState('')

  const [showRules24, setShowRules24] = useState(false)
  const [gotoInput, setGotoInput] = useState('')

  const clearSolutionArea = () => {
    setUserExpr('')
    setFeedback('')
    setResultText('')
    setFeedbackColor('var(--dark)')
  }

  const updateFeedback = (m: string, c: string) => {
    setFeedback(m)
    setFeedbackColor(c)
  }

  const fetchPuzzle = useCallback(async (attemptNum?: number, forceNew: boolean = false) => {
    if (!user) {
      setIsLoading(false)
      return
    }
    // Use ref to prevent parallel fetches without affecting useCallback stability
    if (isFetchingRef.current && !forceNew) return 

    isFetchingRef.current = true
    setIsLoading(true)
    try {
      if (attemptNum) {
        // Fetch specific attempt
        const { data } = await supabase
          .from('user_puzzles_24')
          .select('puzzle_id, attempt_num, status, puzzles_24(numbers)')
          .eq('user_id', user.id)
          .eq('attempt_num', attemptNum)
          .maybeSingle()
        
        if (data) {
          const attempt = {
            puzzleId: data.puzzle_id,
            numbers: (data.puzzles_24 as any)?.numbers || [],
            attemptNum: data.attempt_num,
            status: data.status
          }
          setCurrentAttempt(attempt)
          setInputs(attempt.numbers)
          clearSolutionArea()
        }
      } else {
        // Get next/current puzzle
        const { data } = await supabase.rpc('get_next_puzzle_for_user', { 
          p_user_id: user.id,
          p_force_new: forceNew
        })
        if (data && data.length > 0) {
          const d = data[0] as any
          const attempt = {
            puzzleId: d.out_puzzle_id,
            numbers: d.out_numbers,
            attemptNum: d.out_attempt_num,
            status: d.out_status
          }
          setCurrentAttempt(attempt)
          setInputs(attempt.numbers)
          clearSolutionArea()
        }
      }

      // Update total count
      const { count } = await supabase
        .from('user_puzzles_24')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setTotalAttempts(count || 0)

    } catch (err) {
      console.error('Error fetching puzzle:', err)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [user])

  useEffect(() => {
    // Only trigger initial fetch if we are not loading auth AND we don't have an active attempt yet
    if (!authLoading && user && !currentAttempt && !isFetchingRef.current) {
      fetchPuzzle()
    }
  }, [authLoading, user, fetchPuzzle, currentAttempt])

  const submitResult = async (isCorrect: boolean) => {
    if (!user || !currentAttempt) return
    // Only submit if status is currently NULL
    if (currentAttempt.status !== null) return

    try {
      await supabase.rpc('submit_puzzle_result', {
        p_puzzle_id: currentAttempt.puzzleId,
        p_status_bool: isCorrect,
        p_attempt_num: currentAttempt.attemptNum
      })
      // Refresh status locally
      setCurrentAttempt(prev => prev ? { ...prev, status: isCorrect } : null)
    } catch (err) {
      console.error('Error submitting result:', err)
    }
  }

  const handleManualEntry = async () => {
    if (!user) return
    const nums = inputs.filter(n => !Number.isNaN(n))
    if (nums.length !== 4) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_or_create_manual_puzzle', { p_numbers: nums })
      if (data && data.length > 0) {
        const d = data[0]
        if (d.is_solvable) {
          // It's solvable, redirect to that attempt
          await fetchPuzzle(d.attempt_num)
          updateFeedback(t('msg_solution_found_manual'), 'var(--success)')
        } else {
          // Unsolvable, run local check and store
          const sol = solve24(nums)
          if (!sol) {
            await supabase.from('user_unsolvable_24').insert({ user_id: user.id, numbers: nums })
            updateFeedback(t('msg_no_solution_saved'), '#e74c3c')
          }
        }
      }
    } catch (err) {
      console.error('Error in manual entry:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateAttempts = (direction: number, forceNew: boolean = false) => {
    if (!currentAttempt) return
    if (forceNew) {
      fetchPuzzle(undefined, true) // Force next new puzzle
      return
    }
    const nextNum = currentAttempt.attemptNum + direction
    if (nextNum >= 1 && nextNum <= totalAttempts) {
      fetchPuzzle(nextNum)
    }
  }

  const goToPuzzle = () => {
    const num = parseInt(gotoInput)
    if (!isNaN(num) && num >= 1 && num <= totalAttempts) {
      fetchPuzzle(num)
      setGotoInput('')
    }
  }

  const runSolver = () => {
    const inputsHaveNaN = inputs.some(n => Number.isNaN(n))
    if (inputsHaveNaN) return
    const sol = solve24(inputs)
    const solForDisplay = sol && lang === 'he' ? `\u2066${sol}\u2069` : sol
    setResultText(sol ? t('msg_solution_found', { sol: solForDisplay as string }) : t('msg_no_solution'))
    
    // Clicking "Show Answer" always marks as FALSE in first attempt
    if (currentAttempt?.status === null) {
      submitResult(false)
    }
  }

  const checkUserSolution = () => {
    const expr = userExpr
    const inputsHaveNaN = inputs.some(n => Number.isNaN(n))
    if (inputsHaveNaN || !expr.trim()) return

    try {
      if (/[^0-9+\-*/().\s]/.test(expr)) {
        updateFeedback(t('msg_invalid_char'), '#e74c3c')
        return
      }

      let tempExpr = expr
      let allNumsUsed = true
      const sortedInputs = [...inputs].sort((a, b) => b - a)
      for (const n of sortedInputs) {
        const ns = n.toString()
        if (tempExpr.includes(ns)) {
          tempExpr = tempExpr.replace(ns, '')
        } else {
          allNumsUsed = false
          break
        }
      }

      // eslint-disable-next-line no-eval
      const result = eval(expr)

      if (!allNumsUsed) {
        updateFeedback(t('msg_use_all'), '#e74c3c')
      } else if (Math.abs(result - 24) < 0.001) {
        updateFeedback(t('msg_correct'), 'var(--success)')
        if (currentAttempt?.status === null) {
          submitResult(true)
        }
      } else {
        updateFeedback(t('msg_incorrect', { result }), '#e74c3c')
        // We don't mark as FALSE just for one wrong check, 
        // they can keep trying.
      }
    } catch {
      updateFeedback(t('msg_invalid_expr'), '#e74c3c')
    }
  }

  // Helper for circle rendering
  const renderStatusCircle = () => {
    if (!currentAttempt) return null
    if (currentAttempt.status === true || currentAttempt.status === false) {
      return (
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: 'var(--success)',
          marginLeft: 8,
          marginRight: 8,
          display: 'inline-block',
          verticalAlign: 'middle'
        }} />
      )
    }
    return (
      <div style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: '2px solid #bdc3c7',
        marginLeft: 8,
        marginRight: 8,
        display: 'inline-block',
        verticalAlign: 'middle',
        boxSizing: 'border-box'
      }} />
    )
  }

  const backDisabled = !currentAttempt || currentAttempt.attemptNum <= 1
  const nextDisabled = !currentAttempt || currentAttempt.attemptNum >= totalAttempts
  const gotoMax = totalAttempts
  const gotoValid = !isNaN(parseInt(gotoInput)) && parseInt(gotoInput) >= 1 && parseInt(gotoInput) <= totalAttempts
  const puzzleDisplayNum = currentAttempt?.attemptNum || 0
  const puzzleTotalNum = 1362


  return (
    <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span id="puzzle-counter" style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              {t('puzzle_counter', { current: puzzleDisplayNum === 0 ? '?' : puzzleDisplayNum, total: puzzleTotalNum })}
              {renderStatusCircle()}
            </span>
          </div>

          <div className="input-row">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                type="number"
                id={`n${i + 1}`}
                min={1}
                max={13}
                placeholder="?"
                value={Number.isFinite(inputs[i]) ? String(inputs[i]) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  setInputs((prev) => {
                    const next = [...prev]
                    next[i] = v === '' ? NaN : parseFloat(v)
                    return next
                  })
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-generate" onClick={() => navigateAttempts(1, true)} disabled={isLoading}>
              {t('btn_new')}
            </button>
            <button className="btn-solve" onClick={runSolver} disabled={isLoading}>{t('btn_show_ans')}</button>

            <button
              id="btn-manual-add"
              className="btn-solve"
              style={{
                backgroundColor: 'var(--blue)',
                color: 'var(--dark)',
                display: 'inline-block',
              }}
              onClick={handleManualEntry}
              disabled={isLoading}
            >
              {t('btn_set_numbers')}
            </button>

            <button className="btn-solve btn-rules" onClick={() => setShowRules24((s) => !s)}>
              {t('btn_rules')}
            </button>
          </div>

          {showRules24 && (
            <div id="rules-24" className="rules-box" style={{ display: 'block' }}>
              <h3>{t('rules_title_24')}</h3>
              <div
                id="rules-text-24"
                className="rules-content"
                dangerouslySetInnerHTML={{
                  __html: (t('rules_text_24') || '').replace(/\n/g, '<br>'),
                }}
              />
            </div>
          )}

          <div className="nav-controls">
            <button
              id="btn-back"
              className="btn-nav"
              onClick={() => navigateAttempts(-1)}
              disabled={backDisabled || isLoading}
              dangerouslySetInnerHTML={{ __html: t('btn_back') }}
            />
            <button
              id="btn-next"
              className="btn-nav"
              onClick={() => navigateAttempts(1)}
              disabled={nextDisabled || isLoading}
              dangerouslySetInnerHTML={{ __html: t('btn_next') }}
            />
          </div>

          <div
            id="goto-section"
            style={{
              display: totalAttempts >= 5 ? 'flex' : 'none',
              marginTop: 15,
              justifyContent: 'center',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <div className="input-with-prefix" style={{ width: 120, height: 40, borderRadius: 8 }}>
              <span>#</span>
              <input
                type="number"
                id="goto-input"
                min={1}
                max={gotoMax}
                value={gotoInput}
                onChange={(e) => setGotoInput(e.target.value)}
              />
            </div>
            <button
              id="btn-goto"
              className={`btn-nav ${gotoValid ? 'btn-goto-highlight' : ''}`}
              onClick={goToPuzzle}
              disabled={!gotoValid || isLoading}
              style={{ width: 120, height: 40, padding: 0, margin: 0, whiteSpace: 'nowrap' }}
            >
              {t('btn_go')}
            </button>
          </div>

          <div className="solution-section">
            <input
              type="text"
              id="userExpr"
              placeholder={t('ph_expr')}
              value={userExpr}
              onChange={(e) => setUserExpr(e.target.value)}
              onInput={(e) => {
                const target = e.currentTarget
                target.value = target.value.replace(/[^0-9+\-*/().\s]/g, '')
              }}
              style={{ textAlign: 'left' }}
            />
            <button className="btn-check" onClick={checkUserSolution}>
              {t('btn_check')}
            </button>
            <div id="feedback" style={{ marginTop: 10, fontWeight: 'bold', color: feedbackColor }}>
              {feedback}
            </div>
          </div>

          <div id="result" style={{ marginTop: 15, fontWeight: 'bold' }}>
            {resultText}
          </div>
    </>
  )
}

