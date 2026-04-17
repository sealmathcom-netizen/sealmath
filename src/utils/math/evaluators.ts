
export const EPSILON = 0.01;

export function parseUserNumber(input: string): number {
  if (!input) return NaN;
  const normalized = input.replace(',', '.').replace(/\s/g, '');
  return Number(normalized);
}

export function checkNumeric(userInput: string | number, expected: number, tolerance: number = EPSILON): boolean {
  const userValue = typeof userInput === 'string' ? parseUserNumber(userInput) : userInput;
  if (Number.isNaN(userValue)) return false;
  if (Number.isInteger(expected) && Number.isInteger(userValue)) {
    return userValue === expected;
  }
  return Math.abs(userValue - expected) <= tolerance;
}

/**
 * Checks if a fraction is simplified.
 * Uses ComputeEngine to parse and then inspects the literal MathJSON structure.
 */
import { create, all } from 'mathjs';

const math = create(all);

function getGcd(a: number, b: number): number {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  return b === 0 ? a : getGcd(b, a % b);
}

function countOperators(node: any): number {
  let count = 0;
  const unwrap = (n: any): any => n.type === 'ParenthesisNode' ? unwrap(n.content) : n;

  node.traverse((n: any) => {
    if (n.isOperatorNode) {
      if (n.op === '+' || n.op === '-') {
        // Only count if it's a binary operator (2 args)
        if (n.args.length >= 2) {
          // Mixed number check: Addition of a constant and a fraction (or division)
          const args = n.args.map(unwrap);
          const isMixedPlus = args.length === 2 && 
                              args[0].isConstantNode && 
                              (args[1].op === '/' || (args[1].isOperatorNode && args[1].op === '*' && unwrap(args[1].args[0]).op === '/'));
          
          if (!isMixedPlus) count++;
        }
      } else if (n.op === '*') {
             const args = n.args.map(unwrap);
             // In middle school, "2x", "(3/2)x", and "(1+1/2)x" should all count as 0 ops
             // Handle negative mixed coefficients by unwrapping sign
             const coeffCandidate = unwrap(args[0]);
             const coreCoeff = (coeffCandidate.op === '-' && coeffCandidate.args.length === 1) ? unwrap(coeffCandidate.args[0]) : coeffCandidate;
             
             const isMixedCoeff = coreCoeff.isOperatorNode && coreCoeff.op === '+' && 
                                  unwrap(coreCoeff.args[0]).isConstantNode && unwrap(coreCoeff.args[1]).op === '/';
             
             const isSimpleCoeffOrVar = args.every((a: any) => {
               const core = unwrap(a);
               const leaf = core.op === '-' && core.args.length === 1 ? core.args[0] : core;
               return leaf.isConstantNode || leaf.isSymbolNode || (leaf.isOperatorNode && leaf.op === '/');
             });
             if (!isSimpleCoeffOrVar && !isMixedCoeff) count++;
      }
    }
  });
  return count;
}

export function latexToMathJS(latex: string, variable: string): string {
  let clean = latex
    .replace(/\\text\{[^{}]*\}/g, '')
    // Handle Mixed Fractions first: 3\frac{1}{2} -> ((3)+(1)/(2))
    .replace(/(\d+)\s*\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '(($1)+($2)/($3))')
    .replace(/(\d+)\s*\\frac\s*([0-9])\s*([0-9])/g, '(($1)+($2)/($3))')
    // Handle Regular Fractions: \frac{1}{2} -> (1)/(2)
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\frac\s*([0-9])\s*([0-9])/g, '($1)/($2)')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\{([^{}]+)\}/g, '($1)') 
    .replace(/\\s*/g, '');

  // Now handle variable multiplications EXTERNALLY to fractions/parens
  // 1. ( ... )x -> ( ... )*x
  clean = clean.replace(/([0-9\)])\s*([a-z])/gi, '$1*$2');
  // 2. 1x -> 1*x (Identity rule)
  clean = clean.replace(/\b1\s*([a-z])\b/gi, '1*$1');

  return clean.trim();
}

