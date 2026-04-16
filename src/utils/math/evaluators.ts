/**
 * Shared mathematical evaluation logic for SealMath
 */

export const EPSILON = 0.01;

/**
 * Standardizes a numeric string from various locales/inputs into a clean number.
 */
export function parseUserNumber(input: string): number {
  if (!input) return NaN;
  // Replace comma with dot for European locales, remove spaces
  const normalized = input.replace(',', '.').replace(/\s/g, '');
  return Number(normalized);
}

/**
 * Checks if a numeric answer is correct within a given tolerance.
 */
export function checkNumeric(userInput: string | number, expected: number, tolerance: number = EPSILON): boolean {
  const userValue = typeof userInput === 'string' ? parseUserNumber(userInput) : userInput;
  if (Number.isNaN(userValue)) return false;
  
  // Standard strict check for integers
  if (Number.isInteger(expected) && Number.isInteger(userValue)) {
    return userValue === expected;
  }
  
  // Precision check for decimals
  return Math.abs(userValue - expected) <= tolerance;
}

/**
 * Safely evaluates a basic arithmetic expression (no variables).
 * This replaces the "Function()" based evaluation for combining like terms.
 * Supports: digits, decimals, +, -, *, /, (, )
 */
export function safeEvaluate(expr: string): number {
  const normalized = expr.replace(/\s+/g, '');
  if (!/^[0-9\+\-\*\/\(\)\.]*$/.test(normalized)) {
    throw new Error('Invalid characters in expression');
  }
  
  // Using a sanitized eval-like approach but with strict character whitelist check above.
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`"use strict"; return (${normalized})`)();
  } catch (err) {
    console.error('Math evaluation error:', err);
    return NaN;
  }
}

/**
 * Checks algebraic expressions like "2(x + 3)" or "5x".
 * For now, this is used for "Combining Like Terms" verification.
 */
export function checkAlgebraicExpression(
  userInput: string, 
  variable: string, 
  expectedCoeff: number
): { isCorrect: boolean; errorType?: 'formatting' | 'wrong-variable' | 'none' } {
  const normalized = userInput.replace(/\s+/g, '').toLowerCase();
  
  if (!normalized.includes(variable)) {
    return { isCorrect: false, errorType: 'wrong-variable' };
  }
  
  try {
    // Extract the part that should be numeric (everything but the variable)
    // and see if it evaluates to the expected coefficient.
    
    // Simple case: "5x" -> extract "5"
    if (normalized === `${expectedCoeff}${variable}`) return { isCorrect: true };
    if (expectedCoeff === 0 && (normalized === '0' || normalized === `0${variable}`)) return { isCorrect: true };

    // Complex case: "x(2+3)" -> replace x with 1 and evaluate
    const mathExpr = normalized
      .replace(new RegExp(`(\\d)${variable}`, 'g'), '$1*(1)')
      .replace(new RegExp(variable, 'g'), '(1)')
      .replace(/(\d)(\()/g, '$1*$2')
      .replace(/(\))(\d)/g, '$1*$2')
      .replace(/(\))(\()/g, '$1*$2');
    
    const val = safeEvaluate(mathExpr);
    return { isCorrect: checkNumeric(val, expectedCoeff) };

  } catch (e) {
    return { isCorrect: false, errorType: 'formatting' };
  }
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
    const targetVal = (target.num / target.den) * (variable ? probeVal : 1);
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
