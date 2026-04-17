
export type Rational = { num: number; den: number };

export function normalizeRational(num: number, den: number): Rational {
  const common = (a: number, b: number): number => (b === 0 ? a : common(b, a % b));
  const divisor = Math.abs(common(num, den));
  let n = num / divisor;
  let d = den / divisor;
  if (d < 0) { n = -n; d = -d; }
  return { num: n, den: d };
}

export function formatRational(r: Rational): string {
  if (r.den === 1) return String(r.num);
  if (r.num < 0) return `-\\frac{${-r.num}}{${r.den}}`;
  return `\\frac{${r.num}}{${r.den}}`;
}

export function formatTerm(coeff: Rational, variable: string): string {
  if (coeff.num === 0) return "";
  if (coeff.num === 1 && coeff.den === 1) return variable;
  if (coeff.num === -1 && coeff.den === 1) return `-${variable}`;
  return `${formatRational(coeff)}${variable}`;
}

export function generateComplexEquationProblem(): any {
  const isDistrib = Math.random() < 0.33;
  if (isDistrib) {
    const a = Math.floor(Math.random() * 8) + 2;
    const x = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 10) + 2;
    const isAdd = Math.random() < 0.5;
    const c = isAdd ? a * (x + b) : a * (x - b);
    const q = `${a}(x ${isAdd ? "+" : "-"} ${b}) = ${c}`;
    const step1 = `x ${isAdd ? "+" : "-"} ${b} = ${c / a}`;
    const step2 = `x = ${x}`;
    return { 
      type: "distribution", 
      q, 
      a: x, rationalA: { num: x, den: 1 }, 
      steps: [step1, step2],
      variable: 'x',
      step: step1
    };
  } else {
    const xVal = Math.floor(Math.random() * 8) + 1;
    const genPart = () => {
      if (Math.random() < 0.5) {
        const den = [2, 3, 4, 5, 10][Math.floor(Math.random() * 5)];
        const num = Math.floor(Math.random() * 9) + 1;
        return normalizeRational(num, den);
      }
      return { num: Math.floor(Math.random() * 9) + 1, den: 1 };
    };
    let a = genPart(); let b = genPart(); let c = { num: Math.floor(Math.random() * 4) + 1, den: 1 }; 
    while (a.num * c.den === c.num * a.den) a = genPart();
    const amc = normalizeRational(a.num * c.den - c.num * a.den, a.den * c.den);
    const amcX = { num: amc.num * xVal, den: amc.den };
    const dNum = amcX.num * b.den + b.num * amcX.den;
    const dDen = amcX.den * b.den;
    const d = normalizeRational(dNum, dDen);
    type EqPart = { r: Rational; v: string };
    const parts: EqPart[] = [ { r: a, v: "x" }, { r: b, v: "" }, { r: { num: -c.num, den: c.den }, v: "x" }, { r: { num: -d.num, den: d.den }, v: "" } ];
    const left: EqPart[] = []; const right: EqPart[] = [];
    parts.forEach(p => { if (Math.random() < 0.5) left.push(p); else right.push({ r: { num: -p.r.num, den: p.r.den }, v: p.v }); });
    const formatSide = (sideParts: EqPart[]) => {
      if (sideParts.length === 0) return "0";
      let res = "";
      sideParts.forEach((p, i) => {
        const term = p.v ? formatTerm(p.r, p.v) : formatRational(p.r);
        if (i === 0) res = term;
        else { if (term.startsWith("-")) res += ` - ${term.substring(1)}`; else res += ` + ${term}`; }
      });
      return res;
    };
    const coeffX = normalizeRational(a.num * c.den - c.num * a.den, a.den * c.den);
    const constTerm = normalizeRational(d.num * b.den - b.num * d.den, d.den * b.den);
    const step1 = `${formatTerm(coeffX, "x")} = ${formatRational(constTerm)}`;
    const step2 = `x = ${xVal}`;
    
    const base = { 
      type: "two-side", 
      q: `${formatSide(left)} = ${formatSide(right)}`, 
      a: xVal, rationalA: { num: xVal, den: 1 }, 
      variable: 'x',
      step: step1
    };

    if (Math.abs(coeffX.num) === 1 && coeffX.den === 1) {
       return { ...base, steps: [step1] };
    }
    return { ...base, steps: [step1, step2] };
  }
}

