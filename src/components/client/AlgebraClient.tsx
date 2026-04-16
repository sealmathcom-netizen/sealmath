'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import MathInput from '../common/MathInput';
import type { Lang } from '../../i18n/translations';
import { logToAxiom } from '../../utils/logger';

const generateExerciseId = () => Math.random().toString(36).substring(2, 15);

import { ComputeEngine } from "@cortex-js/compute-engine";
const ce = new ComputeEngine();

import * as MathEngine from '../../utils/math/evaluators';
import * as MathGen from '../../utils/math/generators';
import type { BaseProblem as Problem, TwoStepProblem, RoundingProblem, LikeTermsProblem, CombiningFractionLikeTermsProblem, Rational } from '../../utils/math/types';

type Props = {
  lang: Lang;
  dict: Record<string, string>;
  children?: React.ReactNode;
};

// Backward compatibility or shared helpers
function hasHebrewText(v: string) {
  return /[\u0590-\u05FF]/.test(v);
}

function AlgebraWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  dict,
  id
}: { 
  generateProblem: () => Problem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  dict: Record<string, string>,
  id: string
}) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [answer, setAnswer] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);

  const exerciseIdRef = useRef('');

  useEffect(() => {
    const newProblem = generateProblem();
    const newId = generateExerciseId();
    exerciseIdRef.current = newId;
    setProblem(newProblem);

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: newId,
      exercise_type: id,
      question: newProblem.q,
      outcome: null
    });
  }, [generateProblem, id]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkAnswer = () => {
    if (!problem) return;
    if (answer.trim() === '') return;

    const isCorrect = MathEngine.checkNumeric(answer, problem.a);
    const outcome = isCorrect ? 'correct' : 'incorrect';

    logToAxiom({
      level: 'info',
      message: 'Solution checked',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      answer,
      outcome,
    });

    if (isCorrect) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");

      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        const nextProb = generateProblem();
        const nextId = generateExerciseId();
        exerciseIdRef.current = nextId;
        setProblem(nextProb);

        logToAxiom({
          level: 'info',
          message: 'Exercise created',
          exercise_id: nextId,
          exercise_type: id,
          question: nextProb.q,
          outcome: null
        });

        setAnswer('');
        setResultMsg('');
      }, 1000);
    } else {
      setResultMsg(t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    }
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {problem.q}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <span>x =</span>
          <input
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            style={{
              padding: '12px',
              fontSize: '1.5rem',
              width: '120px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '2px solid #ccc',
              outline: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
              }
            }}
          />
        </div>
        
        <div>
          <button className="btn-check" onClick={checkAnswer} style={{ marginTop: '5px', maxWidth: '200px', fontSize: '1.1rem' }}>
            {t('algebra_check_ans')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1.1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Two-Step Generator moved to generators.ts

function TwoStepAlgebraWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  dict,
  id
}: { 
  generateProblem: () => TwoStepProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  dict: Record<string, string>,
  id: string
}) {
  const [problem, setProblem] = useState<TwoStepProblem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  const exerciseIdRef = useRef('');

  useEffect(() => {
    const newProblem = generateProblem();
    const newId = generateExerciseId();
    exerciseIdRef.current = newId;
    setProblem(newProblem);
    setIsSolutionShown(false);

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: newId,
      exercise_type: id,
      question: newProblem.q,
      outcome: null
    });
  }, [generateProblem, id]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const handleNextProblem = () => {
    const nextProb = generateProblem();
    const nextId = generateExerciseId();
    exerciseIdRef.current = nextId;
    setProblem(nextProb);
    setAns1('');
    setAns2('');
    setIsSolutionShown(false);
    setResultMsg('');

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: nextId,
      exercise_type: id,
      question: nextProb.q,
      outcome: null
    });
  };

  const checkBothAnswers = () => {
    if (!problem) return;
    if (ans1.trim() === '' || ans2.trim() === '') return;

    const isPhase1Correct = MathEngine.checkNumeric(ans1, problem.step1Ans);
    const isPhase2Correct = MathEngine.checkNumeric(ans2, problem.step2Ans);
    const isCorrect = isPhase1Correct && isPhase2Correct;
    const outcome = isCorrect ? 'correct' : 'incorrect';

    logToAxiom({
      level: 'info',
      message: 'Solution checked',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      steps: [ans1, ans2],
      outcome,
    });

    if (isCorrect) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        const nextProb = generateProblem();
        const nextId = generateExerciseId();
        exerciseIdRef.current = nextId;
        setProblem(nextProb);

        logToAxiom({
          level: 'info',
          message: 'Exercise created',
          exercise_id: nextId,
          exercise_type: id,
          question: nextProb.q,
          outcome: null
        });

        setAns1('');
        setAns2('');
        setResultMsg('');
      }, 1000);
    } else if (!isPhase1Correct) {
      setResultMsg(t('algebra_twostep_err1') || t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    } else {
      setResultMsg(t('algebra_twostep_err2') || t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    }
  };

  const showSolution = () => {
    if (!problem) return;
    setAns1(String(problem.step1Ans));
    setAns2(String(Math.round(problem.step2Ans * 100) / 100));
    setResultMsg('');
    setIsSolutionShown(true);

    logToAxiom({
      level: 'info',
      message: 'Solution shown',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      outcome: 'not solved',
      solution: `Step1: ${ans1}, Step2: ${ans2}`,
    });
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {problem.q}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <span style={{ width: '80px', textAlign: 'right' }}>{problem.step1Prefix}</span>
          <input
            type="number" step="any" value={ans1} onChange={e => { setAns1(e.target.value); setIsSolutionShown(false); }}
            style={{ padding: '8px', fontSize: '1.4rem', width: '100px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                checkBothAnswers();
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <span style={{ width: '80px', textAlign: 'right' }}>{problem.step2Prefix}</span>
          <input
            type="number" step="any" value={ans2} onChange={e => { setAns2(e.target.value); setIsSolutionShown(false); }}
            style={{ padding: '8px', fontSize: '1.4rem', width: '100px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                checkBothAnswers();
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={isSolutionShown ? handleNextProblem : checkBothAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem', background: isSolutionShown ? '#27ae60' : undefined }}>
            {isSolutionShown ? (t('algebra_next_exercise') || 'Next') : t('algebra_check_ans')}
          </button>
          <button className="btn-check" onClick={showSolution} style={{ maxWidth: '160px', fontSize: '1.1rem', background: '#95a5a6' }}>
            {t('btn_show_sol')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function rationalToCoeffText(r: any, variable: string): string {
  if (r.den === 1) return `${r.num}${variable}`;
  return `${r.num}/${r.den}${variable}`;
}

function FractionText({ num, den }: { num: number, den: number }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, verticalAlign: 'middle', marginInline: '2px' }}>
      <span style={{ fontSize: '0.8em', padding: '0 4px' }}>{num}</span>
      <span style={{ width: '100%', borderTop: '2px solid currentColor', margin: '2px 0' }} />
      <span style={{ fontSize: '0.8em', padding: '0 4px' }}>{den}</span>
    </span>
  );
}

function splitSignedNumerator(rawNum: number | string): { sign: 1 | -1; absNum: number } {
  const n = typeof rawNum === 'number' ? rawNum : Number(rawNum);
  if (Number.isNaN(n)) return { sign: 1, absNum: 0 };
  return { sign: n < 0 ? -1 : 1, absNum: Math.abs(n) };
}

function SignedFractionText({ num, den }: Rational) {
  const { sign, absNum } = splitSignedNumerator(num);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {sign < 0 && <span>-</span>}
      <FractionText num={absNum} den={den} />
    </span>
  );
}


function FractionTerm({ coeff, variable }: { coeff: Rational; variable: string }) {
  if (coeff.num === 0) return <span>0</span>;
  if (coeff.den === 1) {
    if (coeff.num === 1) return <span>{variable}</span>;
    if (coeff.num === -1) return <span>-{variable}</span>;
    return <span>{coeff.num}{variable}</span>;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      <SignedFractionText num={coeff.num} den={coeff.den} />
      <span>{variable}</span>
    </span>
  );
}

function FractionLikePrompt({ problem }: { problem: CombiningFractionLikeTermsProblem }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <FractionTerm coeff={problem.left} variable={problem.variable} />
      <span>{problem.isAdd ? '+' : '-'}</span>
      <FractionTerm coeff={problem.right} variable={problem.variable} />
    </span>
  );
}

function FractionRowPreview({ value, variable }: { value: string; variable: string }) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized) return null;

  const renderFraction = (num: string, den: string, key: string) => (
    <SignedFractionText key={key} num={Number(num)} den={Number(den)} />
  );

  const tokens: ReactNode[] = [];
  let index = 0;

  while (index < normalized.length) {
    const rest = normalized.slice(index);

    const fractionVarMatch = rest.match(/^(-?\d+)\/(\d+)([a-z])/i);
    if (fractionVarMatch) {
      tokens.push(
        <span key={`fv-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {renderFraction(fractionVarMatch[1], fractionVarMatch[2], `f-${index}`)}
          <span>{fractionVarMatch[3]}</span>
        </span>
      );
      index += fractionVarMatch[0].length;
      continue;
    }

    const varFractionMatch = rest.match(/^([a-z])\((-?\d+)\/(\d+)([\+\-])(-?\d+)\/(\d+)\)$/i);
    if (varFractionMatch) {
      tokens.push(
        <span key={`vf-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span>{varFractionMatch[1]}</span>
          <span>(</span>
          {renderFraction(varFractionMatch[2], varFractionMatch[3], `l-${index}`)}
          <span>{varFractionMatch[4]}</span>
          {renderFraction(varFractionMatch[5], varFractionMatch[6], `r-${index}`)}
          <span>)</span>
        </span>
      );
      index += varFractionMatch[0].length;
      continue;
    }

    const parenFractionVarMatch = rest.match(/^\((-?\d+)\/(\d+)([\+\-])(-?\d+)\/(\d+)\)([a-z])$/i);
    if (parenFractionVarMatch) {
      tokens.push(
        <span key={`pfv-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span>(</span>
          {renderFraction(parenFractionVarMatch[1], parenFractionVarMatch[2], `l-${index}`)}
          <span>{parenFractionVarMatch[3]}</span>
          {renderFraction(parenFractionVarMatch[4], parenFractionVarMatch[5], `r-${index}`)}
          <span>)</span>
          <span>{parenFractionVarMatch[6]}</span>
        </span>
      );
      index += parenFractionVarMatch[0].length;
      continue;
    }

    const simpleVarMatch = rest.match(/^(-?\d+)([a-z])/i);
    if (simpleVarMatch) {
      tokens.push(<span key={`sv-${index}`}>{simpleVarMatch[1]}{simpleVarMatch[2]}</span>);
      index += simpleVarMatch[0].length;
      continue;
    }

    const char = rest[0];
    tokens.push(<span key={`c-${index}`}>{char === '/' ? '\u00F7' : char}</span>);
    index += 1;
  }

  return (
    <div style={{ minHeight: '34px', borderRadius: '6px', background: '#f8f9fb', border: '1px solid #dfe6e9', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '1.15rem', direction: 'ltr', color: 'var(--dark)' }}>
      {tokens.length > 0 ? tokens : <span style={{ color: '#95a5a6' }}>{variable}</span>}
    </div>
  );
}

function CombiningLikeTermsWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  dict,
  id
}: { 
  generateProblem: () => LikeTermsProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  dict: Record<string, string>,
  id: string
}) {
  const [problem, setProblem] = useState<LikeTermsProblem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  const exerciseIdRef = useRef('');

  useEffect(() => {
    const newProblem = generateProblem();
    const newId = generateExerciseId();
    exerciseIdRef.current = newId;
    setProblem(newProblem);
    setIsSolutionShown(false);

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: newId,
      exercise_type: id,
      question: newProblem.q,
      outcome: null
    });
  }, [generateProblem, id]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const handleNextProblem = () => {
    const nextProb = generateProblem();
    const nextId = generateExerciseId();
    exerciseIdRef.current = nextId;
    setProblem(nextProb);
    setAns1('');
    setAns2('');
    setIsSolutionShown(false);
    setResultMsg('');

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: nextId,
      exercise_type: id,
      question: nextProb.q,
      outcome: null
    });
  };

  const checkBothAnswers = () => {
    if (!problem) return;
    if (ans1.trim() === '' || ans2.trim() === '') return;

    const phase1 = MathEngine.checkAlgebraicExpression(ans1, problem.variable, problem.a);
    const phase2 = MathEngine.checkAlgebraicExpression(ans2, problem.variable, problem.a);
    const isCorrect = phase1.isCorrect && phase2.isCorrect;
    const outcome = isCorrect ? 'correct' : 'incorrect';

    logToAxiom({
      level: 'info',
      message: 'Solution checked',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      steps: [ans1, ans2],
      outcome,
    });

    if (isCorrect) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        const nextProb = generateProblem();
        const nextId = generateExerciseId();
        exerciseIdRef.current = nextId;
        setProblem(nextProb);

        logToAxiom({
          level: 'info',
          message: 'Exercise created',
          exercise_id: nextId,
          exercise_type: id,
          question: nextProb.q,
          outcome: null
        });

        setAns1('');
        setAns2('');
        setResultMsg('');
      }, 1000);
    } else if (!phase1.isCorrect) {
      setResultMsg(t('algebra_combinelike_err1'));
      setResultColor("var(--error, red)");
    } else {
      setResultMsg(t('algebra_combinelike_err2'));
      setResultColor("var(--error, red)");
    }
  };

  const showSolution = () => {
    if (!problem) return;
    const resultNum = problem.a;
    setAns1(`${problem.variable}(${problem.leftCoeff} ${problem.isAdd ? '+' : '-'} ${problem.rightCoeff})`);
    setAns2(resultNum === 0 ? "0" : `${resultNum}${problem.variable}`);
    setResultMsg('');
    setIsSolutionShown(true);

    logToAxiom({
      level: 'info',
      message: 'Solution shown',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      outcome: 'not solved',
      solution: `Step1: ${ans1}, Step2: ${ans2}`,
    });
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {problem.q}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <input
            type="text" value={ans1} onChange={e => { setAns1(e.target.value); setIsSolutionShown(false); }}
            placeholder={`${problem.variable}(a + b)`}
            style={{ padding: '8px', fontSize: '1.4rem', width: '200px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                checkBothAnswers();
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <input
            type="text" value={ans2} onChange={e => { setAns2(e.target.value); setIsSolutionShown(false); }}
            placeholder={`result${problem.variable}`}
            style={{ padding: '8px', fontSize: '1.4rem', width: '200px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                checkBothAnswers();
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={isSolutionShown ? handleNextProblem : checkBothAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem', background: isSolutionShown ? '#27ae60' : undefined }}>
            {isSolutionShown ? (t('algebra_next_exercise') || 'Next') : t('algebra_check_ans')}
          </button>
          <button className="btn-check" onClick={showSolution} style={{ maxWidth: '160px', fontSize: '1.1rem', background: '#95a5a6' }}>
            {t('btn_show_sol')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CombiningFractionLikeTermsWindow({
  generateProblem,
  title,
  exampleContent,
  t,
  dict,
  id
}: {
  generateProblem: () => CombiningFractionLikeTermsProblem,
  title: string,
  exampleContent: ReactNode,
  t: any,
  dict: Record<string, string>,
  id: string
}) {
  const [problem, setProblem] = useState<CombiningFractionLikeTermsProblem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [rowValues, setRowValues] = useState<string[]>(['']);
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [isSolutionShown, setIsSolutionShown] = useState(false);
  const [simplificationError, setSimplificationError] = useState(false);

  const exerciseIdRef = useRef('');

  useEffect(() => {
    const newProblem = generateProblem();
    const newId = generateExerciseId();
    exerciseIdRef.current = newId;
    setProblem(newProblem);
    setRowValues(['']);
    setResultMsg('');
    setIsSolutionShown(false);
    setSimplificationError(false);

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: newId,
      exercise_type: id,
      question: JSON.stringify(newProblem), // More complex object, stringify for safety
      outcome: null
    });
  }, [generateProblem, id]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const handleNextProblem = () => {
    const nextProb = generateProblem();
    const nextId = generateExerciseId();
    exerciseIdRef.current = nextId;
    setProblem(nextProb);
    setRowValues(['']);
    setResultMsg('');
    setIsSolutionShown(false);
    setSimplificationError(false);

    logToAxiom({
      level: 'info',
      message: 'Exercise created',
      exercise_id: nextId,
      exercise_type: id,
      question: JSON.stringify(nextProb),
      outcome: null
    });
  };

  const updateRow = (idx: number, val: string) => {
    const isActuallyNew = val !== rowValues[idx];
    if (isActuallyNew) {
      setRowValues(prev => prev.map((rv, i) => (i === idx ? val : rv)));
      setResultMsg('');
      setIsSolutionShown(false);
      setSimplificationError(false);
    }
  };

  const addRow = () => {
    setRowValues([...rowValues, '']);
    setSimplificationError(false);
    setResultMsg('');
  };

  const removeRow = (idx: number) => {
    if (rowValues.length > 1) {
      setRowValues(rowValues.filter((_, i) => i !== idx));
      setSimplificationError(false);
      setResultMsg('');
    }
  };

  const evaluateRationalCoeff = (val: string, v: string): Rational | null => {
    if (!val) return null;
    try {
      // 1. Pre-process mixed fractions correctly
      let p = val
        .replace(/\\text\{[^{}]*\}/g, '')
        .replace(/(\d+)\s*\\frac\s*\{\s*(\d+)\s*\}\s*\{\s*(\d+)\s*\}/g, '($1 + \\frac{$2}{$3})')
        .replace(/(\d+)\s*\\frac\s*(\d)\s*(\d)/g, '($1 + \\frac{$2}{$3})')
        .trim();

      // 2. Parse
      const expr = ce.parse(p);
      const json = expr.json as any;
      
      let num: number | null = null;
      let den: number | null = null;

      // 3. Extract Rational Part
      const walk = (node: any) => {
        if (typeof node === "number") { num = node; den = 1; return; }
        if (Array.isArray(node)) {
          const head = node[0];
          if (head === "Rational") { num = node[1]; den = node[2]; return; }
          if (head === "Divide") {
             if (typeof node[1] === "number") num = node[1];
             // Handle 10/3t where 3t is in denominator
             if (Array.isArray(node[2]) && node[2][0] === "Multiply") {
                 for (const child of node[2]) {
                   if (typeof child === "number") den = child;
                 }
             } else if (typeof node[2] === "number") {
                 den = node[2];
             }
             return;
          }
          if (head === "Add") { // Mixed Fractions
              const can = ce.box(node as any).canonical;
              if ((can.json as any)[0] === "Rational") {
                  num = (can.json as any)[1];
                  den = (can.json as any)[2];
              }
              return;
          }
          if (head === "Multiply" || head === "Negate") {
             for (let i = 1; i < node.length; i++) walk(node[i]);
             if (head === "Negate" && num !== null) num = -num;
          }
        }
      };

      walk(json);
      if (num !== null) return { num, den: den ?? 1 };

      // Fallback: evaluate numerically
      ce.assign(v, 1);
      const res = (expr.N() as any).numericValue;
      const finalNum = typeof res === 'number' ? res : (res as any)?.re ?? (res as any)?.value;
      if (typeof finalNum === 'number') return { num: finalNum, den: 1 };
      
      return null;
    } catch {
      return null;
    }
  };

  const checkAnswers = () => {
    if (!problem) return;
    if (rowValues.some(r => r.trim() === '')) return;

    const v = problem.variable;
    const targetVal = problem.simplified.num / problem.simplified.den;
    let ok = true;

    for (let i = 0; i < rowValues.length; i++) {
      const rowVal = rowValues[i];
      const rat = evaluateRationalCoeff(rowVal, v);
      if (!rat) { ok = false; break; }
      const val = rat.num / rat.den;

      if (Math.abs(val - targetVal) > 1e-9) { ok = false; break; }

      if (i === rowValues.length - 1) {
        if (!MathEngine.checkFractionSimplification(rowVal, problem.simplified, v)) {
          setResultMsg(t('algebra_fraction_not_simplified') || 'Please simplify your final answer.');
          setResultColor("var(--error, red)");
          setSimplificationError(true);

          logToAxiom({
            level: 'info',
            message: 'Solution checked',
            exercise_id: exerciseIdRef.current,
            exercise_type: id,
            steps: rowValues,
            outcome: 'incorrect',
            comment: 'not simplified'
          });

          return;
        }
      }
    }

    const outcome = ok ? 'correct' : 'incorrect';
    logToAxiom({
      level: 'info',
      message: 'Solution checked',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      steps: rowValues,
      outcome,
    });

    if (ok) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        const nextProb = generateProblem();
        const nextId = generateExerciseId();
        exerciseIdRef.current = nextId;
        setProblem(nextProb);

        logToAxiom({
          level: 'info',
          message: 'Exercise created',
          exercise_id: nextId,
          exercise_type: id,
          question: JSON.stringify(nextProb),
          outcome: null
        });

        setRowValues(['']);
        setResultMsg('');
      }, 1000);
    } else {
      setResultMsg(t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    }
  };

  const showSolution = () => {
    if (!problem) return;
    const { num, den } = problem.simplified;
    const v = problem.variable;
    let sol = "";
    if (num === 0) sol = "0";
    else if (den === 1) {
      if (num === 1) sol = v;
      else if (num === -1) sol = `-${v}`;
      else sol = `${num}${v}`;
    }
    else sol = `${num}/${den}${v}`;
    
    setRowValues([sol]);
    setIsSolutionShown(true);
    setSimplificationError(false);
    setResultMsg('');

    logToAxiom({
      level: 'info',
      message: 'Solution shown',
      exercise_id: exerciseIdRef.current,
      exercise_type: id,
      outcome: 'not solved',
      solution: typeof sol !== 'undefined' ? sol : 'Logged in steps',
    });
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button
          onClick={() => setShowExample(!showExample)}
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>

        <div className="question" style={{ fontSize: '36px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr', display: 'flex', justifyContent: 'center' }}>
          <FractionLikePrompt problem={problem} />
        </div>

        <div style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
          {rowValues.map((val, idx) => {
            const isFinal = idx === rowValues.length - 1;
            return (
              <div key={idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label 
                  data-testid={`row-label-${idx}`}
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold', 
                    color: simplificationError && isFinal ? 'var(--error, red)' : '#7f8c8d',
                    textAlign: 'start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'color 0.2s'
                  }}
                >
                  {simplificationError && isFinal ? (
                    `✨ ${dict?.algebra_final_result || 'Final Result'}`
                  ) : (
                    `${dict?.algebra_step_label || 'Step'} ${idx + 1}`
                  )}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', direction: 'ltr', width: '100%' }}>
                  <div style={{ 
                    flex: 1, 
                    borderRadius: '12px', 
                    border: `2px solid ${simplificationError && isFinal ? 'var(--error, red)' : '#ccc'}`, 
                    background: '#fff', 
                    minHeight: '56px', 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '0 12px',
                    boxShadow: simplificationError && isFinal ? '0 0 10px rgba(231, 76, 60, 0.2)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <MathInput 
                      value={val} 
                      onChange={(v) => updateRow(idx, v)}
                      onFocus={() => {
                        setSimplificationError(false);
                        setResultMsg('');
                      }}
                      onEnter={isSolutionShown ? () => {
                        setProblem(generateProblem());
                        setRowValues(['']);
                        setIsSolutionShown(false);
                        setResultMsg('');
                      } : checkAnswers}
                      style={{ width: '100%', outline: 'none', border: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {rowValues.length > 1 && (
                      <button className="btn-check" onClick={() => removeRow(idx)} style={{ padding: '8px', width: '40px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
                    )}
                    {isFinal && (
                      <button id="btn-add-row" className="btn-check" onClick={addRow} style={{ padding: '8px', minWidth: '40px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>+</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={isSolutionShown ? handleNextProblem : checkAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem', background: isSolutionShown ? '#27ae60' : undefined }}>
            {isSolutionShown ? (t('algebra_next_exercise') || 'Next') : t('algebra_check_ans')}
          </button>
          <button className="btn-check" onClick={showSolution} style={{ maxWidth: '160px', fontSize: '1.1rem', background: '#95a5a6' }}>
            {t('btn_show_sol')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1.1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


function RoundingWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  dict,
  id
}: { 
  generateProblem: () => RoundingProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  dict: Record<string, string>,
  id: string
}) {
  const [problem, setProblem] = useState<RoundingProblem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [answer, setAnswer] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkAnswer = () => {
    if (!problem) return;
    if (answer.trim() === '') return;

    if (MathEngine.checkNumeric(answer, problem.a)) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");

      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        setProblem(generateProblem());
        setAnswer('');
        setResultMsg('');
      }, 1000);
    } else {
      setResultMsg(t('algebra_incorrect'));
      setResultColor("var(--error, red)");
    }
  };

  if (!problem) return null;

  return (
    <div className="rules-box" style={{ flex: 1, textAlign: 'center', marginTop: '0', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: '0', fontSize: '1.4rem', color: 'var(--dark)' }}>{title}</h3>
        <button 
          onClick={() => setShowExample(!showExample)} 
          style={{ padding: '8px 12px', borderRadius: '6px', background: showExample ? '#dcdde1' : 'var(--accent)', color: showExample ? '#333' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showExample ? t('algebra_hide_examples') : t('algebra_show_examples')}
        </button>
      </div>

      {showExample && (
        <div style={{ textAlign: 'start', background: '#fdfaf6', border: '1px solid #e9d8c4', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          {exampleContent}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p id="level" style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '5px' }}>
          {t('algebra_level').replace('{count}', String(solvedCount))}
        </p>
        
        <div className="question" style={{ fontSize: '28px', margin: '20px 0', fontFamily: 'var(--mono)', color: 'var(--dark)', direction: 'ltr' }}>
          {t('algebra_rounding_prompt').replace('{num}', String(problem.num)).replace('{count}', String(problem.precision))}
        </div>

        <input
          type="number"
          step="any"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          style={{
            padding: '12px',
            fontSize: '1.5rem',
            width: '120px',
            textAlign: 'center',
            borderRadius: '8px',
            border: '2px solid #ccc',
            margin: '0 auto',
            display: 'block',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              checkAnswer();
            }
          }}
        />
        <br />
        <div>
          <button className="btn-check" onClick={checkAnswer} style={{ marginTop: '5px', maxWidth: '200px', fontSize: '1.1rem' }}>
            {t('algebra_check_ans')}
          </button>
        </div>

        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {resultMsg && (
            <p className="result" style={{ margin: 0, fontWeight: 'bold', color: resultColor, fontSize: '1.1rem' }}>
              {resultMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlgebraClient({ dict, children }: Props) {
  const [activeTab, setActiveTab] = usePersistentState<'addsub' | 'muldiv' | 'rounding' | 'twostep' | 'combinelike' | 'fractionlike'>('algebraActiveTab', 'addsub');
  
  const t = (key: string, params: Record<string, string | number> = {}) => {
    let str = dict[key] ?? key
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v))
    }
    return str
  }


  const addSubExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_addsub_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_addsub_ex1') }} />
        <li dangerouslySetInnerHTML={{ __html: t('algebra_addsub_ex2') }} />
      </ul>
    </>
  );

  const mulDivExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_muldiv_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_muldiv_ex1') }} />
        <li dangerouslySetInnerHTML={{ __html: t('algebra_muldiv_ex2') }} />
      </ul>
    </>
  );

  const twoStepExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_twostep_desc') }} />
      <div style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_twostep_ex1') }} />
    </>
  );

  const combineLikeExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_combinelike_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_combinelike_ex1') }} />
      </ul>
    </>
  );

  const roundingExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_rounding_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_rounding_ex1') }} />
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_rounding_ex2') }} />
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_rounding_ex3') }} />
      </ul>
    </>
  );

  const fractionLikeExamples = (
    <>
      <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 10px', color: '#555' }} dangerouslySetInnerHTML={{ __html: t('algebra_fraction_like_desc') }} />
      <ul style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0', paddingInlineStart: '20px', color: '#555' }}>
        <li style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('algebra_fraction_like_ex1') }} />
      </ul>
    </>
  );

  return (
    <section className="page active" id="algebra-page" style={{ paddingBottom: '60px' }}>
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        input[type=number] {
          -moz-appearance: textfield !important;
        }
      `}</style>
      <div className="container" style={{ maxWidth: '800px', width: '90%' }}>
        {children}

        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          
          {/* Vertical Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: '1 1 180px', maxWidth: '300px' }}>
            <button 
              onClick={() => setActiveTab('addsub')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'addsub' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'addsub' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'addsub' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'addsub' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_addsub')}
            </button>
            <button 
              onClick={() => setActiveTab('muldiv')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'muldiv' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'muldiv' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'muldiv' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'muldiv' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_muldiv')}
            </button>
            <button 
              onClick={() => setActiveTab('rounding')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'rounding' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'rounding' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'rounding' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'rounding' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_rounding')}
            </button>
            <button 
              onClick={() => setActiveTab('twostep')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'twostep' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'twostep' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'twostep' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'twostep' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_twostep')}
            </button>
            <button 
              onClick={() => setActiveTab('combinelike')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'combinelike' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'combinelike' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'combinelike' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'combinelike' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_combinelike')}
            </button>
            <button
              id="tab-fractionlike"
              onClick={() => setActiveTab('fractionlike')}
              style={{
                padding: '18px 15px',
                background: activeTab === 'fractionlike' ? 'var(--accent)' : '#ecf0f1',
                color: activeTab === 'fractionlike' ? '#fff' : '#2c3e50',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                boxShadow: activeTab === 'fractionlike' ? '0 6px 15px rgba(142, 68, 173, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                transform: activeTab === 'fractionlike' ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {t('algebra_btn_fraction_like')}
            </button>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: '3 1 350px', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'addsub' && (
              <AlgebraWindow 
                id="addsub"
                title={t('algebra_btn_addsub')} 
                generateProblem={MathGen.getProblemGenerator('add-sub')} 
                exampleContent={addSubExamples}
                t={t}
                dict={dict}
              />
            )}
            {activeTab === 'muldiv' && (
              <AlgebraWindow 
                id="muldiv"
                title={t('algebra_btn_muldiv')} 
                generateProblem={MathGen.getProblemGenerator('mul-div')} 
                exampleContent={mulDivExamples}
                t={t}
                dict={dict}
              />
            )}
            {activeTab === 'rounding' && (
              <RoundingWindow 
                id="rounding"
                title={t('algebra_btn_rounding')} 
                generateProblem={MathGen.getProblemGenerator('rounding') as any} 
                exampleContent={roundingExamples}
                t={t}
                dict={dict}
              />
            )}
            {activeTab === 'twostep' && (
              <TwoStepAlgebraWindow 
                id="twostep"
                title={t('algebra_btn_twostep')} 
                generateProblem={MathGen.getProblemGenerator('two-step') as any} 
                exampleContent={twoStepExamples}
                t={t}
                dict={dict}
              />
            )}
            {activeTab === 'combinelike' && (
              <CombiningLikeTermsWindow 
                id="combinelike"
                title={t('algebra_btn_combinelike')} 
                generateProblem={MathGen.getProblemGenerator('combining-like-terms') as any} 
                exampleContent={combineLikeExamples}
                t={t}
                dict={dict}
              />
            )}
            {activeTab === 'fractionlike' && (
              <CombiningFractionLikeTermsWindow
                id="fractionlike"
                title={t('algebra_btn_fraction_like')}
                generateProblem={MathGen.getProblemGenerator('combining-fraction-like-terms') as any}
                exampleContent={fractionLikeExamples}
                t={t}
                dict={dict}
              />
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
