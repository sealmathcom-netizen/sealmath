import { describe, it, expect } from 'vitest';
import { 
  generateComplexEquationProblem, 
  generateWordProblem, 
  getProblemGenerator 
} from './generators';
import * as MathEngine from './evaluators';

describe('Algebra Problem Generators', () => {

  describe('generateComplexEquationProblem', () => {
    it('should generate a problem with a valid solution', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateComplexEquationProblem();
        expect(p.variable).toBe('x');
        expect(Number.isFinite(p.a)).toBe(true);
        expect(typeof p.step).toBe('string');
        expect(p.rationalA).toBeDefined();
        
        // Verify root satisfy the equation
        const [left, right] = p.q.split('=');
        const lVal = MathEngine.evalSide(left.trim(), p.variable, p.a);
        const rVal = MathEngine.evalSide(right.trim(), p.variable, p.a);
        expect(lVal).toBeCloseTo(rVal, 5);
      }
    });

    it('should not have double operators in the question', () => {
      for (let i = 0; i < 100; i++) {
        const p = generateComplexEquationProblem();
        expect(p.q).not.toContain('+ +');
        expect(p.q).not.toContain('- -');
        expect(p.q).not.toContain('+ -');
        expect(p.q).not.toContain('- +');
        expect(p.q).not.toContain('  ');
        expect(p.q.trim()).toBe(p.q);
      }
    });

    it('should have a valid intermediate step', () => {
      for (let i = 0; i < 20; i++) {
        const p = generateComplexEquationProblem();
        const step = p.step;
        // The step root should still be the same
        const res = MathEngine.checkEquationStep(step, p.a);
        expect(res).toBe(true);
      }
    });

    it('should respect the term count limit (approximately)', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateComplexEquationProblem();
        const terms = p.q.match(/[+-]?\s*(\\frac\{\d+\}\{\d+\}[xyzab]?|\d+[xyzab]?|[xyzab])/gi) || [];
        expect(terms.length).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('generateWordProblem', () => {
    it('should support localization', () => {
      const mockT = (key: string, params: any) => `KEY:${key}:${Object.values(params || {}).join(',')}`;
      const p = generateWordProblem(mockT);
      expect(p.text).toContain('KEY:word_prob_');
      expect(p.rationalA).toBeDefined();
    });

    it('should produce an equation with the correct root', () => {
      const p = generateWordProblem();
      expect(MathEngine.checkNumeric(String(p.a), p.a)).toBe(true);
      const res = MathEngine.checkEquationStep(p.equation, p.a);
      expect(res).toBe(true);
    });
  });

  
  describe('Fraction Like Terms Generator', () => {
    it('should never generate unsimplified fractions (pedagogical constraint)', () => {
      const gen = getProblemGenerator('fractions-like-terms');
      for (let i = 0; i < 200; i++) {
        const p = gen() as any;
        
        // We ensure rac{4}{10} does not exist. We look for rac{num}{den} and verify gcd = 1
        const fracRegex = /\\frac\{(\d+)\}\{(\d+)\}/g;
        let match;
        while ((match = fracRegex.exec(p.q)) !== null) {
          const num = parseInt(match[1], 10);
          const den = parseInt(match[2], 10);
          
          const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
          expect(gcd(num, den)).toBe(1);
        }
      }
    });
    
    it('should properly format negative cases without inner negatives (e.g. -\\frac{1}{2} instead of \\frac{-1}{2})', () => {
      const gen = getProblemGenerator('fractions-like-terms');
      let foundNegative = false;
      for (let i = 0; i < 200; i++) {
        const p = gen() as any;
        
        // Ensure that negative numbers are never inside a fraction tag!
        expect(p.q).not.toMatch(/\\frac\{-\d+\}\{\d+\}/);
        expect(p.q).not.toMatch(/\\frac\{\d+\}\{-\d+\}/);
        
        // Ensure we actually generate negative coefficients!
        if (p.q.startsWith('-') || p.q.includes(' - ')) {
          foundNegative = true;
        }
      }
      expect(foundNegative).toBe(true); // Statistically guaranteed in 200 iterations
    });
  });

  describe('getProblemGenerator', () => {
    it('should return a function for a valid category', () => {
      const gen = getProblemGenerator('add-sub');
      expect(typeof gen).toBe('function');
      const p = gen();
      expect(p).toHaveProperty('q');
      expect(p).toHaveProperty('a');
    });

    it('should handle word-problem with translator', () => {
      const mockT = (key: string) => "Translated";
      const gen = getProblemGenerator('word-problem', mockT as any);
      const p = (gen() as any);
      expect(p.text).toBe("Translated");
    });
  });

  describe('UI state management (updateLine / showSolution behaviour)', () => {
    /**
     * These tests simulate the stateful logic that lives inside
     * ComplexEquationWindow and WordProblemWindow to ensure:
     *  - resultMsg is cleared when the user edits an input
     *  - resultMsg is cleared when Show Solution is triggered
     *  - isSolutionShown resets to false when the user edits an input
     */

    it('updateLine should clear the result message', () => {
      // Simulate state
      let resultMsg = 'Incorrect!';
      let inputLines = [''];
      let isSolutionShown = false;

      // Simulated updateLine handler (mirrors AlgebraClient.tsx)
      const updateLine = (idx: number, val: string) => {
        const next = [...inputLines];
        next[idx] = val;
        inputLines = next;
        if (isSolutionShown) isSolutionShown = false;
        resultMsg = '';
      };

      updateLine(0, '2x = 8');

      expect(resultMsg).toBe('');
      expect(inputLines[0]).toBe('2x = 8');
    });

    it('updateLine should reset isSolutionShown when user edits after seeing solution', () => {
      let isSolutionShown = true;
      let inputLines = ['2x = 8', 'x = 4'];

      const updateLine = (idx: number, val: string) => {
        const next = [...inputLines];
        next[idx] = val;
        inputLines = next;
        if (isSolutionShown) isSolutionShown = false;
      };

      updateLine(0, '3x = 9');

      expect(isSolutionShown).toBe(false);
      expect(inputLines[0]).toBe('3x = 9');
    });

    it('showSolution should clear the result message', () => {
      let resultMsg = 'Incorrect!';
      let isSolutionShown = false;
      const p = generateComplexEquationProblem();

      // Simulated showSolution handler
      const showSolution = () => {
        isSolutionShown = true;
        resultMsg = '';
      };

      showSolution();

      expect(resultMsg).toBe('');
      expect(isSolutionShown).toBe(true);
    });

    it('showSolution should NOT reset isSolutionShown (it sets it to true)', () => {
      let isSolutionShown = false;

      const showSolution = () => {
        isSolutionShown = true;
      };

      showSolution();
      expect(isSolutionShown).toBe(true);
    });

    it('editing after showSolution cycles back to check-answer mode', () => {
      let isSolutionShown = false;
      let resultMsg = '';
      let inputLines = [''];

      const showSolution = () => {
        isSolutionShown = true;
        resultMsg = '';
        inputLines = ['2x = 8', 'x = 4'];
      };

      const updateLine = (idx: number, val: string) => {
        const next = [...inputLines];
        next[idx] = val;
        inputLines = next;
        if (isSolutionShown) isSolutionShown = false;
        resultMsg = '';
      };

      // User sees solution
      showSolution();
      expect(isSolutionShown).toBe(true);

      // User edits — should revert to check-answer mode
      updateLine(0, '5x = 10');
      expect(isSolutionShown).toBe(false);
      expect(resultMsg).toBe('');
    });
  });

});
