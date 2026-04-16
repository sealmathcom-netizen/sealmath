import { describe, it, expect } from 'vitest';
import { checkFractionSimplification, latexToMathJS } from './evaluators';
import { Rational } from './types';

describe('Math Evaluators - Fraction Simplification', () => {
  const variable = 'x';

  // Debug helper
  const check = (input: string, target: Rational, v: string) => {
    const result = checkFractionSimplification(input, target, v);
    return result;
  };

  describe('latexToMathJS parser', () => {
    it('should handle standard fractions', () => {
      expect(latexToMathJS('\\frac{1}{2}x', 'x')).toBe('(1)/(2)*x');
      expect(latexToMathJS('\\frac{3}{4}y', 'y')).toBe('(3)/(4)*y');
    });

    it('should handle shorthand fractions', () => {
      expect(latexToMathJS('\\frac12x', 'x')).toBe('(1)/(2)*x');
    });

    it('should handle mixed numbers', () => {
      // Mixed fraction logic replaces whole with (whole + num/den)
      expect(latexToMathJS('1\\frac{1}{2}x', 'x')).toBe('((1)+(1)/(2))*x');
      expect(latexToMathJS('-1\\frac{1}{2}x', 'x')).toBe('-((1)+(1)/(2))*x');
    });

    it('should prevent variable entrapment in denominator', () => {
      // Logic should ensure -7/20y is NOT interpreted as -7/(20y)
      const result = latexToMathJS('-\\frac{7}{20}y', 'y');
      expect(result).toBe('-(7)/(20)*y');
    });
  });

  describe('checkFractionSimplification', () => {
    const simplified: Rational = { num: 1, den: 2 }; // Case for 1/2x

    it('should accept correctly simplified fractions', () => {
      expect(checkFractionSimplification('\\frac{1}{2}x', simplified, 'x')).toBe(true);
      expect(checkFractionSimplification('0.5x', simplified, 'x')).toBe(true);
      
      // Negative integers should be accepted
      expect(checkFractionSimplification('-3x', { num: -3, den: 1 }, 'x')).toBe(true);
    });

    it('should reject unsimplified fractions', () => {
      expect(checkFractionSimplification('\\frac{2}{4}x', simplified, 'x')).toBe(false);
      expect(checkFractionSimplification('\\frac{4}{8}x', simplified, 'x')).toBe(false);
    });

    it('should reject uncombined terms', () => {
      expect(checkFractionSimplification('\\frac{1}{4}x + \\frac{1}{4}x', simplified, 'x')).toBe(false);
    });

    it('should handle standalone variables (x vs 1x and 0x)', () => {
      const targetOne: Rational = { num: 1, den: 1 };
      expect(checkFractionSimplification('x', targetOne, 'x')).toBe(true);
      expect(checkFractionSimplification('1x', targetOne, 'x')).toBe(false);

      const targetZero: Rational = { num: 0, den: 1 };
      expect(checkFractionSimplification('0', targetZero, 'x')).toBe(true);
      expect(checkFractionSimplification('0x', targetZero, 'x')).toBe(false);
    });

    it('should accept mixed numbers as long as the fraction part is simplified', () => {
      // 3/2x can be 1 1/2x
      const targetThreeHalves: Rational = { num: 3, den: 2 };
      expect(checkFractionSimplification('1\\frac{1}{2}x', targetThreeHalves, 'x')).toBe(true);
      expect(checkFractionSimplification('1\\frac{2}{4}x', targetThreeHalves, 'x')).toBe(false);
    });

    it('should handle negative mixed numbers', () => {
      const targetNegThreeHalves: Rational = { num: -3, den: 2 };
      expect(checkFractionSimplification('-1\\frac{1}{2}x', targetNegThreeHalves, 'x')).toBe(true);
    });

    it('should reject mixed numbers with improper fraction parts', () => {
      // 10/3x should NOT be accepted as 2 4/3x
      const targetTenThirds: Rational = { num: 10, den: 3 };
      expect(checkFractionSimplification('3\\frac{1}{3}x', targetTenThirds, 'x')).toBe(true);
      expect(checkFractionSimplification('2\\frac{4}{3}x', targetTenThirds, 'x')).toBe(false);
      
      // 7/3t should NOT be accepted as 1 4/3t
      const targetSevenThirds: Rational = { num: 7, den: 3 };
      expect(checkFractionSimplification('1\\frac{\\text{ }4}{3}t', targetSevenThirds, 't')).toBe(false);
      
      // Negative case: -10/3x should NOT be accepted as -2 4/3x
      const targetNegTenThirds: Rational = { num: -10, den: 3 };
      expect(checkFractionSimplification('-3\\frac{1}{3}x', targetNegTenThirds, 'x')).toBe(true);
      expect(checkFractionSimplification('-2\\frac{4}{3}x', targetNegTenThirds, 'x')).toBe(false);
    });

    it('should handle the specific -7/20y case from regressions', () => {
      const target: Rational = { num: -7, den: 20 };
      expect(checkFractionSimplification('-\\frac{7}{20}y', target, 'y')).toBe(true);
    });
  });
});
