import { describe, it, expect } from 'vitest';
import * as MathGen from './generators';
import { ExerciseCategory } from './types';

describe('Pedagogical Standards', () => {
  const categories: ExerciseCategory[] = [
    'add-sub',
    'mul-div',
    'two-step',
    'combining-like-terms',
    'combining-fraction-like-terms'
  ];

  it('should never generate questions containing "1x" or "-1x" (as a lone coefficient)', () => {
    // Run each generator 200 times to catch random edge cases
    categories.forEach(category => {
      const generator = MathGen.getProblemGenerator(category);
      for (let i = 0; i < 200; i++) {
        const problem = generator();
        const searchStrings = [problem.q, problem.a, ...(problem.steps || [])].map(String);
        
        searchStrings.forEach(str => {
          // Match 1x, -1x followed by a variable or end of string, and also catch 0x
          const illegalPattern = /(^|[^\d])(-?1[a-z]|0[a-z])/i;
          
          const match = str.match(illegalPattern);
          if (match) {
            throw new Error(`Category "${category}" generated an illegal string: "${str}". Standard: "1x" should be "x", "0x" should be "0".`);
          }
          
          expect(str).not.toMatch(/(^|\s)1[a-z]/i);
          expect(str).not.toMatch(/(^|\s)-1[a-z]/i);
          expect(str).not.toMatch(/(^|\s)0[a-z]/i);
        });
      }
    });
  });

  it('should never generate questions containing "/1" or simple whole numbers as fractions', () => {
    // Add complex-equation to the categories to check
    const allCats = [...categories, 'complex-equation' as any];
    allCats.forEach(category => {
      const generator = MathGen.getProblemGenerator(category);
      for (let i = 0; i < 200; i++) {
        const problem = generator();
        const q = problem.q;
        if (/\/1(?!\d)/.test(q)) {
          throw new Error(`Category "${category}" generated an unsimplified fraction: "${q}". Standard: "/1" should be omitted.`);
        }
      }
    });
  });


  it('should never generate questions containing consecutive operators like "+ -" or "- +"', () => {
    const allCats = [...categories, 'complex-equation' as any];
    allCats.forEach(category => {
      const generator = MathGen.getProblemGenerator(category);
      for (let i = 0; i < 200; i++) {
        const problem = generator();
        const q = problem.q;
        // Match + -, - +, + +, - - with optional spaces
        if (/[+\-]\s*[+\-]/.test(q)) {
          throw new Error(`Category "${category}" generated invalid consecutive operators: "${q}".`);
        }
      }
    });
  });

  describe('Coefficient Normalization Logic', () => {
    const normalizeCoeff = (num: number, den: number, variable: string) => {
      if (num === 0) return '0';
      if (den === 1) {
        if (num === 1) return variable;
        if (num === -1) return `-${variable}`;
        return `${num}${variable}`;
      }
      return `${num}/${den}${variable}`;
    };

    it('should correctly simplify 1 and -1 coefficients', () => {
      expect(normalizeCoeff(1, 1, 'x')).toBe('x');
      expect(normalizeCoeff(-1, 1, 'y')).toBe('-y');
      expect(normalizeCoeff(2, 1, 't')).toBe('2t');
      expect(normalizeCoeff(1, 2, 'x')).toBe('1/2x'); 
    });
  });
});
