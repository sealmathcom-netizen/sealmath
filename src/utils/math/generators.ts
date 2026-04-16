import { 
  BaseProblem, 
  TwoStepProblem, 
  RoundingProblem, 
  LikeTermsProblem,
  ExerciseCategory,
  Rational,
  CombiningFractionLikeTermsProblem
} from './types';

/**
 * Formats a coefficient and variable pedagogically (e.g., 1x -> x, -1x -> -x, 2/1x -> 2x)
 */
function formatTerm(c: Rational, v: string): string {
  if (c.num === 0) return '0';
  if (c.den === 1) {
    if (c.num === 1) return v;
    if (c.num === -1) return `-${v}`;
    return `${c.num}${v}`;
  }
  return `${c.num}/${c.den}${v}`;
}

/**
 * Common Greatest Common Divisor
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const tmp = y;
    y = x % y;
    x = tmp;
  }
  return x || 1;
}

export function generateAddSubProblem(): BaseProblem {
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

export function generateMulDivProblem(): BaseProblem {
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

export function generateTwoStepProblem(): TwoStepProblem {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 8) + 2; 
  const b = Math.floor(Math.random() * 20) + 1;

  if (!isAdd) {
    const c = Math.floor(Math.random() * 30) + 5; 
    const step1Ans = c + b;
    const x = step1Ans / a;
    return {
      q: `${a}x - ${b} = ${c}`,
      a: x,
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
      a: x,
      step1Prefix: `${a}x =`,
      step1Ans: step1Ans,
      step2Prefix: `x =`,
      step2Ans: x
    };
  }
}

export function generateRoundingProblem(): RoundingProblem {
  const base = Math.floor(Math.random() * 20) + 1;
  let dec: number;
  
  if (Math.random() < 1/3) {
    const tenths = Math.floor(Math.random() * 9);
    const hundredths = 9;
    const thousandths = Math.floor(Math.random() * 5) + 5;
    dec = (tenths * 0.1) + (hundredths * 0.01) + (thousandths * 0.001);
  } else {
    dec = Math.floor(Math.random() * 1000) / 1000;
  }
  
  const num = Math.round((base + dec) * 1000) / 1000;
  const precision = 2;
  const ans = Math.round(Math.round(num * 1000) / 10) / 100;
  
  return { q: String(num), num, precision, a: ans };
}

export function generateCombiningLikeTermsProblem(): LikeTermsProblem {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 12) + 2; 
  const b = Math.floor(Math.random() * 12) + 2;
  const variables = ['x', 'y', 't', 'd'];
  const variable = variables[Math.floor(Math.random() * variables.length)];
  const resultCoeff = isAdd ? (a + b) : (a - b);

  return {
    q: `${a}${variable} ${isAdd ? '+' : '-'} ${b}${variable}`,
    a: resultCoeff,
    variable,
    isAdd,
    leftCoeff: a,
    rightCoeff: b
  };
}

export function normalizeRational(num: number, den: number): Rational {
  if (den === 0) return { num, den };
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: sign * (num / g), den: Math.abs(den / g) };
}

export function generateCombiningFractionLikeTermsProblem(): CombiningFractionLikeTermsProblem {
  const variableOptions = ['x', 'y', 't', 'd'];
  const variable = variableOptions[Math.floor(Math.random() * variableOptions.length)];
  const isAdd = Math.random() > 0.5;

  let left: Rational = { num: 1, den: 2 };
  let right: Rational = { num: 1, den: 3 };
  let attempts = 0;

  while (attempts < 50) {
    const den1 = Math.floor(Math.random() * 5) + 2; 
    const den2 = Math.floor(Math.random() * 5) + 2; 
    const num1 = Math.floor(Math.random() * 7) + 1; 
    const num2 = Math.floor(Math.random() * 7) + 1; 

    left = normalizeRational(num1, den1);
    right = normalizeRational(num2, den2);

    if (left.den !== 1 || right.den !== 1) break;
    attempts += 1;
  }

  const unsNum = isAdd ? (left.num * right.den + right.num * left.den) : (left.num * right.den - right.num * left.den);
  const unsDen = left.den * right.den;
  const unsimplified = { num: unsNum, den: unsDen };
  const simplified = normalizeRational(unsNum, unsDen);

  const q = `${formatTerm(left, variable)} ${isAdd ? '+' : '-'} ${formatTerm(right, variable)}`;

  return { q, variable, isAdd, left, right, unsimplified, simplified, a: simplified.num / simplified.den };
}

/**
 * Master Factory for problem generation
 */
export function getProblemGenerator(category: ExerciseCategory) {
  switch (category) {
    case 'add-sub': return generateAddSubProblem;
    case 'mul-div': return generateMulDivProblem;
    case 'two-step': return generateTwoStepProblem;
    case 'rounding': return generateRoundingProblem;
    case 'combining-like-terms': return generateCombiningLikeTermsProblem;
    case 'combining-fraction-like-terms': return generateCombiningFractionLikeTermsProblem;
    default: return generateAddSubProblem;
  }
}
