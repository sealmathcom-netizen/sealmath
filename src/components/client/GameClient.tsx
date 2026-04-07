'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { solve24 } from '../../logic/solve24'
import type { Lang } from '../../i18n/translations'

type Props = {
  lang: Lang
  dict: Record<string, string>
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

export default function GameClient({ lang, dict }: Props) {
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }

  const [storageAllowed, setStorageAllowed] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('storageAllowed')
    if (raw !== null) setStorageAllowed(raw === 'true')

    const listener = () => {
      const updated = localStorage.getItem('storageAllowed')
      if (updated !== null) setStorageAllowed(updated === 'true')
    }
    window.addEventListener('storage-allowed-changed', listener)
    return () => window.removeEventListener('storage-allowed-changed', listener)
  }, [])

  const solvableHistoryRef = useRef<string[]>([])
  const unsolvableHistoryRef = useRef<string[]>([])
  const checkedCombinationsRef = useRef<Set<string>>(new Set())

  const [inputs, setInputs] = useState<number[]>(() => emptyNumbers())
  const [userExpr, setUserExpr] = useState('')

  const [feedback, setFeedback] = useState('')
  const [feedbackColor, setFeedbackColor] = useState<string>('var(--dark)')
  const [resultText, setResultText] = useState('')

  const [solvableHistory, setSolvableHistory] = useState<string[]>([])
  const [unsolvableHistory, setUnsolvableHistory] = useState<string[]>([])

  // The legacy app always keeps showingUnsolvable = false (no UI to toggle).
  const [showingUnsolvable] = useState(false)
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1)

  const [gotoInput, setGotoInput] = useState('')
  const [showRules24, setShowRules24] = useState(false)

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

  // Load / reset history based on storageAllowed.
  useEffect(() => {
    const solv = storageAllowed ? JSON.parse(localStorage.getItem('solvableHistory') || '[]') : []
    const unsolv = storageAllowed ? JSON.parse(localStorage.getItem('unsolvableHistory') || '[]') : []

    solvableHistoryRef.current = solv
    unsolvableHistoryRef.current = unsolv
    setSolvableHistory(solv)
    setUnsolvableHistory(unsolv)

    checkedCombinationsRef.current = new Set()

    if (solv.length > 0) {
      const savedIndexRaw = localStorage.getItem('lastViewedIndex')
      let idx = solv.length - 1
      const savedIndex = savedIndexRaw !== null ? parseInt(savedIndexRaw) : null
      if (savedIndex !== null && !isNaN(savedIndex) && savedIndex >= 0 && savedIndex < solv.length) idx = savedIndex

      setCurrentHistoryIndex(idx)
      const nums = solv[idx].split(',').map(Number)
      setInputs(nums)
      clearSolutionArea()
    } else {
      setCurrentHistoryIndex(-1)
      setInputs(emptyNumbers())
      clearSolutionArea()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageAllowed])

  const activeList = showingUnsolvable ? unsolvableHistory : solvableHistory
  const activeListLength = activeList.length

  const backDisabled = activeListLength === 0 || currentHistoryIndex <= 0
  const nextDisabled = activeListLength === 0 || currentHistoryIndex >= activeListLength - 1

  const gotoVisible = activeListLength >= 5
  const gotoMax = activeListLength
  const gotoParsed = parseInt(gotoInput)
  const gotoValid = gotoVisible && !isNaN(gotoParsed) && gotoParsed >= 1 && gotoParsed <= gotoMax

  const puzzleCounter = activeListLength === 0 ? t('puzzle_counter', { current: 0, total: 0 }) : t('puzzle_counter', { current: currentHistoryIndex + 1, total: activeListLength })

  const inputsHaveNaN = inputs.some((v) => Number.isNaN(v))
  const addToHistoryVisible = useMemo(() => {
    if (inputsHaveNaN) return false
    const nums = inputs
    const key = formatKey(nums)
    const isSolvable = solve24(nums) !== null
    const list = isSolvable ? solvableHistory : unsolvableHistory
    return !list.includes(key)
  }, [inputsHaveNaN, inputs, solvableHistory, unsolvableHistory])

  const registerPuzzle = (nums: number[]) => {
    if (nums.some((v) => Number.isNaN(v))) return

    const key = formatKey(nums)
    const isSolvable = solve24(nums) !== null

    if (isSolvable) {
      if (!solvableHistoryRef.current.includes(key)) {
        const next = [...solvableHistoryRef.current, key]
        solvableHistoryRef.current = next
        setSolvableHistory(next)
        if (storageAllowed) localStorage.setItem('solvableHistory', JSON.stringify(next))
        if (!showingUnsolvable) setCurrentHistoryIndex(next.length - 1)
      }
    } else {
      if (!unsolvableHistoryRef.current.includes(key)) {
        const next = [...unsolvableHistoryRef.current, key]
        unsolvableHistoryRef.current = next
        setUnsolvableHistory(next)
        if (storageAllowed) localStorage.setItem('unsolvableHistory', JSON.stringify(next))
      }
    }
  }

  const navigateHistory = (direction: number) => {
    if (activeListLength === 0) return
    const nextIndex = clamp(currentHistoryIndex + direction, 0, activeListLength - 1)
    setCurrentHistoryIndex(nextIndex)
    const nums = activeList[nextIndex].split(',').map(Number)
    setInputs(nums)
    clearSolutionArea()
    if (storageAllowed && !showingUnsolvable) {
      localStorage.setItem('lastViewedIndex', String(nextIndex))
    }
  }

  const goToPuzzle = () => {
    if (!gotoValid) {
      updateFeedback(t('msg_enter_between', { max: activeListLength }), '#e74c3c')
      return
    }
    const nextIndex = gotoParsed - 1
    setCurrentHistoryIndex(nextIndex)
    const nums = activeList[nextIndex].split(',').map(Number)
    setInputs(nums)
    clearSolutionArea()
    setGotoInput('')
    if (storageAllowed && !showingUnsolvable) {
      localStorage.setItem('lastViewedIndex', String(nextIndex))
    }
  }

  const runSolver = () => {
    if (inputsHaveNaN) return
    const sol = solve24(inputs)
    const solForDisplay = sol && lang === 'he' ? `\u2066${sol}\u2069` : sol
    setResultText(sol ? t('msg_solution_found', { sol: solForDisplay as string }) : t('msg_no_solution'))
    registerPuzzle(inputs)
  }

  const checkUserSolution = () => {
    const expr = userExpr
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
      } else {
        updateFeedback(t('msg_incorrect', { result }), '#e74c3c')
      }
    } catch {
      updateFeedback(t('msg_invalid_expr'), '#e74c3c')
    }
  }

  const manualRegister = () => {
    if (inputsHaveNaN) return
    registerPuzzle(inputs)
    updateFeedback(t('msg_saved'), '#27ae60')
  }

  const generateSolvable = (updateUI: boolean) => {
    if (checkedCombinationsRef.current.size >= TOTAL_POSSIBLE) {
      if (updateUI) updateFeedback(t('msg_all_checked'), 'var(--accent)')
      return
    }

    let randomNums: number[] = []
    let key = ''
    let isSolvable = false
    let attempts = 0

    do {
      isSolvable = false
      randomNums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1)
      key = formatKey(randomNums)

      if (!checkedCombinationsRef.current.has(key)) {
        const solution = solve24(randomNums)
        checkedCombinationsRef.current.add(key)
        if (solution) isSolvable = true
        else if (!unsolvableHistoryRef.current.includes(key)) {
          unsolvableHistoryRef.current = [...unsolvableHistoryRef.current, key]
        }
      } else {
        isSolvable = solvableHistoryRef.current.includes(key)
      }

      attempts++
    } while ((!isSolvable || solvableHistoryRef.current.includes(key)) && attempts < 5000)

    if (isSolvable && !solvableHistoryRef.current.includes(key)) {
      if (updateUI) {
        setInputs(randomNums)
        registerPuzzle(randomNums)
        clearSolutionArea()
      } else {
        const next = [...solvableHistoryRef.current, key]
        solvableHistoryRef.current = next
        if (storageAllowed) localStorage.setItem('solvableHistory', JSON.stringify(next))
      }
    } else if (updateUI) {
      updateFeedback(t('msg_not_found'), '#e74c3c')
    }
  }

  const generateAll = () => {
    const initialCount = solvableHistoryRef.current.length
    for (let i = 0; i < TOTAL_POSSIBLE; i++) {
      generateSolvable(false)
    }
    const generatedCount = solvableHistoryRef.current.length - initialCount
    updateFeedback(t('msg_gen_success', { count: generatedCount }), 'var(--success)')
    setSolvableHistory([...solvableHistoryRef.current])
    // Keep current index in-range.
    setCurrentHistoryIndex((idx) => {
      if (solvableHistoryRef.current.length === 0) return -1
      return clamp(idx, 0, solvableHistoryRef.current.length - 1)
    })
  }

  useEffect(() => {
    const handleClear = () => {
      checkedCombinationsRef.current.clear()
      solvableHistoryRef.current = []
      unsolvableHistoryRef.current = []
      setSolvableHistory([])
      setUnsolvableHistory([])
      setCurrentHistoryIndex(-1)
      setInputs(emptyNumbers())
      clearSolutionArea()
      updateFeedback(t('msg_hist_cleared'), '#e74c3c')
    }
    window.addEventListener('clear-history', handleClear)
    return () => window.removeEventListener('clear-history', handleClear)
  }, [t])

  return (
    <section id="game-page" className="page active" style={{ display: 'block' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('game_title')}</h1>
            <span id="puzzle-counter" style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold' }}>
              {puzzleCounter}
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
            <button className="btn-generate" onClick={() => generateSolvable(true)}>{t('btn_new')}</button>
            <button className="btn-generate" onClick={generateAll} style={{ backgroundColor: 'var(--accent)' }}>
              {t('btn_gen_all')}
            </button>
            <button className="btn-solve" onClick={runSolver}>{t('btn_show_ans')}</button>

            <button
              id="btn-manual-add"
              className="btn-solve"
              style={{
                backgroundColor: 'var(--blue)',
                color: 'var(--dark)',
                opacity: addToHistoryVisible ? 0.5 : 0.5,
                display: addToHistoryVisible ? 'inline-block' : 'none',
              }}
              onClick={manualRegister}
              disabled={!addToHistoryVisible}
            >
              {t('btn_add_hist')}
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
              onClick={() => navigateHistory(-1)}
              disabled={backDisabled}
              dangerouslySetInnerHTML={{ __html: t('btn_back') }}
            />
            <button
              id="btn-next"
              className="btn-nav"
              onClick={() => navigateHistory(1)}
              disabled={nextDisabled}
              dangerouslySetInnerHTML={{ __html: t('btn_next') }}
            />
          </div>

          <div
            id="goto-section"
            style={{
              display: gotoVisible ? 'flex' : 'none',
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
              disabled={!gotoValid}
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
        </div>
      </section>
  )
}

