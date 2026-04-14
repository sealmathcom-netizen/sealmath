function latexToPlain(latex) {
  return latex
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\cdot/g, '*')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\\ /g, ' ')
    .replace(/\\/g, '');
}

function parseCoeffValue(c) {
  c = c.trim();
  const mixed = c.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const n = Number(mixed[2]);
    const d = Number(mixed[3]);
    const sign = whole < 0 || c.startsWith('-') ? -1 : 1;
    return sign * (Math.abs(whole) + n/d);
  }
  const frac = c.match(/^(-?\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  if (c === '' || c === '+') return 1;
  if (c === '-') return -1;
  const int = c.match(/^(-?\d+)$/);
  if (int) return Number(int[1]);
  return null;
}

function evaluateRationalCoeff(val, v) {
  const plain = latexToPlain(val);
  const s = plain.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s.includes(v)) {
    if (s === '0' || s === '0.0') return { num: 0, den: 1 };
    return null;
  }

  const factoredMatch = s.match(/^\(([^)]+)\)([a-z])$/i) || s.match(/^([a-z])\(([^)]+)\)$/i);
  if (factoredMatch) {
    const inner = factoredMatch[1].replace(/\s+/g, '');
    const parts = inner.match(/(-?\d+)\/(\d+)([\+\-])(-?\d+)\/(\d+)/);
    if (parts) {
      const n1 = Number(parts[1]), d1 = Number(parts[2]), op = parts[3], n2 = Number(parts[4]), d2 = Number(parts[5]);
      const resNum = (op === '+') ? (n1 * d2 + n2 * d1) : (n1 * d2 - n2 * d1);
      return { num: resNum, den: d1 * d2 };
    }
  }

  let totalValue = 0;
  let hasFoundAny = false;
  const segments = s.split(/([\+\-])/).filter(t => t.trim() !== '');
  const signedTerms = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === '+' || segments[i] === '-') {
      signedTerms.push(segments[i] + (segments[i+1] || ''));
      i++;
    } else {
      signedTerms.push(segments[i]);
    }
  }

  for (const term of signedTerms) {
    if (term.includes(v)) {
      const coeffStr = term.replace(v, '').trim();
      const val = parseCoeffValue(coeffStr);
      if (val !== null) {
        totalValue += val;
        hasFoundAny = true;
      } else {
        return null;
      }
    }
  }

  if (!hasFoundAny) return null;
  return { num: totalValue, den: 1 };
}

const res = evaluateRationalCoeff("\\frac32t", "t");
console.log("Result for \\\\frac32t:", res);

const res2 = evaluateRationalCoeff("\\frac{3}{2}t", "t");
console.log("Result for \\\\frac{3}{2}t:", res2);
