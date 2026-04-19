'use client'

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useSessionState } from '../../hooks/useSessionState';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import MathInput from '../common/MathInput';
import type { Lang } from '../../i18n/translations';
import { logToAxiom } from '../../utils/logger';
import * as MathEngine from '../../utils/math/evaluators';
import * as MathGen from '../../utils/math/generators';

const generateExerciseId = () => Math.random().toString(36).substring(2, 15);

const getIsMac = () => {
  if (typeof window === 'undefined') return false;
  return navigator.userAgent.includes('Mac');
};

const NEXT_PROBLEM_DELAY_MS = 700;

const emptyFn = () => {};

const _isMac = getIsMac();
const _addLabel    = _isMac ? '⌘=' : 'Ctrl+=';
const _removeLabel = _isMac ? '⌘-' : 'Ctrl+-';
const _solLabel    = _isMac ? '⌘/' : 'Ctrl+/';
const _exLabel     = _isMac ? '⌘E' : 'Ctrl+E';

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
  const mathStyle = React.useMemo(() => ({ fontSize, border: 'none', background: 'transparent' }), [fontSize]);
  
  if (isMath) {
    return (
      <div style={{ display: 'inline-block', minWidth: '100px', textAlign: 'center' }}>
        <MathInput value={q} onChange={emptyFn} readonly={true} style={mathStyle} />
        {/* Hidden text for accessibility and E2E testing (.innerText compatibility) */}
        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          {q}
        </span>
      </div>
    );
  }
  return <span style={{ direction: 'ltr', fontSize, display: 'inline-block' }}>{q}</span>;
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

function CheckButton({ label, onClick, id, style }: { label: string; onClick: () => void; id?: string; style?: React.CSSProperties }) {
  return (
    <div className="algebra-add-step-wrapper">
      <button className="btn-check" onClick={onClick} id={id} style={style}>{label}</button>
      <span className="algebra-kbd-tooltip" suppressHydrationWarning>{'↵'}</span>
    </div>
  );
}

// --- Windows ---

function SimpleWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_${id}`, '');
  const [val, setVal] = useSessionState(`session_algebra_val_${id}_${exerciseId}`, '');
  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSolClick = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (prob && inputRef.current) {
      inputRef.current.focus();
    }
  }, [prob]);

  const next = () => { setProb(generateProblem()); setVal(''); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId()); };
  
  useEffect(() => { 
    if (isLoaded && !prob) next(); 
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: prob.q, lang });
    }
  }, [exerciseId, prob, id, lang]);

  const check = () => {
    const isCorrect = MathEngine.checkNumeric(val, prob.a);
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: val, is_correct: isCorrect, error: isCorrect ? null : msg, lang });
    
    if (isCorrect) {
      setMsg(t('algebra_correct')); setMsgColor('green');
      setTimeout(() => { setSolvedCount(solvedCount + 1); next(); }, NEXT_PROBLEM_DELAY_MS);
    } else {
      setMsg(t('algebra_incorrect')); setMsgColor('red');
    }
  };

  if (!prob) return null;

  return (
    <div className="rules-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{t('algebra_level', { count: solvedCount })}</p>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={prob.q} fontSize="30px" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input ref={inputRef} type="number" step="any" value={val} onChange={e => { setVal(e.target.value); if (msgColor !== 'green') setMsg(''); setIsSolutionShown(false); }} 
              onFocus={() => { if (Date.now() - lastSolClick.current > 100) setIsSolutionShown(false); }}
              style={{ width: '120px', padding: '10px', fontSize: '1.4rem', borderRadius: '8px', border: '2px solid #ccc', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <CheckButton label={t('algebra_check_ans')} onClick={check} id={`btn-check-${id}`} />}
          <WithTooltip tip={_solLabel}>
            <button onClick={() => { lastSolClick.current = Date.now(); logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang }); setVal(String(prob.a)); setIsSolutionShown(true); setMsg(''); }} className="btn-show-sol" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
          </div>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function RoundingWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_${id}`, '');
  const [val, setVal] = useSessionState(`session_algebra_val_${id}_${exerciseId}`, '');
  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, null);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSolClick = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (prob && inputRef.current) {
      inputRef.current.focus();
    }
  }, [prob]);

  const next = () => { setProb(generateProblem()); setVal(''); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId()); };
  
  useEffect(() => { 
    if (isLoaded && !prob) next(); 
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: prob.q, lang });
    }
  }, [exerciseId, prob, id, lang]);

  const check = () => {
    const isCorrect = MathEngine.checkNumeric(val, prob.a);
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: val, is_correct: isCorrect, error: isCorrect ? null : msg, lang });

    if (isCorrect) {
      setMsg(t('algebra_correct')); setMsgColor('green');
      setTimeout(() => { setSolvedCount(solvedCount + 1); next(); }, NEXT_PROBLEM_DELAY_MS);
    } else {
      setMsg(t('algebra_incorrect')); setMsgColor('red');
    }
  };

  if (!prob) return null;

  return (
    <div className="rules-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{t('algebra_level', { count: solvedCount })}</p>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={prob.q} fontSize="30px" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input ref={inputRef} type="number" step="any" value={val} onChange={e => { setVal(e.target.value); if (msgColor !== 'green') setMsg(''); setIsSolutionShown(false); }} 
              onFocus={() => { if (Date.now() - lastSolClick.current > 100) setIsSolutionShown(false); }}
              style={{ width: '120px', padding: '10px', fontSize: '1.4rem', borderRadius: '8px', border: '2px solid #ccc', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <CheckButton label={t('algebra_check_ans')} onClick={check} id={`btn-check-${id}`} />}
          <WithTooltip tip={_solLabel}>
            <button onClick={() => { lastSolClick.current = Date.now(); logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang }); setVal(String(prob.a)); setIsSolutionShown(true); setMsg(''); }} className="btn-show-sol" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
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
  const [problem, setProblem, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, null);
  const [showExample, setShowExample] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const inputRefs = useRef<any[]>([]);
  const lastSolClick = useRef(0);

  // Autofocus on new problem
  useEffect(() => {
    if (problem && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [problem]);

  const nextProb = () => { const p = generateProblem(); setProblem(p); setSteps(new Array(p.steps.length).fill('')); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId()); };
  
  useEffect(() => {
    if (isLoaded && !problem) nextProb();
  }, [isLoaded, problem, generateProblem]);

  useEffect(() => {
    if (problem && exerciseId) {
      logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: problem.q, lang });
    }
  }, [exerciseId, problem, id, lang]);

  const check = () => {
    let isCorrect = true;
    for (let i = 0; i < steps.length; i++) {
       const s = steps[i];
       if (!s || !s.includes('=')) { isCorrect = false; break; }
       if (!MathEngine.checkEquationStep(s, problem.a)) { isCorrect = false; break; }
    }
    
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: steps.join(' | '), is_correct: isCorrect, lang });

    // Add fully solved check for the final step to ensure they reach the explicit final form
    if (isCorrect && steps.length > 0) {
      const finalStep = steps[steps.length - 1];
      const v = problem.variable || 'x';

      if (!MathEngine.isEquationFullySolved(finalStep, v)) {
         setMsg(t('msg_must_solve_for_x') || 'Please solve entirely for the variable (e.g. x = 1).');
         setMsgColor('orange');
         return;
      }

      // Simplification check for the final result
      const parts = finalStep.split('=');
      const resultPart = parts[0].trim() === v ? parts[1] : parts[0];
      if (!MathEngine.checkAlgebraicResult(resultPart, problem.a, v)) {
         setMsg(t('algebra_fraction_not_simplified'));
         setMsgColor('orange');
         return;
      }
    }

    if (isCorrect) { setMsg(t('algebra_correct')); setMsgColor('green'); setTimeout(nextProb, NEXT_PROBLEM_DELAY_MS); }
    else { setMsg(t('algebra_incorrect')); setMsgColor('red'); }
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="question" style={{ margin: '20px', direction: 'ltr' }}><QuestionDisplay q={problem.q} fontSize="2.4rem" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px' }}>
          {problem.steps.map((_: any, i: number) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '4px' }}>{steps.length > 1 && i === steps.length - 1 ? t('algebra_final_result') : `${t('algebra_step_label')} ${i+1}`}</span>
              <div style={{ border: '2px solid #ccc', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
                <MathInput 
                  ref={el => inputRefs.current[i] = el}
                  value={steps[i]} 
                  onChange={v => { const ns = [...steps]; ns[i] = v; setSteps(ns); if (msgColor !== 'green') setMsg(''); setIsSolutionShown(false); }} 
                  onEnter={() => isSolutionShown ? nextProb() : check()} 
                  onFocus={() => { if (Date.now() - lastSolClick.current > 100) setIsSolutionShown(false); }} 
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isSolutionShown ? <button className="btn-check" onClick={nextProb} style={{ padding: '10px 15px' }}>{t('algebra_next_exercise')}</button> : <CheckButton label={t('algebra_check_ans')} onClick={check} id={`btn-check-${id}`} style={{ padding: '10px 15px' }} />}
          <WithTooltip tip={_solLabel}>
            <button onClick={() => { lastSolClick.current = Date.now(); logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang }); setSteps([...problem.steps]); setIsSolutionShown(true); setMsg(''); }} className="btn-show-sol" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function AdvancedAlgebraWindow({ id, title, generateProblem, t, exampleContent, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_${id}`, '');
  const [rows, setRows] = useSessionState<string[]>(`session_algebra_rows_${id}_${exerciseId}`, ['']);
  const [problem, setProblem, isLoaded] = useSessionState<any>(`session_algebra_prob_${id}`, null);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<any[]>([]);
  const lastSolClick = useRef(0);

  const isMac = getIsMac();
  const shortcutLabel = isMac ? '⌘=' : 'Ctrl+=';

  // Autofocus on row change or new problem
  useEffect(() => {
    if (inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex, rows.length, problem]);

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
          const nr = rows.filter((_, idx) => idx !== focusedIndex);
          setRows(nr);
          setFocusedIndex(Math.max(0, focusedIndex - 1));
          setMsg('');
        }
      }
      if (isModifier && e.key === '/') {
        e.preventDefault();
        if (!isSolutionShown) {
          logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang });
          setIsSolutionShown(true); setMsg('');
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
    const nr = [...rows];
    nr.splice(index + 1, 0, '');
    setRows(nr);
    setFocusedIndex(index + 1);
    setMsg('');
  };

  const nextProb = () => { setProblem(generateProblem()); setRows(['']); setFocusedIndex(0); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId()); };
  
  useEffect(() => {
    if (isLoaded && !problem) nextProb();
  }, [isLoaded, problem, generateProblem]);

  useEffect(() => {
    if (problem && exerciseId) {
      logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: id, question: problem.q, lang });
    }
  }, [exerciseId, problem, id, lang]);

    const check = () => {
    const lastRow = rows[rows.length - 1];
    
    console.log(`[Check Debug] ID: ${id}, LastRow: "${lastRow}", Target: ${problem.a}, problemStepsLimit: ${problem.steps?.length}`);
    
    // Step Enforcement (Pedagogy)
    const isStepEnforced = id === 'complex' && problem.steps && problem.steps.length > 1;
    if (isStepEnforced && rows.length < 2) {
       setMsg(t('msg_must_show_steps') || 'Multi-step equation: Please show at least one intermediate step.');
       setMsgColor('orange');
       return;
    }

    let isCorrect = false;
    let notFullySolved = false;
    let needsSimplification = false;
    const v = problem.variable || 'x';

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
    
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: rows.join(' | '), is_correct: isCorrect, lang });

    if (notFullySolved) {
      setMsg(t('msg_must_solve_for_x') || 'Please solve entirely for the variable (e.g. x = 1).');
      setMsgColor('orange');
    } else if (needsSimplification) {
      setMsg(t('algebra_fraction_not_simplified'));
      setMsgColor('orange');
    } else if (isCorrect) { 
      setMsg(t('algebra_correct')); setMsgColor('green'); setTimeout(nextProb, NEXT_PROBLEM_DELAY_MS); 
    } else { 
      setMsg(t('algebra_incorrect')); setMsgColor('red'); 
    }
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '25px' }}>
      <SectionHeader title={title} showExample={showExample} onToggleExample={() => setShowExample(!showExample)} t={t} />
      {showExample && <div style={{ background: '#fdfaf6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>{exampleContent}</div>}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="question" style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '20px', width: '100%', marginBottom: '20px', textAlign: 'center', direction: 'ltr' }}>
          <QuestionDisplay q={problem.q} />
        </div>

        {isSolutionShown && problem.steps && (
          <div data-testid="solution-steps" style={{ background: '#e8f4fd', border: '2px dashed #3498db', padding: '15px', borderRadius: '12px', marginBottom: '20px', width: '100%' }}>
            <p style={{ fontWeight: 'bold', color: '#2980b9', marginBottom: '8px' }}>{t('algebra_solution_steps') || "Solution Steps"}:</p>
            {problem.steps.map((s: string, i: number) => (
              <div key={i} data-step-value={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>{`${t('algebra_step_label')} ${i+1}:`}</span>
                <div style={{ direction: 'ltr' }}>
                  <QuestionDisplay q={s} fontSize="1.2rem" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div  style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '350px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
              <span data-testid={`row-label-${i}`} style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '2px' }}>{rows.length > 1 && i === rows.length - 1 ? t('algebra_final_result') : `${t('algebra_step_label')} ${i+1}`}</span>
              <div style={{ display: 'flex', gap: '6px', direction: 'ltr' }}>
                <div  style={{ flex: 1, border: '2px solid #ccc', borderRadius: '8px', background: '#fff' }}>
                  <MathInput 
                    ref={el => inputRefs.current[i] = el}
                    value={r} 
                    onChange={v => { 
                      const nr = [...rows]; nr[i] = v; setRows(nr); 
                      if (msgColor !== 'green') setMsg('');
                      setIsSolutionShown(false);
                    }} 
                    onEnter={() => isSolutionShown ? nextProb() : check()} 
                    onFocus={() => { 
                      setFocusedIndex(i);
                      if (Date.now() - lastSolClick.current > 200) setIsSolutionShown(false);
                    }} 
                  />
                </div>
                <WithTooltip tip={_removeLabel}>
                  <button onClick={() => { if (rows.length > 1) { const nr = rows.filter((_, idx) => idx !== i); setRows(nr); setFocusedIndex(Math.max(0, i - 1)); } setMsg(''); }} className="btn-remove-step" id={`btn-remove-step-${i}`} style={{ padding: '8px 14px', margin: 0, background: '#e74c3c', color: '#fff', borderRadius: '4px', border: 'none' }}>×</button>
                </WithTooltip>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'stretch' }} className="algebra-add-step-wrapper">
                  <button onClick={() => addRow(i)} className="btn-add-row" id={`btn-add-row-${i}`} style={{ padding: '8px 14px', margin: 0, background: 'var(--accent)', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+</button>
                  <span className="algebra-kbd-tooltip" suppressHydrationWarning>{shortcutLabel}</span>
                </div>

              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isSolutionShown ? <button className="btn-check" onClick={nextProb}>{t('algebra_next_exercise')}</button> : <CheckButton label={t('algebra_check_ans')} onClick={check} id={`btn-check-${id}`} />}
          <WithTooltip tip={_solLabel}>
            <button onClick={() => { lastSolClick.current = Date.now(); logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang }); if (problem.steps) setRows([...problem.steps]); setIsSolutionShown(true); setMsg(''); }} className="btn-show-sol" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '10px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function WordProblemWindow({ title, generateProblem, t, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_wordproblem`, '');
  const [eq, setEq] = useSessionState(`session_algebra_eq_wordproblem_${exerciseId}`, '');
  const [sol, setSol] = useSessionState(`session_algebra_sol_wordproblem_${exerciseId}`, '');
  const [msg, setMsg] = useState('');
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_wordproblem`, null);
  const [phase, setPhase] = useSessionState<'eq' | 'sol'>(`session_algebra_phase_wordproblem`, 'eq');
  const eqRef = useRef<HTMLInputElement>(null);
  const solRef = useRef<HTMLInputElement>(null);

  // Autofocus based on phase or new problem
  useEffect(() => {
    if (phase === 'eq' && eqRef.current) {
      eqRef.current.focus();
    } else if (phase === 'sol' && solRef.current) {
      solRef.current.focus();
    }
  }, [phase, prob]);
  const next = () => { setProb(generateProblem()); setPhase('eq'); setEq(''); setSol(''); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId()); };
  
  useEffect(() => {
    if (isLoaded && !prob) next();
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: 'wordproblem', question: prob.text, lang });
    }
  }, [exerciseId, prob]);

  const check = () => { 
    if (phase === 'eq') { 
      if (eq.includes('x')) {
        logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, step: 'equation', input: eq, is_correct: true, lang });
        setPhase('sol'); 
      } else {
        logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, step: 'equation', input: eq, is_correct: false, lang });
        setMsg(t('error_equation_variable_missing')); 
      }
    } else { 
      const isCorrect = MathEngine.checkNumeric(sol, prob.a);
      logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, step: 'solution', input: sol, is_correct: isCorrect, lang });
      if (isCorrect) { 
        setMsg(t('algebra_correct')); 
        setTimeout(next, NEXT_PROBLEM_DELAY_MS); 
      } else setMsg(t('algebra_incorrect')); 
    } 
  };
  
  useEffect(() => { next(); }, [generateProblem]);

  if (!prob) return null;

  return (
    <div className="rules-box" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '25px' }}>
      <SectionHeader title={title} t={t} />
      <div className="question" style={{ margin: '20px', fontSize: '1.2rem' }}>{prob.text}</div>
      <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
        <input ref={eqRef} placeholder={t('placeholder_equation')} value={eq} onChange={e => { setEq(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} disabled={phase === 'sol'} style={{ padding: '10px' }} />
        {phase === 'sol' && <input ref={solRef} placeholder={t('placeholder_x')} value={sol} onChange={e => { setSol(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} style={{ padding: '10px' }} type="number" step="any" />}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
          {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <CheckButton label={t('algebra_check_ans')} onClick={check} />}
          <WithTooltip tip={_solLabel}>
            <button onClick={() => { logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang }); setPhase('sol'); setEq(prob.equation); setSol(String(prob.a)); setIsSolutionShown(true); }} className="btn-show-sol" style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', margin: 0 }}>{t('btn_show_sol')}</button>
          </WithTooltip>
        </div>
      </div>
      {msg && <p className="result" style={{ marginTop: '15px', fontWeight: 'bold' }} data-testid="algebra-result">{msg}</p>}
    </div>
  );
}

function FinalExamWindow({ title, generateProblem, t, lang }: any) {
  const [exerciseId, setExerciseId] = useSessionState(`session_algebra_id_finalexam`, '');
  const [ans, setAns] = useSessionState(`session_algebra_ans_finalexam_${exerciseId}`, '');
  const [prob, setProb, isLoaded] = useSessionState<any>(`session_algebra_prob_finalexam`, null);
  const [msg, setMsg] = useState('');
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus on new problem
  useEffect(() => {
    if (prob && inputRef.current) {
      inputRef.current.focus();
    }
  }, [prob]);

  const next = () => { setProb(generateProblem()); setAns(''); setMsg(''); setIsSolutionShown(false); setExerciseId(generateExerciseId()); };

  useEffect(() => {
    if (isLoaded && !prob) next();
  }, [isLoaded, prob, generateProblem]);

  useEffect(() => {
    if (prob && exerciseId) {
      logToAxiom({ event: 'exercise_created', exercise_id: exerciseId, type: 'finalexam', question: prob.q, lang });
    }
  }, [exerciseId, prob]);

  const check = () => { 
    const isCorrect = MathEngine.checkNumeric(ans, prob.a);
    logToAxiom({ event: 'exercise_attempt', exercise_id: exerciseId, input: ans, is_correct: isCorrect, lang });
    if (isCorrect) { 
      setMsg(t('algebra_correct')); 
      setTimeout(next, NEXT_PROBLEM_DELAY_MS); 
    } else setMsg(t('algebra_incorrect')); 
  };

  useEffect(() => { next(); }, [generateProblem]);

  if (!prob) return null;

  return (
    <div className="rules-box" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '25px' }}>
      <SectionHeader title={title} t={t} />
      <div className="question" style={{ fontSize: '1.7rem', margin: '30px', direction: 'ltr' }}>{prob.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
          <input ref={inputRef} value={ans} onChange={e => { setAns(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} style={{ padding: '10px', width: '120px', textAlign: 'center' }} type="number" step="any" />
          {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <CheckButton label={t('algebra_check_ans')} onClick={check} />}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <WithTooltip tip={_solLabel}>
            <button onClick={() => { logToAxiom({ event: 'exercise_show_solution', exercise_id: exerciseId, lang }); setAns(String(prob.a)); setIsSolutionShown(true); setMsg(''); }} className="btn-show-sol" style={{ background: '#95a5a6', color: '#fff', padding: '10px', border: 'none', borderRadius: '8px', margin: 0 }}>{t('btn_show_sol')}</button>
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
    if (typeof window === 'undefined') return;
    
    // Sync logic on mount (The truth-seeking phase)
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('algebra_active_tab='))?.split('=')[1];
    const sessionTab = sessionStorage.getItem('session_algebra_active_tab');
    
    // Fallback to 'addsub' only if no other intent exists
    const target = urlTab || cookieValue || sessionTab || 'addsub';
    
    if (target && target !== activeTab) {
      _setActiveTab(target);
    }
    
    setIsHydrated(true);
  }, []); 

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
    { id: 'wordproblem', key: 'algebra_btn_word_problem' },
    { id: 'finalexam', key: 'algebra_btn_final_exam' }
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
        <div style={{ 
          display: 'flex', gap: '25px', flexWrap: 'wrap',
          opacity: isHydrated ? 1 : 0,
          transition: 'opacity 0.2s ease-in'
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
          </div>
        </div>
      </div>
    </section>
  );
}