export function generateWordProblem(t?: any): any {
  const x = Math.floor(Math.random() * 10) + 1;
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 10) + 2;
  const c = a * x + b;
  const text = typeof t === 'function' ? t('word_prob_simple', { a, b, c }) : `If ${a}x + ${b} = ${c}, what is x?`;
  return { text, a: x, coeff: a, b, c, rationalA: x, x, equation: `${a}x+${b}=${c}` };
}

export function getProblemGenerator(type: string, t?: any) {
  return () => {
    if (type === 'add-sub') {
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 20) + 1;
      const op = Math.random() < 0.5 ? '+' : '-';
      return { q: `x ${op} ${a} = ${b}`, a: op === '+' ? b - a : b + a };
    }
    if (type === 'mul-div') {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 1;
      return Math.random() < 0.5 ? { q: `${a}x = ${a * b}`, a: b } : { q: `x / ${a} = ${b}`, a: a * b };
    }
    if (type === 'rounding') {
      const num = Math.random() * 100;
      return { q: `Round ${num.toFixed(3)} to 2 decimal places`, a: parseFloat(num.toFixed(2)) };
    }
    if (type === 'two-step') {
      const a = Math.floor(Math.random() * 8) + 2;
      const x = Math.floor(Math.random() * 8) + 1;
      const b = Math.floor(Math.random() * 10) + 2;
      const isAdd = Math.random() < 0.5;
      const c = isAdd ? a * x + b : a * x - b;
      return { q: `${a}x ${isAdd ? "+" : "-"} ${b} = ${c}`, a: x, rationalA: { num: x, den: 1 }, steps: [ `${a}x = ${c - (isAdd ? b : -b)}`, `x = ${x}` ] };
    }
    if (type === 'combining-like-terms') {
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 12) + 2;
      const variable = ['x', 'y', 'z', 'a', 'b'][Math.floor(Math.random() * 5)];
      const isAdd = Math.random() < 0.5;
      const ans = `${isAdd ? a + b : a - b}${variable}`;
      return { q: `${a}${variable} ${isAdd ? '+' : '-'} ${b}${variable}`, a: ans, steps: [ans] };
    }
    if (type === 'fractions-like-terms') {
      const genFrac = () => {
        let n = 1, d = 1, r = {num: 1, den: 1};
        do {
          d = [2, 3, 4, 5, 6, 8, 9, 10][Math.floor(Math.random() * 8)];
          n = Math.floor(Math.random() * (d - 1)) + 1;
          if (Math.random() < 0.5) n = -n; // Support negative cases!
          r = normalizeRational(n, d);
        } while (r.den !== d || Math.abs(r.num) !== Math.abs(n));
        return { num: n, den: d };
      };

      const f1 = genFrac();
      const f2 = genFrac();
      const variable = ['x', 'y', 'z', 'a', 'b'][Math.floor(Math.random() * 5)];
      
      const resNum = f1.num * f2.den + f2.num * f1.den;
      const resDen = f1.den * f2.den;
      const res = normalizeRational(resNum, resDen);
      const ans = formatTerm(res, variable);
      
      const formatFracStr = (n: number, d: number) => {
         if (n < 0) return `-\\frac{${-n}}{${d}}`;
         return `\\frac{${n}}{${d}}`;
      };
      
      const step1_t1 = formatFracStr(f1.num * f2.den, f1.den * f2.den);
      const step1_t2_num = f2.num * f1.den;
      const step1_t2 = step1_t2_num < 0 
          ? `- ${formatFracStr(-step1_t2_num, f1.den * f2.den)}` 
          : `+ ${formatFracStr(step1_t2_num, f1.den * f2.den)}`;
      const step1 = `${step1_t1}${variable} ${step1_t2}${variable}`;
      
      const q_t1 = formatFracStr(f1.num, f1.den);
      const q_t2 = f2.num < 0 
          ? `- ${formatFracStr(-f2.num, f2.den)}` 
          : `+ ${formatFracStr(f2.num, f2.den)}`;
      const q = `${q_t1}${variable} ${q_t2}${variable}`;
      
      return { q, a: ans, steps: [ans] };
    }
    if (type === 'complex-equation') return generateComplexEquationProblem();
    if (type === 'word-problem' || type === 'word-problems') return generateWordProblem(t);
    if (type === 'final-exam') return { q: "Solve for x: 3x = 9", a: 3 };
    return { q: "2x = 4", a: 2 };
  };
}