export function checkFractionSimplification(
  userInput: string,
  target: { num: number; den: number },
  variable?: string
): boolean {
  if (!userInput) return false;

  const mathString = latexToMathJS(userInput, variable || 'x');

  try {
    const node = math.parse(mathString);
    const simplified = math.simplify(node);


    // 2. Numerical Equality Check (Symbols: x, y, t, d, a, b, c)
    const probeVal = 1.234567; 
    const v = variable || 'x';
    const userHasVariable = userInput.toLowerCase().includes(v);
    const targetVal = (target.num / target.den) * (userHasVariable ? probeVal : 1);
    const scope = { x: probeVal, y: probeVal, t: probeVal, d: probeVal, a: probeVal, b: probeVal, c: probeVal };
    const userVal = node.evaluate(scope);
    
    if (Math.abs(userVal - targetVal) > 1e-7) return false;

    // 3. Structural Hardening
    
    // 3a. GCD check
    let reduced = true;
    node.traverse((n: any) => {
      if (n.isOperatorNode && n.op === '/') {
        try {
          const num = Math.abs(n.args[0].evaluate(scope));
          const den = Math.abs(n.args[1].evaluate(scope));
          if (Number.isInteger(num) && Number.isInteger(den) && num !== 0 && den !== 0) {
            if (getGcd(num, den) > 1) reduced = false;
          }
        } catch (e) {}
      }
    });
    if (!reduced) return false;

    // 3b. Redundant Identity (1x -> x, 0x -> 0)
    const normalized = node.toString().replace(/\s/g, '');
    if (/\b[01]\*/.test(normalized)) return false;

    // 3c. Mixed Fraction Properness (2 4/3 -> 3 1/3)
    const cleanInput = userInput.replace(/\\text\{[^{}]*\}/g, '');
    const mixedPattern = /(\d+)\s*\\frac\s*\{?(\d+)\}?\s*\{?(\d+)\}?/g;
    let mixedMatch;
    while ((mixedMatch = mixedPattern.exec(cleanInput)) !== null) {
      const num = parseInt(mixedMatch[2]);
      const den = parseInt(mixedMatch[3]);
      if (num >= den) return false;
    }

    // 3d. Combined Terms Check (Operator Count)
    const originalOps = countOperators(node);
    const simplifiedOps = countOperators(simplified);
    
    if (originalOps > simplifiedOps) return false;

    return true;
  } catch (err) {
    return false;
  }
}

export function evalSide(expr: string, variable: string, val: number): number {
  const scope: Record<string, number> = { x: val, y: val, t: val, d: val, a: val, b: val, c: val };
  scope[variable] = val;
  try {
    const mathString = latexToMathJS(expr, variable);
    const node = math.parse(mathString);
    return node.evaluate(scope);
  } catch (e) {
    return NaN;
  }
}

export function checkEquationStep(step: string, targetRoot: number): boolean {
  if (!step || !step.includes('=')) return false;
  const parts = step.split('=');
  if (parts.length !== 2) return false;
  
  const varMatch = step.match(/[a-z]/i);
  const variable = varMatch ? varMatch[0].toLowerCase() : 'x';
  
  const lVal = evalSide(parts[0], variable, targetRoot);
  const rVal = evalSide(parts[1], variable, targetRoot);
  
  if (Number.isNaN(lVal) || Number.isNaN(rVal)) return false;
  return Math.abs(lVal - rVal) < EPSILON;
}

/**
 * Checks if the user correctly showed the distribution step (e.g., x(5 + 3))
 */


/**
 * Checks the final simplified result of combining like terms (e.g., 8x)
 */

export function isEquationFullySolved(step: string, variable: string = 'x'): boolean {
  if (!step || !step.includes('=')) return false;
  const parts = step.split('=');
  if (parts.length !== 2) return false;
  
  const cleanSide = (s: string) => {
     return s.replace(/\\text\{[^{}]*\}/g, '').replace(/\s/g, '').trim();
  };
  
  const p0 = cleanSide(parts[0]);
  const p1 = cleanSide(parts[1]);
  
  if (p0 === variable) {
     return !p1.includes(variable);
  } else if (p1 === variable) {
     return !p0.includes(variable);
  }
  
  return false;
}
