'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePersistentState } from '../../hooks/usePersistentState'
import {
  type Frac,
  calculateFrac,
  findSolution,
  generateNewGame,
} from '../../logic/fractionCapture'
import type { Lang } from '../../i18n/translations'

type Props = {
  lang: Lang
  dict: Record<string, string>
  children?: React.ReactNode
}

function FracView({ f }: { f: Frac }) {
  return (
    <div className="frac">
      <span className="n">{f.n}</span>
      <span className="d">{f.d}</span>
    </div>
  )
}

export default function CaptureClient({ lang, dict, children }: Props) {
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }


  const [gameState, setGameState, loading] = usePersistentState<{
    target: Frac;
    ingredients: Frac[];
    gameOver: boolean;
  }>('captureGameState', {
    target: { n: 0, d: 1 },
    ingredients: [],
    gameOver: false
  })

  // Destructure for easy access
  const { target: captureTarget, ingredients: captureIngredients, gameOver: captureGameOver } = gameState

  const [feedback, setFeedback] = useState('')
  const [feedbackColor, setFeedbackColor] = useState('var(--dark)')

  const [showRulesCapture, setShowRulesCapture] = useState(false)
  const [selectedIngIndices, setSelectedIngIndices] = useState<number[]>([])
  const [selectedCaptureOp, setSelectedCaptureOp] = useState<string | null>(null)

  const checkCaptureWin = (nextSelected: number[], op: string | null) => {
    if (nextSelected.length !== 2 || !op) return
    if (!captureIngredients[nextSelected[0]] || !captureIngredients[nextSelected[1]]) return

    const f1 = captureIngredients[nextSelected[0]]
    const f2 = captureIngredients[nextSelected[1]]

    const res1 = calculateFrac(f1, f2, op)
    const res2 = calculateFrac(f2, f1, op)

    if (
      (res1.n === captureTarget.n && res1.d === captureTarget.d) ||
      (res2.n === captureTarget.n && res2.d === captureTarget.d)
    ) {
      setGameState(prev => ({ ...prev, gameOver: true }))
      setFeedback(t('msg_correct'))
      setFeedbackColor('var(--success)')
    } else {
      setFeedback(t('msg_incorrect', { result: '' }).replace('{result}', ''))
      setFeedbackColor('var(--error)')
    }
  }

  const initFractionCapture = () => {
    setSelectedIngIndices([])
    setSelectedCaptureOp(null)
    setFeedback('')
    setFeedbackColor('var(--dark)')

    const { target, ingredients } = generateNewGame()
    setGameState({
      target,
      ingredients,
      gameOver: false
    })
  }

  // Use effect once on mount to handle initial generation if empty
  useEffect(() => {
    if (!loading && captureIngredients.length === 0) {
      initFractionCapture()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const selectIng = (index: number) => {
    if (captureGameOver) return

    setFeedback('')
    const pos = selectedIngIndices.indexOf(index)
    let next: number[]
    if (pos > -1) {
      next = selectedIngIndices.filter((x) => x !== index)
    } else {
      if (selectedIngIndices.length < 2) next = [...selectedIngIndices, index]
      else next = [index]
    }

    setSelectedIngIndices(next)
    checkCaptureWin(next, selectedCaptureOp)
  }

  const selectOp = (op: string) => {
    if (captureGameOver) return
    setFeedback('')
    setSelectedCaptureOp(op)
    checkCaptureWin(selectedIngIndices, op)
  }

  const preview = useMemo(() => {
    if (selectedIngIndices.length === 0) return null
    const f1 = captureIngredients[selectedIngIndices[0]]
    const f2 = selectedIngIndices.length > 1 ? captureIngredients[selectedIngIndices[1]] : null
    const op = selectedCaptureOp || '?'
    if (!f1) return null

    const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op

    if (f2) {
      const res = calculateFrac(f1, f2, selectedCaptureOp || '+')
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <FracView f={f1} />
          <span style={{ margin: '0 10px', fontSize: '1.4rem', lineHeight: 1 }}>{opSymbol}</span>
          <FracView f={f2} />
          <span>=</span>
          <FracView f={res} />
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <FracView f={f1} />
        <span style={{ margin: '0 10px', fontSize: '1.4rem', lineHeight: 1 }}>{opSymbol}</span>
        <span style={{ opacity: 0.3 }}>?</span>
      </div>
    )
  }, [captureIngredients, selectedCaptureOp, selectedIngIndices])

  const showFractionSolution = () => {
    const solStr = findSolution(captureIngredients, captureTarget)
    if (!solStr) return
    const solForDisplay = lang === 'he' ? `\u2066${solStr}\u2069` : solStr
    setFeedback(t('msg_sol_is', { sol: solForDisplay }))
    setFeedbackColor('var(--accent)')
  }

  return (
    <section id="capture-page" className="page active">
        <div className="container">
          {children}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
            <button
              className="btn-solve btn-rules"
              style={{ margin: 0, padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => setShowRulesCapture((s) => !s)}
            >
              {t('btn_rules')}
            </button>
          </div>

          {showRulesCapture && (
            <div id="rules-capture" className="rules-box" style={{ display: 'block' }}>
              <h3>{t('rules_title_capture')}</h3>
              <div
                id="rules-text-capture"
                className="rules-content"
                dangerouslySetInnerHTML={{
                  __html: (t('rules_text_capture') || '').replace(/\n/g, '<br>'),
                }}
              />
            </div>
          )}

          <div id="pot-display" className={`pot-container ${captureGameOver ? 'sealed' : ''}`}>
            <div className="victory-cork" />
            <div className="pot-rim" />
            <div className="pot-neck" />
            <div className="pot-body">
              <div id="target-fraction" className="pot-label">
                {captureTarget.n ? <FracView f={captureTarget} /> : null}
              </div>
            </div>
          </div>

          <div
            id="expr-preview"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 15,
              margin: '15px 0',
              fontSize: '1.4rem',
              minHeight: 48,
              fontWeight: 'bold',
              color: 'var(--accent)',
            }}
          >
            {preview}
          </div>

          <div id="fraction-board" className="fraction-board">
            <div id="ing-slot-0">
              {captureIngredients[0] ? (
                <div
                  className={`cork-tile ${selectedIngIndices.includes(0) ? 'selected' : ''}`}
                  onClick={() => selectIng(0)}
                >
                  <FracView f={captureIngredients[0]} />
                </div>
              ) : null}
            </div>

            <button
              id="op-add"
              className={`op-btn ${selectedCaptureOp === '+' ? 'selected' : ''}`}
              onClick={() => selectOp('+')}
            >
              +
            </button>

            <button
              id="op-sub"
              className={`op-btn ${selectedCaptureOp === '-' ? 'selected' : ''}`}
              onClick={() => selectOp('-')}
            >
              -
            </button>

            <div id="ing-slot-2">
              {captureIngredients[2] ? (
                <div
                  className={`cork-tile ${selectedIngIndices.includes(2) ? 'selected' : ''}`}
                  onClick={() => selectIng(2)}
                >
                  <FracView f={captureIngredients[2]} />
                </div>
              ) : null}
            </div>

            <div id="ing-slot-1">
              {captureIngredients[1] ? (
                <div
                  className={`cork-tile ${selectedIngIndices.includes(1) ? 'selected' : ''}`}
                  onClick={() => selectIng(1)}
                >
                  <FracView f={captureIngredients[1]} />
                </div>
              ) : null}
            </div>

            <button
              id="op-mul"
              className={`op-btn ${selectedCaptureOp === '*' ? 'selected' : ''}`}
              onClick={() => selectOp('*')}
            >
              &times;
            </button>

            <button
              id="op-div"
              className={`op-btn ${selectedCaptureOp === '/' ? 'selected' : ''}`}
              onClick={() => selectOp('/')}
            >
              &divide;
            </button>

            <div id="ing-slot-3">
              {captureIngredients[3] ? (
                <div
                  className={`cork-tile ${selectedIngIndices.includes(3) ? 'selected' : ''}`}
                  onClick={() => selectIng(3)}
                >
                  <FracView f={captureIngredients[3]} />
                </div>
              ) : null}
            </div>
          </div>

          <div id="capture-feedback" style={{ marginTop: 20, fontWeight: 'bold', minHeight: 24, color: feedbackColor }}>
            {feedback}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              className="btn-generate"
              onClick={initFractionCapture}
              style={{ flex: 2, backgroundColor: 'var(--success)' }}
            >
              {t('btn_new_capture')}
            </button>
            <button
              className="btn-solve"
              onClick={showFractionSolution}
              style={{
                flex: 1,
                border: '2px solid var(--accent)',
                background: 'transparent',
                color: 'var(--accent)',
              }}
            >
              {t('btn_show_sol')}
            </button>
          </div>
        </div>
      </section>
  )
}

