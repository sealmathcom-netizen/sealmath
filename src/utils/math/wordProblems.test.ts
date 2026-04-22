import { describe, it, expect } from 'vitest';
import { WORD_PROBLEMS } from './wordProblems';
import { checkEquationStep } from './evaluators';

describe('Word Problems Templates', () => {
  const mockT = (key: string, params: any[]) => `${key}:${params.join(',')}`;

  WORD_PROBLEMS.forEach((template, index) => {
    it(`should generate a valid problem for template #${index + 1}`, () => {
      // Run multiple times to cover random variations
      for (let i = 0; i < 20; i++) {
        const p = template.generate(mockT);
        
        // Basic structure
        expect(p).toHaveProperty('text');
        expect(p).toHaveProperty('equation');
        expect(p).toHaveProperty('a');
        expect(p).toHaveProperty('variable');
        expect(p).toHaveProperty('templateKey');
        expect(p).toHaveProperty('params');
        
        // Ensure the answer satisfies the equation
        // Cast p.a to number since checkEquationStep expects number and BaseProblem defines it as number | string
        const isEquationValid = checkEquationStep(p.equation, p.a as number, p.variable);
        if (!isEquationValid) {
          throw new Error(`Failed template #${index + 1}: Equation "${p.equation}" with answer ${p.a} (variable ${p.variable}) failed validation.`);
        }
        expect(isEquationValid).toBe(true);
        
        // Ensure answer is numeric/rational
        expect(Number.isFinite(p.a)).toBe(true);
        expect(p.rationalA).toBeDefined();
        
        // Ensure text was "translated"
        expect(p.text).toContain(`word_prob_${index + 1}:`);
      }
    });
  });
});
