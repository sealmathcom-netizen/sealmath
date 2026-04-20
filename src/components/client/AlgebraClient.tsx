'use client'

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useSessionState } from '../../hooks/useSessionState';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MathInput from '../common/MathInput';
import type { Lang } from '../../i18n/translations';
import { logToAxiom } from '../../utils/logger';
import { playSound } from '../../utils/audio';
import * as MathEngine from '../../utils/math/evaluators';
import * as MathGen from '../../utils/math/generators';

const generateExerciseId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

const getIsMac = () => {
  if (typeof window === 'undefined') return false;
  return navigator.userAgent.includes('Mac');
};

const NEXT_PROBLEM_DELAY_MS = 700;

const emptyFn = () => { };

const _isMac = getIsMac();
const _addLabel = _isMac ? '⌘=' : 'Ctrl+=';
const _removeLabel = _isMac ? '⌘-' : 'Ctrl+-';
const _solLabel = _isMac ? '⌘/' : 'Ctrl+/';
const _exLabel = _isMac ? '⌘E' : 'Ctrl+E';

function WithTooltip({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <div className="algebra-add-step-wrapper" style={{ display: 'inline-flex', alignItems: 'stretch' }}>
      {children}
      <span className="algebra-kbd-tooltip" suppressHydrationWarning>{tip}</span>
    </div>
  );
}
function QuestionDisplay({ q, fontSize = '2rem' }: { q: string, fontSize?: string }) {
  const isMath = q.includes('\\') || q.includes('{');
  const mfRef = useRef<any>(null);

  useEffect(() => {
    if (mfRef.current && isMath) {
      mfRef.current.value = q;
    }
  }, [q, isMath]);

  if (!q) return null;

  if (isMath) {
    return (
      <div className="math-display-wrap" style={{ display: 'inline-flex', justifyContent: 'center', pointerEvents: 'none', minHeight: '1.2em' }}>
        <math-field 
          ref={mfRef}
          read-only 
          style={{ border: 'none', background: 'transparent', fontSize, color: 'var(--foreground, #2c3e50)' }}
          dangerouslySetInnerHTML={{ __html: q }}
        />
        {/* Hidden text for accessibility and E2E testing (.innerText compatibility) */}
        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          {q}
        </span>
      </div>
    );
  }
  return <span style={{ direction: 'ltr', fontSize, display: 'inline-block', color: 'var(--foreground, #2c3e50)' }}>{q}</span>;
}

type Props = {
  lang: Lang;
  dict: Record<string, string>;
  children?: React.ReactNode;
};

// --- Helpers ---

function SectionHeader({ title, showExample, onToggleExample, t }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', gap: '20px' }}>
      <h2 style={{ color: '#8a4a1a', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '1.7rem', fontWeight: 'bold', flex: 1, margin: 0 }}>
        {title}
      </h2>
      {onToggleExample && (
        <WithTooltip tip={_exLabel}>
          <button
            id="btn-toggle-examples"
            data-testid="btn-toggle-examples"
            onClick={onToggleExample}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              width: 'fit-content',
              margin: 0
            }}
          >
            {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
          </button>
        </WithTooltip>
      )}
    </div>
  );
}

function ActionButton({ label, onClick, id, style, 'data-testid': testId, isSolutionShown }: { label: string; onClick: () => void; id?: string; style?: React.CSSProperties; 'data-testid'?: string; isSolutionShown?: boolean }) {
  return (
    <div className="algebra-add-step-wrapper">
      <button 
        className="btn-check" 
        onClick={onClick} 
        id={id} 
        style={{
          ...style,
          background: isSolutionShown ? 'var(--accent)' : '#27ae60',
          transition: 'all 0.2s'
        }} 
        data-testid={testId}
      >
        {label}
      </button>
      {!isSolutionShown && <span className="algebra-kbd-tooltip" suppressHydrationWarning>{'↵'}</span>}
    </div>
  );
}

// --- Windows ---

function SimpleWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_${id}`, generateExerciseId());
  const [val, setVal] = useSessionState(`session_algebra_val_${id}_${exerciseId}`, '');
  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, generateProblem);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useSessionState(`session_algebra_sol_shown_${id}`, false);
  const [showExample, setShowExample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastShowTimeRef = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (!isSolutionShown && prob && inputRef.current) {
      inputRef.current.focus();
    }
  }, [prob, isSolutionShown]);

  const nextTimeoutRef = useRef<any>(null);
  const next = () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    setProb(generateProblem()); setVal(''); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId());
  };

  useEffect(() => {
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isLoaded && !prob) next();
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      const logKey = `logged_exercise_${exerciseId}`;
      if (!sessionStorage.getItem(logKey)) {
        logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: prob.q, lang });
        sessionStorage.setItem(logKey, 'true');
      }
    }
  }, [exerciseId, prob, id, lang]);

  const check = () => {
    const currentVal = inputRef.current?.value || '';
    const isCorrect = MathEngine.checkNumeric(currentVal, prob.a);
    const errorMsg = isCorrect ? null : 'incorrect_numeric';
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: currentVal, is_correct: isCorrect, error: errorMsg, lang });

    if (isCorrect) {
      playSound('correct');
      setMsg(t('algebra_correct')); setMsgColor('green');
      nextTimeoutRef.current = setTimeout(() => { setSolvedCount(solvedCount + 1); next(); }, NEXT_PROBLEM_DELAY_MS);
    } else {
      playSound('incorrect');
      setMsg(t('algebra_incorrect')); setMsgColor('red');
    }
  };


  if (!prob) return null;

  return (
    <div className="rules-box" data-solution-shown={isSolutionShown.toString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{t('algebra_level', { count: solvedCount })}</p>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={prob.q} fontSize="30px" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input ref={inputRef} type="number" step="any" value={val} onChange={e => { setVal(e.target.value); if (msgColor !== 'green') setMsg(''); }}
              onFocus={() => { if (Date.now() - lastShowTimeRef.current > 100) setIsSolutionShown(false); }}
              style={{ width: '120px', padding: '10px', fontSize: '1.4rem', borderRadius: '8px', border: '2px solid #ccc', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <ActionButton
              label={isSolutionShown ? t('algebra_next_exercise') : t('algebra_check_ans')}
              onClick={isSolutionShown ? next : check}
              id={isSolutionShown ? `btn-next-exercise-${id}` : `btn-check-${id}`}
              data-testid={isSolutionShown ? "btn-next-exercise" : "btn-check"}
              isSolutionShown={isSolutionShown}
            />
            <WithTooltip tip={_solLabel}>
              <button onClick={() => {
                logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang });
                playSound('solution');
                setVal(String(prob.a));
                lastShowTimeRef.current = Date.now();
                setIsSolutionShown(true);
                setMsg('');
              }} className="btn-show-sol" data-testid="btn-show-solution" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
            </WithTooltip>
          </div>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function RoundingWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_${id}`, generateExerciseId());
  const [val, setVal] = useSessionState(`session_algebra_val_${id}_${exerciseId}`, '');
  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, generateProblem);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [isSolutionShown, setIsSolutionShown] = useSessionState(`session_algebra_sol_shown_${id}`, false);
  const [showExample, setShowExample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastShowTimeRef = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (!isSolutionShown && prob && inputRef.current) {
      inputRef.current.focus();
    }
  }, [prob, isSolutionShown]);

  const nextTimeoutRef = useRef<any>(null);
  const next = () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    setProb(generateProblem()); setVal(''); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId());
  };

  useEffect(() => {
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isLoaded && !prob) next();
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      const logKey = `logged_exercise_${exerciseId}`;
      if (!sessionStorage.getItem(logKey)) {
        logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: prob.q, lang });
        sessionStorage.setItem(logKey, 'true');
      }
    }
  }, [exerciseId, prob, id, lang]);

  const check = () => {
    const currentVal = inputRef.current?.value || '';
    const isCorrect = MathEngine.checkNumeric(currentVal, prob.a);
    const errorMsg = isCorrect ? null : 'incorrect_numeric';
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: currentVal, is_correct: isCorrect, error: errorMsg, lang });

    if (isCorrect) {
      playSound('correct');
      setMsg(t('algebra_correct')); setMsgColor('green');
      nextTimeoutRef.current = setTimeout(() => { setSolvedCount(solvedCount + 1); next(); }, NEXT_PROBLEM_DELAY_MS);
    } else {
      playSound('incorrect');
      setMsg(t('algebra_incorrect')); setMsgColor('red');
    }
  };


  if (!prob) return null;

  return (
    <div className="rules-box" data-solution-shown={isSolutionShown.toString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{t('algebra_level', { count: solvedCount })}</p>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={prob.q} fontSize="30px" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input ref={inputRef} type="number" step="any" value={val} onChange={e => { setVal(e.target.value); if (msgColor !== 'green') setMsg(''); }}
              onFocus={() => { if (Date.now() - lastShowTimeRef.current > 100) setIsSolutionShown(false); }}
              style={{ width: '120px', padding: '10px', fontSize: '1.4rem', borderRadius: '8px', border: '2px solid #ccc', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <ActionButton
              label={isSolutionShown ? t('algebra_next_exercise') : t('algebra_check_ans')}
              onClick={isSolutionShown ? next : check}
              id={isSolutionShown ? `btn-next-exercise-${id}` : `btn-check-${id}`}
              data-testid={isSolutionShown ? "btn-next-exercise" : "btn-check"}
              isSolutionShown={isSolutionShown}
            />
            <WithTooltip tip={_solLabel}>
              <button onClick={() => {
                logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang });
                playSound('solution');
                setVal(String(prob.a));
                lastShowTimeRef.current = Date.now();
                setIsSolutionShown(true);
                setMsg('');
              }} className="btn-show-sol" data-testid="btn-show-solution" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
            </WithTooltip>
          </div>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function FixedStepWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState<string>(`session_algebra_id_${id}`, generateExerciseId());
  const [steps, setSteps] = useSessionState<string[]>(`session_algebra_steps_${id}_${exerciseId}`, []);
  const [problem, setProblem, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, generateProblem);
  const [showExample, setShowExample] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useSessionState(`session_algebra_sol_shown_${id}`, false);
  const inputRefs = useRef<any[]>([]);
  const lastShowTimeRef = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (!isSolutionShown && problem && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [exerciseId, isSolutionShown]);

  const nextTimeoutRef = useRef<any>(null);
  const nextProb = () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    const p = generateProblem(); setProblem(p); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId());
  };

  useEffect(() => {
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isLoaded && !problem) nextProb();
  }, [isLoaded, problem, generateProblem]);

  useEffect(() => {
    if (problem && exerciseId) {
      const logKey = `logged_exercise_${exerciseId}`;
      if (!sessionStorage.getItem(logKey)) {
        logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: problem.q, lang });
        sessionStorage.setItem(logKey, 'true');
      }
    }
  }, [exerciseId, problem, id, lang]);

  const check = () => {
    // Read the very latest values from the DOM refs
    const currentSteps = inputRefs.current.slice(0, steps.length).map(ref => ref?.value || '');
    let stepsCorrect = true;
    for (let i = 0; i < currentSteps.length; i++) {
      const s = currentSteps[i];
      if (!s || !s.includes('=')) { stepsCorrect = false; break; }
      if (!MathEngine.checkEquationStep(s, problem.a)) { stepsCorrect = false; break; }
    }

    let isCorrect = stepsCorrect;
    let notFullySolved = false;
    let needsSimplification = false;
    const v = problem.variable || 'x';

    if (isCorrect && currentSteps.length > 0) {
      const finalStep = currentSteps[currentSteps.length - 1];
      if (!MathEngine.isEquationFullySolved(finalStep, v)) {
        isCorrect = false;
        notFullySolved = true;
      } else {
        const parts = finalStep.split('=');
        const resultPart = parts[0].trim() === v ? parts[1] : parts[0];
        if (!MathEngine.checkAlgebraicResult(resultPart, problem.a, v)) {
          isCorrect = false;
          needsSimplification = true;
        }
      }
    }

    let errorMsg = null;
    if (notFullySolved) errorMsg = 'not_fully_solved';
    else if (needsSimplification) errorMsg = 'needs_simplification';
    else if (!isCorrect) errorMsg = 'incorrect_algebraic';

    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: currentSteps.join(' | '), is_correct: isCorrect, error: errorMsg, lang });

    if (notFullySolved) {
      playSound('incorrect');
      setMsg(t('msg_must_solve_for_x') || 'Please solve entirely for the variable (e.g. x = 1).');
      setMsgColor('orange');
    } else if (needsSimplification) {
      playSound('incorrect');
      setMsg(t('algebra_fraction_not_simplified'));
      setMsgColor('orange');
    } else if (isCorrect) {
      playSound('correct');
      setMsg(t('algebra_correct')); setMsgColor('green');
      nextTimeoutRef.current = setTimeout(nextProb, NEXT_PROBLEM_DELAY_MS);
    } else {
      playSound('incorrect');
      setMsg(t('algebra_incorrect')); setMsgColor('red');
    }
  };


  if (!problem) return null;

  return (
    <div className="rules-box" data-solution-shown={isSolutionShown.toString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={problem.q} fontSize="2.4rem" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px' }}>
          {problem.steps.map((_: any, i: number) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '4px' }}>{steps.length > 1 && i === steps.length - 1 ? t('algebra_final_result') : `${t('algebra_step_label')} ${i + 1}`}</span>
              <div style={{ border: '2px solid #ccc', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
                <MathInput
                  ref={el => inputRefs.current[i] = el}
                  value={steps[i]}
                  onChange={v => { const ns = [...steps]; ns[i] = v; setSteps(ns); setMsg(''); }}
                  onEnter={() => isSolutionShown ? nextProb() : check()}
                  onFocus={() => {
                    setMsg('');
                    if (Date.now() - lastShowTimeRef.current > 500) setIsSolutionShown(false);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
          <ActionButton
            label={isSolutionShown ? t('algebra_next_exercise') : t('algebra_check_ans')}
            onClick={isSolutionShown ? nextProb : check}
            id={`btn-action-${id}`}
            data-testid={isSolutionShown ? "btn-next-exercise" : "btn-check"}
            isSolutionShown={isSolutionShown}
          />
          <WithTooltip tip={t('btn_show_sol')}>
            <button onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              if (typeof window !== 'undefined') (document.activeElement as HTMLElement)?.blur();
              logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang });
              playSound('solution');
              setSteps([...problem.steps]);
              lastShowTimeRef.current = Date.now();
              setIsSolutionShown(true);
              setMsg('');
            }} className="btn-show-sol" data-testid="btn-show-solution" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function AdvancedAlgebraWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_${id}`, generateExerciseId());
  const [rows, setRows] = useSessionState<{ id: string; val: string }[]>(`session_algebra_rows_${id}_${exerciseId}`, () => [{ id: generateExerciseId(), val: '' }]);

  // Migration: Ensure rows are always objects with IDs (handles legacy string-array data in sessionStorage)
  useEffect(() => {
    if (rows && rows.some((r: any) => typeof r === 'string' || (r && typeof r === 'object' && !r.id))) {
      setRows((prev: any) => prev.map((r: any) => 
        (typeof r === 'object' && r && r.id) ? r : { id: generateExerciseId(), val: String(r || '') }
      ));
    }
  }, [rows, setRows]);
  const [problem, setProblem, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, generateProblem);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useSessionState(`session_algebra_sol_shown_${id}`, false);
  const [showExample, setShowExample] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<any[]>([]);
  const lastShowTimeRef = useRef(0);

  const isMac = getIsMac();
  const shortcutLabel = isMac ? '⌘=' : 'Ctrl+=';

  // Autofocus on row change or new problem
  useEffect(() => {
    if (!isSolutionShown && inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex, rows.length, problem, isSolutionShown]);

  // Global Keyboard shortcut (Cmd/Ctrl + =)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key === '=') {
        e.preventDefault();
        addRow(focusedIndex);
      }
      if (isModifier && e.key === '-') {
        e.preventDefault();
        if (rows.length > 1) {
          setRows(prev => prev.filter((_, idx) => idx !== focusedIndex));
          setFocusedIndex(Math.max(0, focusedIndex - 1));
          setMsg('');
        }
      }
      if (isModifier && e.key === '/') {
        e.preventDefault();
        if (!isSolutionShown) {
          showSolution();
        }
      }
      if (isModifier && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setShowExample(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, isMac, rows, isSolutionShown, exerciseId, lang]);

  const addRow = (index: number) => {
    setRows(prev => {
      const nr = [...prev];
      nr.splice(index + 1, 0, { id: generateExerciseId(), val: '' });
      return nr;
    });
    setFocusedIndex(index + 1);
    setMsg('');
  };

  const nextTimeoutRef = useRef<any>(null);
  const nextProb = () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    const p = generateProblem(); setProblem(p); setRows([{ id: generateExerciseId(), val: '' }]); setFocusedIndex(0); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId());
  };

  useEffect(() => {
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isLoaded && !problem) nextProb();
  }, [isLoaded, problem, generateProblem]);

  useEffect(() => {
    if (problem && exerciseId) {
      const logKey = `logged_exercise_${exerciseId}`;
      if (!sessionStorage.getItem(logKey)) {
        logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: problem.q, lang });
        sessionStorage.setItem(logKey, 'true');
      }
    }
  }, [exerciseId, problem, id, lang]);

  const showSolution = () => {
    logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, solution: problem.steps, lang });
    playSound('solution');
    setRows(problem.steps.map((s: string) => ({ id: generateExerciseId(), val: s })));
    lastShowTimeRef.current = Date.now();
    setIsSolutionShown(true);
    setMsg('');
  };

  const check = () => {
    // Read the very latest values from the DOM refs
    const currentRows = rows.map((r, i) => inputRefs.current[i]?.value || '');
    const lastRow = currentRows[currentRows.length - 1];
    const v = problem.variable || 'x';

    let isCorrect = false;
    let notFullySolved = false;
    let needsSimplification = false;
    let needsSteps = false;

    // 1. Core Validation
    if (id === 'complex') {
      if (lastRow.includes('=')) {
        isCorrect = MathEngine.checkEquationStep(lastRow, problem.a);
        if (isCorrect) {
          if (!MathEngine.isEquationFullySolved(lastRow, v)) {
            isCorrect = false;
            notFullySolved = true;
          } else {
            const parts = lastRow.split('=');
            const resultPart = (parts[0].trim() === v) ? parts[1] : parts[0];
            if (!MathEngine.checkAlgebraicResult(resultPart, problem.a, v)) {
              isCorrect = false;
              needsSimplification = true;
            }
          }
        }
      } else {
        isCorrect = MathEngine.checkAlgebraicResult(lastRow, problem.a, v);
        if (!isCorrect && MathEngine.checkEquationStep(`${lastRow} = ${problem.a}`, 1.2345)) {
          needsSimplification = true;
        }
      }
    } else {
      isCorrect = MathEngine.checkAlgebraicResult(lastRow, problem.a, v);
      if (!isCorrect && MathEngine.checkEquationStep(`${lastRow} = ${problem.a}`, 1.2345)) {
        needsSimplification = true;
      }
    }

    // 2. Step Enforcement (Only if the answer is fundamentally correct/simplified)
    const isStepEnforced = id === 'complex' && problem.steps && problem.steps.length > 1;
    if (isStepEnforced && isCorrect && !needsSimplification && !notFullySolved) {
      if (currentRows.length < 2) {
        isCorrect = false;
        needsSteps = true;
      }
    }

    let errorMsg = null;
    if (notFullySolved) errorMsg = 'not_fully_solved';
    else if (needsSimplification) errorMsg = 'needs_simplification';
    else if (needsSteps) errorMsg = 'needs_steps';
    else if (!isCorrect) errorMsg = 'incorrect_algebraic';

    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: currentRows.join(' | '), is_correct: isCorrect, error: errorMsg, lang });

    if (notFullySolved) {
      playSound('incorrect');
      setMsg(t('msg_must_solve_for_x') || 'Please solve entirely for the variable (e.g. x = 1).');
      setMsgColor('orange');
    } else if (needsSimplification) {
      playSound('incorrect');
      setMsg(t('algebra_fraction_not_simplified'));
      setMsgColor('orange');
    } else if (needsSteps) {
      playSound('incorrect');
      setMsg(t('algebra_needs_steps') || 'Show your work! Add more steps to solve this problem.');
      setMsgColor('orange');
    } else if (isCorrect) {
      playSound('correct');
      setMsg(t('algebra_correct')); setMsgColor('green');
      nextTimeoutRef.current = setTimeout(nextProb, NEXT_PROBLEM_DELAY_MS);
    } else {
      playSound('incorrect');
      setMsg(t('algebra_incorrect')); setMsgColor('red');
    }
  };


  if (!problem) return null;

  return (
    <div className="rules-box" data-solution-shown={isSolutionShown.toString()} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={problem.q} fontSize="2.4rem" /></div>
        {isSolutionShown && problem.steps && (
          <div data-testid="solution-steps" style={{ background: '#e8f4fd', border: '2px dashed #3498db', padding: '15px', borderRadius: '12px', marginBottom: '16px', width: '100%', maxWidth: '400px' }}>
            <p style={{ fontWeight: 'bold', color: '#2980b9', marginBottom: '8px' }}>{t('algebra_solution_steps') || 'Solution Steps'}:</p>
            {problem.steps.map((s: string, i: number) => (
              <div key={i} data-step-value={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>{`${t('algebra_step_label')} ${i + 1}:`}</span>
                <div style={{ direction: 'ltr' }}><QuestionDisplay q={s} fontSize="1.2rem" /></div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px' }}>
          {rows.map((row, i) => (
            <div key={row.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '4px' }}>
              <span data-testid={`row-label-${i}`} style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '2px' }}>{rows.length > 1 && i === rows.length - 1 ? t('algebra_final_result') : `${t('algebra_step_label')} ${i + 1}`}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1, border: '2px solid #ccc', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
                  <MathInput
                    ref={el => inputRefs.current[i] = el}
                    value={row.val}
                    onChange={v => {
                      setRows(prev => {
                        const nr = [...prev];
                        const idx = nr.findIndex(x => x.id === row.id);
                        if (idx !== -1) {
                          nr[idx] = { ...nr[idx], val: v };
                        }
                        return nr;
                      });
                      if (msgColor !== 'green') setMsg('');
                      setIsSolutionShown(false);
                    }}
                    onFocus={() => {
                      setFocusedIndex(i);
                      setMsg('');
                      if (Date.now() - lastShowTimeRef.current > 500) setIsSolutionShown(false);
                    }}
                    onEnter={() => isSolutionShown ? nextProb() : check()}
                  />
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <WithTooltip tip={shortcutLabel}>
                    <button onClick={() => addRow(i)} id={`btn-add-row-${i}`} className="btn-add-row" style={{ padding: '8px 12px', background: 'var(--accent)', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>+</button>
                  </WithTooltip>
                  {rows.length > 1 && (
                    <WithTooltip tip={isMac ? '⌘-' : 'Ctrl+-'}>
                      <button onClick={() => {
                        setRows(prev => prev.filter(x => x.id !== row.id));
                        setFocusedIndex(Math.max(0, i - 1));
                      }} id={`btn-remove-step-${i}`} className="btn-remove-step" style={{ padding: '8px 12px', background: '#e74c3c', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>×</button>
                    </WithTooltip>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
          <ActionButton
            label={isSolutionShown ? t('algebra_next_exercise') : t('algebra_check_ans')}
            onClick={isSolutionShown ? nextProb : check}
            id={isSolutionShown ? `btn-next-exercise-${id}` : `btn-check-${id}`}
            data-testid={isSolutionShown ? "btn-next-exercise" : "btn-check"}
            isSolutionShown={isSolutionShown}
          />
          <WithTooltip tip={t('btn_show_sol')}>
            <button onClick={showSolution} className="btn-show-sol" data-testid="btn-show-solution" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function WordProblemWindow({ title, generateProblem, t, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_wordproblem`, generateExerciseId());
  const [eq, setEq] = useSessionState(`session_algebra_eq_wordproblem_${exerciseId}`, '');
  const [sol, setSol] = useSessionState(`session_algebra_sol_wordproblem_${exerciseId}`, '');
  const [msg, setMsg] = useState('');
  const [isSolutionShown, setIsSolutionShown] = useSessionState(`session_algebra_sol_shown_wordproblem`, false);

  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_wordproblem`, generateProblem);
  const [phase, setPhase] = useSessionState<'eq' | 'sol'>(`session_algebra_phase_wordproblem`, 'eq');
  const eqRef = useRef<HTMLInputElement>(null);
  const solRef = useRef<HTMLInputElement>(null);
  const lastShowTimeRef = useRef(0);

  // Autofocus based on phase or new problem
  useEffect(() => {
    if (!isSolutionShown) {
      if (phase === 'eq' && eqRef.current) {
        eqRef.current.focus();
      } else if (phase === 'sol' && solRef.current) {
        solRef.current.focus();
      }
    }
  }, [phase, prob, isSolutionShown]);

  const nextTimeoutRef = useRef<any>(null);
  const next = () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    setProb(generateProblem()); setPhase('eq'); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId());
  };

  useEffect(() => {
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isLoaded && !prob) next();
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      const logKey = `logged_exercise_${exerciseId}`;
      if (!sessionStorage.getItem(logKey)) {
        logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: 'wordproblem', question: prob.text, lang });
        sessionStorage.setItem(logKey, 'true');
      }
    }
  }, [exerciseId, prob, lang]);

  const check = () => {
    const currentEq = eqRef.current?.value || '';
    const currentSol = solRef.current?.value || '';

    if (phase === 'eq') {
      if (currentEq.includes('x')) {
        playSound('correct');
        logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, step: 'equation', input: currentEq, is_correct: true, lang });
        setPhase('sol');
      } else {
        playSound('incorrect');
        logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, step: 'equation', input: currentEq, is_correct: false, error: 'missing_variable', lang });
        setMsg(t('error_equation_variable_missing'));
      }
    } else {
      const isCorrect = MathEngine.checkNumeric(currentSol, prob.a);
      const errorMsg = isCorrect ? null : 'incorrect_numeric';
      logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, step: 'solution', input: currentSol, is_correct: isCorrect, error: errorMsg, lang });
      if (isCorrect) {
        playSound('correct');
        setMsg(t('algebra_correct'));
        nextTimeoutRef.current = setTimeout(next, NEXT_PROBLEM_DELAY_MS);
      } else {
        playSound('incorrect');
        setMsg(t('algebra_incorrect'));
      }
    }
  };


  if (!prob) return null;

  return (
    <div className="rules-box" data-solution-shown={isSolutionShown.toString()} style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '25px' }}>
      <SectionHeader title={title} t={t} />
      <div className="question" style={{ margin: '20px', fontSize: '1.2rem' }}>{prob.text}</div>
      <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
        <input ref={eqRef} placeholder={t('placeholder_equation')} value={eq} onChange={e => { setEq(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); if (Date.now() - lastShowTimeRef.current > 100) setIsSolutionShown(false); }} disabled={phase === 'sol'} style={{ padding: '10px' }} />
        {phase === 'sol' && <input ref={solRef} placeholder={t('placeholder_x')} value={sol} onChange={e => { setSol(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); if (Date.now() - lastShowTimeRef.current > 100) setIsSolutionShown(false); }} style={{ padding: '10px' }} type="number" step="any" />}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
          <ActionButton
            label={isSolutionShown ? t('algebra_next_exercise') : t('algebra_check_ans')}
            onClick={isSolutionShown ? next : check}
            id="btn-action-wordproblem"
            data-testid={isSolutionShown ? "btn-next-exercise" : "btn-check"}
            isSolutionShown={isSolutionShown}
          />
          <WithTooltip tip={_solLabel}>
            <button onClick={() => {
              logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, solution: { equation: prob.equation, answer: prob.a }, lang });
              playSound('solution');
              setPhase('sol');
              setEq(prob.equation);
              setSol(String(prob.a));
              lastShowTimeRef.current = Date.now();
              setIsSolutionShown(true);
            }} className="btn-show-sol" data-testid="btn-show-solution" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
        </div>
      </div>
      {msg && <p className="result" style={{ marginTop: '15px', fontWeight: 'bold' }} data-testid="algebra-result">{msg}</p>}
    </div>
  );
}

function FinalExamWindow({ title, generateProblem, t, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_finalexam`, generateExerciseId());
  const [ans, setAns] = useSessionState(`session_algebra_ans_finalexam_${exerciseId}`, '');
  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_finalexam`, generateProblem);
  const [msg, setMsg] = useState('');
  const [isSolutionShown, setIsSolutionShown] = useSessionState(`session_algebra_sol_shown_finalexam`, false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastShowTimeRef = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (!isSolutionShown && prob && inputRef.current) {
      inputRef.current.focus();
    }
  }, [prob, isSolutionShown]);

  const nextTimeoutRef = useRef<any>(null);
  const next = () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    setProb(generateProblem()); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId());
  };

  useEffect(() => {
    return () => { if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isLoaded && !prob) next();
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      const logKey = `logged_exercise_${exerciseId}`;
      if (!sessionStorage.getItem(logKey)) {
        logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: 'finalexam', question: prob.q, lang });
        sessionStorage.setItem(logKey, 'true');
      }
    }
  }, [exerciseId, prob, lang]);

  const check = () => {
    const currentAns = inputRef.current?.value || '';
    const isCorrect = MathEngine.checkNumeric(currentAns, prob.a);
    const errorMsg = isCorrect ? null : 'incorrect_numeric';
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: currentAns, is_correct: isCorrect, error: errorMsg, lang });
    if (isCorrect) {
      playSound('correct');
      setMsg(t('algebra_correct'));
      nextTimeoutRef.current = setTimeout(next, NEXT_PROBLEM_DELAY_MS);
    } else {
      playSound('incorrect');
      setMsg(t('algebra_incorrect'));
    }
  };


  if (!prob) return null;

  return (
    <div className="rules-box" data-solution-shown={isSolutionShown.toString()} style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '25px' }}>
      <SectionHeader title={title} t={t} />
      <div className="question" style={{ fontSize: '1.7rem', margin: '30px', direction: 'ltr' }}>{prob.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
          <input ref={inputRef} value={ans} onChange={e => { setAns(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); if (Date.now() - lastShowTimeRef.current > 100) setIsSolutionShown(false); }} style={{ padding: '10px', width: '120px', textAlign: 'center' }} type="number" step="any" />
          <ActionButton
            label={isSolutionShown ? t('algebra_next_exercise') : t('algebra_check_ans')}
            onClick={isSolutionShown ? next : check}
            id="btn-action-finalexam"
            data-testid={isSolutionShown ? "btn-next-exercise" : "btn-check"}
            isSolutionShown={isSolutionShown}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <WithTooltip tip={_solLabel}>
            <button onClick={() => {
              logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, solution: prob.a, lang });
              playSound('solution');
              setAns(String(prob.a));
              lastShowTimeRef.current = Date.now();
              setIsSolutionShown(true);
              setMsg('');
            }} className="btn-show-sol" data-testid="btn-show-solution" style={{ background: '#95a5a6', color: '#fff', padding: '10px 15px', border: 'none', borderRadius: '8px', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
          <button onClick={() => alert(t('exam_finish'))} style={{ background: '#2ecc71', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px' }}>{t('exam_finish')}</button>
        </div>
      </div>
      {msg && <p className="result" style={{ marginTop: '15px', fontWeight: 'bold' }} data-testid="algebra-result">{msg}</p>}
    </div>
  );
}

export default function AlgebraClient({ lang, dict, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize with null to prevent 'addsub' being highlighted by default
  const [activeTab, _setActiveTab] = usePersistentState<any>('algebraActiveTab', null);

  const urlTab = searchParams?.get('tab');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Sync logic on mount (The truth-seeking phase)
      const cookies = document.cookie.split('; ');
      const cookieValue = cookies.find(row => row.startsWith('algebra_active_tab='))?.split('=')?.[1];
      const sessionTab = sessionStorage.getItem('session_algebra_active_tab');

      // Fallback to 'addsub' only if no other intent exists
      const target = urlTab || cookieValue || sessionTab || 'addsub';

      if (target && target !== activeTab) {
        _setActiveTab(target);
      }
    } catch (err) {
      console.error('Hydration sync failed:', err);
    } finally {
      setIsHydrated(true);
    }
  }, [urlTab, activeTab, _setActiveTab]);

  // If the user changes tab, we update URL, Cookie, and Session
  const setActiveTab = (tab: string) => {
    _setActiveTab(tab);

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });

    if (typeof document !== 'undefined') {
      document.cookie = `algebra_active_tab=${tab}; path=/; max-age=2592000; SameSite=Lax`;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('session_algebra_active_tab', tab);
    }
  };

  // Global shortcuts: Cmd/Ctrl+/ = Show Solution, Cmd/Ctrl+E = Toggle Examples
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMac = getIsMac();
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key === '/') {
        e.preventDefault();
        const solBtn = document.querySelector('.btn-show-sol:not([disabled])') as HTMLButtonElement | null;
        solBtn?.click();
      }
      if (isModifier && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        const exBtn = document.getElementById('btn-toggle-examples') as HTMLButtonElement | null;
        exBtn?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'textarea' || target.tagName.toLowerCase() === 'button') return;

      const rulesBox = target.closest('.rules-box');
      if (rulesBox) {
        const btnCheck = rulesBox.querySelector('.btn-check') as HTMLButtonElement | null;
        if (btnCheck) {
          e.preventDefault();
          e.stopPropagation();
          target.blur();
          btnCheck.click();
        }
      }
    }
  };

  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key;
    for (const [k, v] of Object.entries(params)) str = str.replace(`{${k}}`, String(v));
    return str;
  };
  const tabs = [
    { id: 'addsub', key: 'algebra_btn_addsub' },
    { id: 'muldiv', key: 'algebra_btn_muldiv' },
    { id: 'rounding', key: 'algebra_btn_rounding' },
    { id: 'twostep', key: 'algebra_btn_twostep' },
    { id: 'combinelike', key: 'algebra_btn_combinelike' },
    { id: 'fractionlike', key: 'algebra_btn_fraction_like' },
    { id: 'complex', key: 'algebra_btn_complex' },
    // { id: 'wordproblem', key: 'algebra_btn_word_problem' },
    // { id: 'finalexam', key: 'algebra_btn_final_exam' }
  ];
  const getExample = (id: string) => (
    <div>
      <p>{t(`algebra_${id}_desc`)}</p>
      <p dangerouslySetInnerHTML={{ __html: t(`algebra_${id}_ex1`) }} />
      <p dangerouslySetInnerHTML={{ __html: t(`algebra_${id}_ex2`) }} />
      {dict[`algebra_${id}_ex3`] && <p dangerouslySetInnerHTML={{ __html: t(`algebra_${id}_ex3`) }} />}
    </div>
  );
  const addSubGenerator = React.useMemo(() => MathGen.getProblemGenerator('add-sub'), []);
  const mulDivGenerator = React.useMemo(() => MathGen.getProblemGenerator('mul-div'), []);
  const roundingGenerator = React.useMemo(() => MathGen.getProblemGenerator('rounding'), []);
  const twoStepGenerator = React.useMemo(() => MathGen.getProblemGenerator('two-step'), []);
  const combineLikeGenerator = React.useMemo(() => MathGen.getProblemGenerator('combining-like-terms'), []);
  const fractionLikeGenerator = React.useMemo(() => MathGen.getProblemGenerator('fractions-like-terms'), []);
  const complexGenerator = React.useMemo(() => MathGen.getProblemGenerator('complex-equation'), []);
  const wordProblemGenerator = React.useMemo(() => MathGen.getProblemGenerator('word-problems'), []);
  const finalExamGenerator = React.useMemo(() => MathGen.getProblemGenerator('final-exam'), []);

  return (
    <section className="page active" id="algebra-page" data-testid="algebra-page" style={{ paddingBottom: '60px' }} onKeyDownCapture={handleGlobalEnter}>
      <div className="container" style={{ maxWidth: '800px', width: '90%' }}>
        {children}
        <div data-testid="algebra-tabs-container" style={{
          display: 'flex', gap: '25px', flexWrap: 'wrap',
          opacity: 1
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: '1 1 180px', maxWidth: '300px' }}>
            {tabs.map(tab => (
              <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '18px 15px', background: activeTab === tab.id ? 'var(--accent)' : '#ecf0f1', color: activeTab === tab.id ? '#fff' : '#2c3e50',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >{t(tab.key)}</button>
            ))}
          </div>
          <div style={{ flex: '3 1 350px' }}>
            {!isHydrated ? (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <p style={{ color: '#7f8c8d' }}>{t('algebra_loading') || 'Loading exercise...'}</p>
              </div>
            ) : (
              <>
                {(activeTab === 'addsub' || activeTab === 'muldiv') && (
              <SimpleWindow
                key={activeTab}
                id={activeTab}
                title={t(`algebra_btn_${activeTab}`)}
                generateProblem={activeTab === 'addsub' ? addSubGenerator : mulDivGenerator}
                t={t}
                exampleContent={getExample(activeTab)}
                lang={lang}
              />
            )}
            {activeTab === 'rounding' && (
              <RoundingWindow
                key="rounding"
                id="rounding"
                title={t('algebra_btn_rounding')}
                generateProblem={roundingGenerator}
                t={t}
                exampleContent={getExample('rounding')}
                lang={lang}
              />
            )}
            {activeTab === 'twostep' && (
              <FixedStepWindow
                key="twostep"
                id="twostep"
                title={t('algebra_btn_twostep')}
                generateProblem={twoStepGenerator}
                t={t}
                exampleContent={getExample('twostep')}
                lang={lang}
              />
            )}
            {activeTab === 'combinelike' && (
              <AdvancedAlgebraWindow
                key="combinelike"
                id="combinelike"
                title={t('algebra_btn_combinelike')}
                generateProblem={combineLikeGenerator}
                t={t}
                exampleContent={getExample('combinelike')}
                lang={lang}
              />
            )}
            {activeTab === 'fractionlike' && (
              <AdvancedAlgebraWindow
                key="fractionlike"
                id="fractionlike"
                title={t('algebra_btn_fraction_like')}
                generateProblem={fractionLikeGenerator}
                t={t}
                exampleContent={getExample('fraction_like')}
                lang={lang}
              />
            )}
            {activeTab === 'complex' && (
              <AdvancedAlgebraWindow
                key="complex"
                id="complex"
                title={t('algebra_btn_complex')}
                generateProblem={complexGenerator}
                t={t}
                exampleContent={getExample('complex')}
                lang={lang}
              />
            )}
            {activeTab === 'wordproblem' && (
              <WordProblemWindow
                key="wordproblem"
                title={t('algebra_btn_word_problem')}
                generateProblem={wordProblemGenerator}
                t={t}
                lang={lang}
              />
            )}
            {activeTab === 'finalexam' && (
              <FinalExamWindow
                key="finalexam"
                title={t('algebra_btn_final_exam')}
                generateProblem={finalExamGenerator}
                t={t}
                lang={lang}
              />
            )}
          </>
        )}
      </div>
        </div>
      </div>
    </section>
  );
}
