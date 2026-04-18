'use client'

import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import MathInput from '../common/MathInput';
import type { Lang } from '../../i18n/translations';
import { logToAxiom } from '../../utils/logger';
import * as MathEngine from '../../utils/math/evaluators';
import * as MathGen from '../../utils/math/generators';

const generateExerciseId = () => Math.random().toString(36).substring(2, 15);

const NEXT_PROBLEM_DELAY_MS = 700;

const emptyFn = () => {};
function QuestionDisplay({ q, fontSize = '2rem' }: { q: string, fontSize?: string }) {
  const isMath = q.includes('\\') || q.includes('{');
  const mathStyle = React.useMemo(() => ({ fontSize, border: 'none', background: 'transparent' }), [fontSize]);
  
  if (isMath) {
    return (
      <div style={{ display: 'inline-block', minWidth: '100px', textAlign: 'center' }}>
        <MathInput value={q} onChange={emptyFn} readonly={true} style={mathStyle} />
      </div>
    );
  }
  return <span style={{ direction: 'ltr', fontSize }}>{q}</span>;
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
            width: 'fit-content'
          }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      )}
    </div>
  );
}

// --- Windows ---

function SimpleWindow({ id, title, generateProblem, t, exampleContent }: any) {
  const [prob, setProb] = useState<any>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const next = () => { setProb(generateProblem()); setVal(''); setMsg(''); setIsSolutionShown(false); };
  useEffect(() => { next(); }, [generateProblem]);

  const check = () => {
    if (MathEngine.checkNumeric(val, prob.a)) {
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
            <input type="number" step="any" value={val} onChange={e => { setVal(e.target.value); setMsg(''); }} 
              onFocus={() => { setMsg(''); setIsSolutionShown(false); }}
              style={{ width: '120px', padding: '10px', fontSize: '1.4rem', borderRadius: '8px', border: '2px solid #ccc', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <button className="btn-check" onClick={check} id={`btn-check-${id}`}>{t('algebra_check_ans')}</button>}
            <button onClick={() => { setVal(String(prob.a)); setIsSolutionShown(true); setMsg(''); }} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>{t('btn_show_sol')}</button>
          </div>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function RoundingWindow({ id, title, generateProblem, t, exampleContent }: any) {
  const [prob, setProb] = useState<any>(null);
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const next = () => { setProb(generateProblem()); setVal(''); setMsg(''); setIsSolutionShown(false); };
  useEffect(() => { next(); }, [generateProblem]);

  const check = () => {
    if (MathEngine.checkNumeric(val, prob.a)) {
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
            <input type="number" step="any" value={val} onChange={e => { setVal(e.target.value); setMsg(''); }} 
              onFocus={() => { setMsg(''); setIsSolutionShown(false); }}
              style={{ width: '120px', padding: '10px', fontSize: '1.4rem', borderRadius: '8px', border: '2px solid #ccc', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <button className="btn-check" onClick={check} id={`btn-check-${id}`}>{t('algebra_check_ans')}</button>}
            <button onClick={() => { setVal(String(prob.a)); setIsSolutionShown(true); setMsg(''); }} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>{t('btn_show_sol')}</button>
          </div>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function FixedStepWindow({ id, title, generateProblem, t, exampleContent }: any) {
  const [problem, setProblem] = useState<any>(null);
  const [showExample, setShowExample] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  const nextProb = () => { const p = generateProblem(); setProblem(p); setSteps(new Array(p.steps.length).fill('')); setMsg(''); setIsSolutionShown(false); };
  useEffect(() => { nextProb(); }, [generateProblem]);

  const check = () => {
    let isCorrect = true;
    for (let i = 0; i < steps.length; i++) {
       const s = steps[i];
       if (!s || !s.includes('=')) { isCorrect = false; break; }
       if (!MathEngine.checkEquationStep(s, problem.a)) { isCorrect = false; break; }
    }
    
    // Add fully solved check for the final step to ensure they reach the explicit final form
    if (isCorrect && steps.length > 0) {
      if (!MathEngine.isEquationFullySolved(steps[steps.length - 1], problem.variable || 'x')) {
         setMsg(t('msg_must_solve_for_x') || 'Please solve entirely for the variable (e.g. x = 1).');
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
                <MathInput value={steps[i]} onChange={v => { const ns = [...steps]; ns[i] = v; setSteps(ns); setMsg(''); }} onEnter={() => isSolutionShown ? nextProb() : check()} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isSolutionShown ? <button className="btn-check" onClick={nextProb} style={{ padding: '10px 15px' }}>{t('algebra_next_exercise')}</button> : <button className="btn-check" onClick={check} id={`btn-check-${id}`} style={{ padding: '10px 15px' }}>{t('algebra_check_ans')}</button>}
          <button onClick={() => { setSteps([...problem.steps]); setIsSolutionShown(true); setMsg(''); }} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>{t('btn_show_sol')}</button>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '15px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function AdvancedAlgebraWindow({ id, title, generateProblem, t, exampleContent }: any) {
  const [problem, setProblem] = useState<any>(null);
  const [rows, setRows] = useState<string[]>(['']);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('red');
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const nextProb = () => { setProblem(generateProblem()); setRows(['']); setMsg(''); setIsSolutionShown(false); };
  useEffect(() => { nextProb(); }, [generateProblem]);

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
    if (id === 'complex') {
      if (lastRow.includes('=')) {
        isCorrect = MathEngine.checkEquationStep(lastRow, problem.a);
        if (isCorrect && !MathEngine.isEquationFullySolved(lastRow, problem.variable || 'x')) {
          isCorrect = false;
          notFullySolved = true;
        }
      } else {
        isCorrect = MathEngine.checkNumeric(lastRow, problem.a);
      }
    } else {
      // For CLT and Fractions, problem.a is the target expression
      // We'll use checkEquationStep which is already robust for algebraic comparison
      isCorrect = MathEngine.checkEquationStep(`${lastRow} = ${problem.a}`, 1.2345);
    }
    
    if (notFullySolved) {
      setMsg(t('msg_must_solve_for_x') || 'Please solve entirely for the variable (e.g. x = 1).');
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
        <div className="question" style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '20px', width: '100%', marginBottom: '20px', textAlign: 'center' }}>
          <QuestionDisplay q={problem.q} />
        </div>

        {isSolutionShown && problem.steps && (
          <div data-testid="solution-steps" style={{ background: '#e8f4fd', border: '2px dashed #3498db', padding: '15px', borderRadius: '12px', marginBottom: '20px', width: '100%' }}>
            <p style={{ fontWeight: 'bold', color: '#2980b9', marginBottom: '8px' }}>{t('algebra_solution_steps') || "Solution Steps"}:</p>
            {problem.steps.map((s: string, i: number) => (
              <div key={i} data-step-value={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>{`Step ${i+1}:`}</span>
                <QuestionDisplay q={s} fontSize="1.2rem" />
              </div>
            ))}
          </div>
        )}

        <div  style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '350px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
              <span data-testid={`row-label-${i}`} style={{ fontSize: '0.75rem', color: '#7f8c8d', marginBottom: '2px' }}>{rows.length > 1 && i === rows.length - 1 ? t('algebra_final_result') : `${t('algebra_step_label')} ${i+1}`}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div  style={{ flex: 1, border: '2px solid #ccc', borderRadius: '8px', background: '#fff' }}>
                  <MathInput 
                    value={r} 
                    onChange={v => { const nr = [...rows]; nr[i] = v; setRows(nr); }} 
                    onEnter={() => isSolutionShown ? nextProb() : check()} 
                    onFocus={() => { 
                      // Only clear "Incorrect" or "Step" messages on focus, leave "Correct" alone
                      if (msgColor !== 'green') setMsg(''); 
                      setIsSolutionShown(false); 
                    }} 
                  />
                </div>
                <button onClick={() => { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)); setMsg(''); }} className="btn-remove-step" id={`btn-remove-step-${i}`} style={{ padding: '8px', background: '#e74c3c', color: '#fff', borderRadius: '4px', border: 'none' }}>×</button>
                <button onClick={() => { const nr = [...rows]; nr.splice(i + 1, 0, ''); setRows(nr); setMsg(''); }} className="btn-add-row" id={`btn-add-row-${i}`} style={{ padding: '8px', background: 'var(--accent)', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+</button>

              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {isSolutionShown ? <button className="btn-check" onClick={nextProb}>{t('algebra_next_exercise')}</button> : <button className="btn-check" onClick={check} id={`btn-check-${id}`}>{t('algebra_check_ans')}</button>}
          <button onClick={() => { setIsSolutionShown(true); setMsg(''); }} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}>{t('btn_show_sol')}</button>
        </div>
        {msg && <p className="result" style={{ color: msgColor, fontWeight: 'bold', marginTop: '10px' }} data-testid="algebra-result">{msg}</p>}
      </div>
    </div>
  );
}

function WordProblemWindow({ title, generateProblem, t }: any) {
  const [prob, setProb] = useState<any>(null);
  const [phase, setPhase] = useState<'eq' | 'sol'>('eq');
  const [eq, setEq] = useState('');
  const [sol, setSol] = useState('');
  const [msg, setMsg] = useState('');
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  const next = () => { setProb(generateProblem()); setPhase('eq'); setEq(''); setSol(''); setMsg(''); setIsSolutionShown(false); };
  
  const check = () => { if (phase === 'eq') { if (eq.includes('x')) setPhase('sol'); else setMsg(t('error_equation_variable_missing')); } else { if (MathEngine.checkNumeric(sol, prob.a)) { setMsg(t('algebra_correct')); setTimeout(next, NEXT_PROBLEM_DELAY_MS); } else setMsg(t('algebra_incorrect')); } };
  
  useEffect(() => { next(); }, [generateProblem]);

  if (!prob) return null;

  return (
    <div className="rules-box" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '25px' }}>
      <SectionHeader title={title} t={t} />
      <div className="question" style={{ margin: '20px', fontSize: '1.2rem' }}>{prob.text}</div>
      <div style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
        <input placeholder={t('placeholder_equation')} value={eq} onChange={e => { setEq(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} disabled={phase === 'sol'} style={{ padding: '10px' }} />
        {phase === 'sol' && <input placeholder={t('placeholder_x')} value={sol} onChange={e => { setSol(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} style={{ padding: '10px' }} autoFocus type="number" step="any" />}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
          {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <button className="btn-check" onClick={check}>{t('algebra_check_ans')}</button>}
          <button onClick={() => { setPhase('sol'); setEq(prob.equation); setSol(String(prob.a)); setIsSolutionShown(true); }} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px' }}>{t('btn_show_sol')}</button>
        </div>
      </div>
      {msg && <p className="result" style={{ marginTop: '15px', fontWeight: 'bold' }} data-testid="algebra-result">{msg}</p>}
    </div>
  );
}

function FinalExamWindow({ title, generateProblem, t }: any) {
  const [prob, setProb] = useState<any>(null);
  const [ans, setAns] = useState('');
  const [msg, setMsg] = useState('');
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  const next = () => { setProb(generateProblem()); setAns(''); setMsg(''); setIsSolutionShown(false); };

  const check = () => { if (MathEngine.checkNumeric(ans, prob.a)) { setMsg(t('algebra_correct')); setTimeout(next, NEXT_PROBLEM_DELAY_MS); } else setMsg(t('algebra_incorrect')); };

  useEffect(() => { next(); }, [generateProblem]);

  if (!prob) return null;

  return (
    <div className="rules-box" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '25px' }}>
      <SectionHeader title={title} t={t} />
      <div className="question" style={{ fontSize: '1.7rem', margin: '30px', direction: 'ltr' }}>{prob.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
          <input value={ans} onChange={e => { setAns(e.target.value); setMsg(''); }} onFocus={() => { setMsg(''); setIsSolutionShown(false); }} style={{ padding: '10px', width: '120px', textAlign: 'center' }} type="number" step="any" />
          {isSolutionShown ? <button className="btn-check" onClick={next}>{t('algebra_next_exercise')}</button> : <button className="btn-check" onClick={check}>{t('algebra_check_ans')}</button>}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button onClick={() => { setAns(String(prob.a)); setIsSolutionShown(true); setMsg(''); }} style={{ background: '#95a5a6', color: '#fff', padding: '10px', border: 'none', borderRadius: '8px' }}>{t('btn_show_sol')}</button>
          <button onClick={() => alert(t('exam_finish'))} style={{ background: '#2ecc71', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px' }}>{t('exam_finish')}</button>
        </div>
      </div>
      {msg && <p className="result" style={{ marginTop: '15px', fontWeight: 'bold' }} data-testid="algebra-result">{msg}</p>}
    </div>
  );
}

export default function AlgebraClient({ dict, children }: Props) {
  const [activeTab, setActiveTab] = usePersistentState<any>('algebraActiveTab', 'addsub');
  
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
  return (
    <section className="page active" id="algebra-page" data-testid="algebra-page" style={{ paddingBottom: '60px' }} onKeyDownCapture={handleGlobalEnter}>
      <div className="container" style={{ maxWidth: '800px', width: '90%' }}>
        {children}
        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
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
            {(activeTab === 'addsub' || activeTab === 'muldiv') && <SimpleWindow id={activeTab} title={t(`algebra_btn_${activeTab}`)} generateProblem={MathGen.getProblemGenerator(activeTab === 'addsub' ? 'add-sub' : 'mul-div')} t={t} exampleContent={getExample(activeTab)} />}
            {activeTab === 'rounding' && <RoundingWindow id="rounding" title={t('algebra_btn_rounding')} generateProblem={MathGen.getProblemGenerator('rounding')} t={t} exampleContent={getExample('rounding')} />}
            {activeTab === 'twostep' && <FixedStepWindow id="twostep" title={t('algebra_btn_twostep')} generateProblem={MathGen.getProblemGenerator('two-step')} t={t} exampleContent={getExample('twostep')} />}
            {activeTab === 'combinelike' && <AdvancedAlgebraWindow id="combinelike" title={t('algebra_btn_combinelike')} generateProblem={MathGen.getProblemGenerator('combining-like-terms')} t={t} exampleContent={getExample('combinelike')} />}
            {activeTab === 'fractionlike' && <AdvancedAlgebraWindow id="fractionlike" title={t('algebra_btn_fraction_like')} generateProblem={MathGen.getProblemGenerator('fractions-like-terms')} t={t} exampleContent={getExample('fraction_like')} />}
            {activeTab === 'complex' && <AdvancedAlgebraWindow id="complex" title={t('algebra_btn_complex')} generateProblem={MathGen.getProblemGenerator('complex-equation')} t={t} exampleContent={getExample('complex')} />}
            {activeTab === 'wordproblem' && <WordProblemWindow title={t('algebra_btn_word_problem')} generateProblem={MathGen.getProblemGenerator('word-problems')} t={t} />}
            {activeTab === 'finalexam' && <FinalExamWindow title={t('algebra_btn_final_exam')} generateProblem={MathGen.getProblemGenerator('final-exam')} t={t} />}
          </div>
        </div>
      </div>
    </section>
  );
}
