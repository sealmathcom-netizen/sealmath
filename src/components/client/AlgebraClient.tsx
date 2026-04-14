/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import MathInput from '../common/MathInput';
import type { Lang } from '../../i18n/translations';

type Props = {
  lang: Lang;
  dict: Record<string, string>;
  children?: React.ReactNode;
};

type Problem = { q: string, a: number };

function generateAddSubProblem(): Problem {
  const isAdd = Math.random() > 0.5;
  const x = Math.floor(Math.random() * 20) + 1;
  const a = Math.floor(Math.random() * 20) + 1;
  if (isAdd) {
    return { q: `x + ${a} = ${x + a}`, a: x };
  } else {
    const newX = x + a;
    return { q: `x - ${a} = ${newX - a}`, a: newX };
  }
}

function generateMulDivProblem(): Problem {
  const isMul = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 9) + 2; 
  if (isMul) {
    const x = Math.floor(Math.random() * 12) + 1;
    return { q: `${a}x = ${a * x}`, a: x };
  } else {
    const b = Math.floor(Math.random() * 12) + 1;
    const x = a * b;
    return { q: `x / ${a} = ${b}`, a: x };
  }
}

function AlgebraWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  id
}: { 
  generateProblem: () => Problem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  id: string
}) {
  const [problem, setProblem] = useState<Problem | null>(null);
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
    const userAnswer = Number(answer);
    if (answer.trim() === '') return;

    if (userAnswer === problem.a) {
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
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
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

type TwoStepProblem = {
  q: string;
  step1Prefix: string;
  step1Ans: number;
  step2Prefix: string;
  step2Ans: number;
};

function generateTwoStepProblem(): TwoStepProblem {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 8) + 2; 
  const b = Math.floor(Math.random() * 20) + 1;

  if (!isAdd) {
    const c = Math.floor(Math.random() * 30) + 5; 
    const step1Ans = c + b;
    const x = step1Ans / a;
    return {
      q: `${a}x - ${b} = ${c}`,
      step1Prefix: `${a}x =`,
      step1Ans: step1Ans,
      step2Prefix: `x =`,
      step2Ans: x
    };
  } else {
    const c = b + Math.floor(Math.random() * 30) + 5; 
    const step1Ans = c - b;
    const x = step1Ans / a;
    return {
      q: `${a}x + ${b} = ${c}`,
      step1Prefix: `${a}x =`,
      step1Ans: step1Ans,
      step2Prefix: `x =`,
      step2Ans: x
    };
  }
}

function TwoStepAlgebraWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  id
}: { 
  generateProblem: () => TwoStepProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
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

  useEffect(() => {
    setProblem(generateProblem());
    setIsSolutionShown(false);
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkBothAnswers = () => {
    if (!problem) return;
    const v1 = Number(ans1);
    const v2 = Number(ans2);
    if (ans1.trim() === '' || ans2.trim() === '') return;

    const isPhase1Correct = v1 === problem.step1Ans;
    const expectedRounded2 = Math.round((problem.step2Ans + Number.EPSILON) * 100) / 100;
    const isPhase2Correct = (v2 === expectedRounded2) || (v2 === problem.step2Ans);

    if (isPhase1Correct && isPhase2Correct) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        setProblem(generateProblem());
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
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <span style={{ width: '80px', textAlign: 'right' }}>{problem.step2Prefix}</span>
          <input
            type="number" step="any" value={ans2} onChange={e => { setAns2(e.target.value); setIsSolutionShown(false); }}
            style={{ padding: '8px', fontSize: '1.4rem', width: '100px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={isSolutionShown ? () => {
            setProblem(generateProblem());
            setAns1('');
            setAns2('');
            setIsSolutionShown(false);
            setResultMsg('');
          } : checkBothAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem', background: isSolutionShown ? '#27ae60' : undefined }}>
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

type CombiningLikeTermsProblem = {
  q: string;
  a: number;
  b: number;
  isAdd: boolean;
  variable: string;
};

type Rational = {
  num: number;
  den: number;
};

type CombiningFractionLikeTermsProblem = {
  q: string;
  variable: string;
  isAdd: boolean;
  left: Rational;
  right: Rational;
  unsimplified: Rational;
  simplified: Rational;
};

type RoundingProblem = {
  num: number;
  precision: number;
  ans: number;
};

function generateRoundingProblem(): RoundingProblem {
  const base = Math.floor(Math.random() * 20) + 1;
  let dec: number;
  
  if (Math.random() < 1/3) {
    // Force a "carry over" case: x.y9[5-9]
    // e.g., 5.696 rounded to 2 decimals is 5.70
    const tenths = Math.floor(Math.random() * 9); // 0-8 to allow carry to y+1
    const hundredths = 9;
    const thousandths = Math.floor(Math.random() * 5) + 5; // 5-9
    dec = (tenths * 0.1) + (hundredths * 0.01) + (thousandths * 0.001);
  } else {
    // Normal case
    dec = Math.floor(Math.random() * 1000) / 1000;
  }
  
  const num = Math.round((base + dec) * 1000) / 1000;
  
  // Target precision: always 2 as requested
  const precision = 2;
  
  // Calculate answer robustly to avoid float precision issues (e.g. 17.115 * 100 = 1711.499...)
  // Since we know num has at most 3 decimals, we can scale to integer first.
  const ans = Math.round(Math.round(num * 1000) / 10) / 100;
  
  return { num, precision, ans };
}

function generateCombiningLikeTermsProblem(): CombiningLikeTermsProblem {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 12) + 2; 
  const b = Math.floor(Math.random() * 12) + 2;
  const variables = ['x', 'y', 't', 'd'];
  const variable = variables[Math.floor(Math.random() * variables.length)];
  return {
    q: `${a}${variable} ${isAdd ? '+' : '-'} ${b}${variable}`,
    a,
    b,
    isAdd,
    variable
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const tmp = y;
    y = x % y;
    x = tmp;
  }
  return x || 1;
}

function normalizeRational(num: number, den: number): Rational {
  if (den === 0) return { num, den };
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: sign * (num / g), den: Math.abs(den / g) };
}

function rationalToCoeffText(r: Rational, variable: string): string {
  if (r.den === 1) return `${r.num}${variable}`;
  return `${r.num}/${r.den}${variable}`;
}

function FractionText({ num, den }: Rational) {
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
  if (coeff.den === 1) {
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

function generateCombiningFractionLikeTermsProblem(): CombiningFractionLikeTermsProblem {
  const variableOptions = ['x', 'y', 't', 'd'];
  const variable = variableOptions[Math.floor(Math.random() * variableOptions.length)];
  const isAdd = Math.random() > 0.5;

  let left: Rational = { num: 1, den: 2 };
  let right: Rational = { num: 1, den: 3 };
  let attempts = 0;

  // Guarantee at least one non-trivial fraction in the exercise prompt.
  while (attempts < 50) {
    const den1 = Math.floor(Math.random() * 5) + 2; // 2-6
    const den2 = Math.floor(Math.random() * 5) + 2; // 2-6
    const num1 = Math.floor(Math.random() * 7) + 1; // 1-7
    const num2 = Math.floor(Math.random() * 7) + 1; // 1-7

    left = normalizeRational(num1, den1);
    right = normalizeRational(num2, den2);

    if (left.den !== 1 || right.den !== 1) break;
    attempts += 1;
  }

  const unsNum = isAdd ? (left.num * right.den + right.num * left.den) : (left.num * right.den - right.num * left.den);
  const unsDen = left.den * right.den;
  const unsimplified = { num: unsNum, den: unsDen };
  const simplified = normalizeRational(unsNum, unsDen);

  const q = `${left.num}/${left.den}${variable} ${isAdd ? '+' : '-'} ${right.num}/${right.den}${variable}`;

  return { q, variable, isAdd, left, right, unsimplified, simplified };
}

function CombiningLikeTermsWindow({ 
  generateProblem, 
  title, 
  exampleContent,
  t,
  id
}: { 
  generateProblem: () => CombiningLikeTermsProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
  id: string
}) {
  const [problem, setProblem] = useState<CombiningLikeTermsProblem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
    setIsSolutionShown(false);
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const checkBothAnswers = () => {
    if (!problem) return;
    if (ans1.trim() === '' || ans2.trim() === '') return;

    const v = problem.variable;
    const a = problem.a;
    const b = problem.b;
    
    const normalizedAns1 = ans1.replace(/\s+/g, '').toLowerCase();
    const resultNum = problem.isAdd ? (a + b) : (a - b);
    
    // Step 1: Flexible factoring check. Must be equivalent to (a+b)v and show parentheses.
    let isStep1Correct = false;
    if (normalizedAns1.includes(v) && normalizedAns1.includes('(')) {
      try {
        // Prepare string for JS evaluation: 
        // 1. Handle implicit multiplication before parentheses and between variable/number
        let expr = normalizedAns1
          .replace(new RegExp(`(\\d)${v}`, 'g'), '$1*(1)')
          .replace(new RegExp(v, 'g'), '(1)')
          .replace(/(\d)(\()/g, '$1*$2')
          .replace(/(\))(\d)/g, '$1*$2')
          .replace(/(\))(\()/g, '$1*$2');
        
        if (/^[0-9\+\-\*\/\(\)\.]*$/.test(expr)) {
          const val = Function('"use strict";return (' + expr + ')')();
          if (val === resultNum) isStep1Correct = true;
        }
      } catch (e) {
        isStep1Correct = false;
      }
    }
    
    // Step 2: Full simplified expression like "13x"
    const normalizedAns2 = ans2.replace(/\s+/g, '').toLowerCase();
    const expectedAns2 = resultNum === 0 ? "0" : `${resultNum}${v}`;
    const isStep2Correct = normalizedAns2 === expectedAns2;

    if (isStep1Correct && isStep2Correct) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        setProblem(generateProblem());
        setAns1('');
        setAns2('');
        setResultMsg('');
      }, 1000);
    } else if (!isStep1Correct) {
      setResultMsg(t('algebra_combinelike_err1'));
      setResultColor("var(--error, red)");
    } else {
      setResultMsg(t('algebra_combinelike_err2'));
      setResultColor("var(--error, red)");
    }
  };

  const showSolution = () => {
    if (!problem) return;
    const resultNum = problem.isAdd ? (problem.a + problem.b) : (problem.a - problem.b);
    setAns1(`${problem.variable}(${problem.a} ${problem.isAdd ? '+' : '-'} ${problem.b})`);
    setAns2(resultNum === 0 ? "0" : `${resultNum}${problem.variable}`);
    setResultMsg('');
    setIsSolutionShown(true);
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
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', direction: 'ltr', fontFamily: 'var(--mono)', fontSize: '1.5rem' }}>
          <input
            type="text" value={ans2} onChange={e => { setAns2(e.target.value); setIsSolutionShown(false); }}
            placeholder={`result${problem.variable}`}
            style={{ padding: '8px', fontSize: '1.4rem', width: '200px', textAlign: 'center', borderRadius: '6px', border: '2px solid #ccc' }}
            onKeyDown={e => e.key === 'Enter' && checkBothAnswers()}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={isSolutionShown ? () => {
            setProblem(generateProblem());
            setAns1('');
            setAns2('');
            setIsSolutionShown(false);
            setResultMsg('');
          } : checkBothAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem', background: isSolutionShown ? '#27ae60' : undefined }}>
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
  id
}: {
  generateProblem: () => CombiningFractionLikeTermsProblem,
  title: string,
  exampleContent: ReactNode,
  t: any,
  id: string
}) {
  const [problem, setProblem] = useState<CombiningFractionLikeTermsProblem | null>(null);
  const [solvedCount, setSolvedCount] = usePersistentState<number>(`algebra_solved_${id}`, 0);
  const [rowValues, setRowValues] = useState<string[]>(['']);
  const [resultMsg, setResultMsg] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showExample, setShowExample] = useState(false);
  const [isSolutionShown, setIsSolutionShown] = useState(false);

  useEffect(() => {
    setProblem(generateProblem());
    setRowValues(['']);
    setResultMsg('');
    setIsSolutionShown(false);
  }, [generateProblem]);

  useEffect(() => {
    const handleClear = () => setSolvedCount(0);
    window.addEventListener('clear-history', handleClear);
    return () => window.removeEventListener('clear-history', handleClear);
  }, []);

  const latexToPlain = (latex: string) => {
    return latex
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\\(enspace|quad|qquad| )/g, ' ')
      .replace(/(\d+)\\frac/g, '$1 \\frac')
      .replace(/\\frac(?:\{([^{}]*)\}|(\d))(?:\{([^{}]*)\}|(\d))/g, (match, p1, p2, p3, p4) => {
        const num = p1 === undefined ? p2 : p1;
        const den = p3 === undefined ? p4 : p3;
        return `${num}/${den}`;
      })
      .replace(/(\d+)\s+(\d+)\/(\d+)/g, '($1+$2/$3)') // mixed fraction to (a+b/c)
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\cdot/g, '*')
      .replace(/\{/g, '')
      .replace(/\}/g, '')
      .replace(/\\/g, '');
  };

  const updateRow = (idx: number, val: string) => {
    setRowValues(prev => prev.map((rv, i) => (i === idx ? val : rv)));
    setResultMsg('');
    setIsSolutionShown(false);
  };

  const addRow = () => {
    setRowValues([...rowValues, '']);
  };

  const removeRow = (idx: number) => {
    if (rowValues.length > 1) {
      setRowValues(rowValues.filter((_, i) => i !== idx));
    }
  };

  const evaluateRationalCoeff = (val: string, v: string): Rational | null => {
    const plain = latexToPlain(val);
    const s = plain.trim().toLowerCase().replace(/\s+/g, '');
    
    // Check if it's purely '0'
    if (s === '0') return { num: 0, den: 1 };
    
    // Safety check for variable
    if (!s.includes(v)) return null;

    try {
      // Prepare string for JS evaluation: 
      // Handle implicit multiplication and variable replacement
      let expr = s
        .replace(new RegExp(`(\\d)${v}`, 'g'), '$1*(1)') // 4t -> 4*(1)
        .replace(new RegExp(v, 'g'), '(1)')             // t -> (1)
        .replace(/(\d)(\()/g, '$1*$2')                  // 4( -> 4*(
        .replace(/(\))(\d)/g, '$1*$2')                  // )4 -> )*4
        .replace(/(\))(\()/g, '$1*$2');                 // )( -> )*(
      
      // Safety filter for permitted mathematical characters
      if (/^[0-9\+\-\*\/\(\)\.]*$/.test(expr)) {
        const value = Function('"use strict";return (' + expr + ')')();
        if (!isNaN(value)) {
           // Return as Rational. Denominator 1 is fine since checkAnswers compares numerically.
           return { num: value, den: 1 };
        }
      }
    } catch (e) {}

    return null;
  };

  const checkAnswers = () => {
    if (!problem) return;
    if (rowValues.some(r => r.trim() === '')) return;

    const v = problem.variable;
    const targetVal = problem.simplified.num / problem.simplified.den;
    let ok = true;

    for (const rowVal of rowValues) {
      const rat = evaluateRationalCoeff(rowVal, v);
      if (!rat) { ok = false; break; }
      const val = rat.num / rat.den;
      if (Math.abs(val - targetVal) > 1e-9) { ok = false; break; }
    }

    if (ok) {
      setResultMsg(t('algebra_correct'));
      setResultColor("var(--success, green)");
      setTimeout(() => {
        setSolvedCount(solvedCount + 1);
        setProblem(generateProblem());
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
    else if (den === 1) sol = `${num}${v}`;
    else sol = `${num}/${den}${v}`;
    
    setRowValues([sol]);
    setIsSolutionShown(true);
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

        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
          {rowValues.map((val, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', direction: 'ltr', width: '100%' }}>
              <div style={{ 
                flex: 1, 
                borderRadius: '8px', 
                border: '2px solid #ccc', 
                background: '#fff', 
                minHeight: '52px', 
                display: 'flex', 
                alignItems: 'center',
                padding: '0 8px'
              }}>
                <MathInput 
                  value={val} 
                  onChange={(v) => updateRow(idx, v)}
                  placeholder={idx === 0 ? "..." : ""}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {idx === rowValues.length - 1 && (
                  <button className="btn-check" onClick={addRow} style={{ padding: '8px', width: '40px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                )}
                {rowValues.length > 1 && (
                  <button className="btn-check" onClick={() => removeRow(idx)} style={{ padding: '8px', width: '40px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-check" onClick={isSolutionShown ? () => {
            setProblem(generateProblem());
            setRowValues(['']);
            setIsSolutionShown(false);
            setResultMsg('');
          } : checkAnswers} style={{ maxWidth: '160px', fontSize: '1.1rem', background: isSolutionShown ? '#27ae60' : undefined }}>
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
  id
}: { 
  generateProblem: () => RoundingProblem, 
  title: string, 
  exampleContent: ReactNode,
  t: any,
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
    const userAnswer = Number(answer);
    if (answer.trim() === '') return;

    // Use a small epsilon for float comparison
    if (Math.abs(userAnswer - problem.ans) < 0.000001) {
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
          onKeyDown={e => e.key === 'Enter' && checkAnswer()}
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
                generateProblem={generateAddSubProblem} 
                exampleContent={addSubExamples}
                t={t}
              />
            )}
            {activeTab === 'muldiv' && (
              <AlgebraWindow 
                id="muldiv"
                title={t('algebra_btn_muldiv')} 
                generateProblem={generateMulDivProblem} 
                exampleContent={mulDivExamples}
                t={t}
              />
            )}
            {activeTab === 'rounding' && (
              <RoundingWindow 
                id="rounding"
                title={t('algebra_btn_rounding')} 
                generateProblem={generateRoundingProblem} 
                exampleContent={roundingExamples}
                t={t}
              />
            )}
            {activeTab === 'twostep' && (
              <TwoStepAlgebraWindow 
                id="twostep"
                title={t('algebra_btn_twostep')} 
                generateProblem={generateTwoStepProblem} 
                exampleContent={twoStepExamples}
                t={t}
              />
            )}
            {activeTab === 'combinelike' && (
              <CombiningLikeTermsWindow 
                id="combinelike"
                title={t('algebra_btn_combinelike')} 
                generateProblem={generateCombiningLikeTermsProblem} 
                exampleContent={combineLikeExamples}
                t={t}
              />
            )}
            {activeTab === 'fractionlike' && (
              <CombiningFractionLikeTermsWindow
                id="fractionlike"
                title={t('algebra_btn_fraction_like')}
                generateProblem={generateCombiningFractionLikeTermsProblem}
                exampleContent={fractionLikeExamples}
                t={t}
              />
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
