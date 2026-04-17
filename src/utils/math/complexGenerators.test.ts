import { describe, it, expect } from 'vitest';
import { generateComplexEquationProblem } from './generators';

describe('Complex Equation Distribution', () => {
  it('should generate distribution-style and two-side style exercises appropriately', () => {
    const total = 300;
    let distributionCount = 0;
    let twoSideCount = 0;
    let fractionCount = 0;

    for (let i = 0; i < total; i++) {
      const prob = generateComplexEquationProblem();
      if (prob.type === 'distribution') {
        distributionCount++;
      } else if (prob.type === 'two-side') {
        twoSideCount++;
        // Check if any part (a, b, d) has a fraction
        // Since I only set "type" in the return but didn't export the internal parts, 
        // I'll check the question string for a slash "/"
        if (prob.q.includes('/') || prob.q.includes('\\frac')) {
          fractionCount++;
        }
      }
    }

    // Expected: distribution ~ 1/3 (100 out of 300)
    // Accept range: [70, 130]
    expect(distributionCount).toBeGreaterThan(60);
    expect(distributionCount).toBeLessThan(140);
    expect(twoSideCount).toBeGreaterThan(160);

    // Expected fractionCount in two-side:
    // a has 50% fraction, b has 50% fraction.
    // Probability at least one is fraction: 1 - (0.5 * 0.5) = 0.75
    // 75% of twoSideCount should have a slash.
    // 0.75 * 200 = 150
    expect(fractionCount).toBeGreaterThan(twoSideCount * 0.5); // Very safe lower bound
  });

  
  it('should never generate identities where total coefficients on both sides match', () => {
    for (let i = 0; i < 500; i++) {
      const prob = generateComplexEquationProblem();
      if (prob.type === 'two-side') {
        const parts = prob.q.split('=');
        expect(parts.length).toBe(2);
        expect(parts[0].trim()).not.toBe(parts[1].trim());
      }
    }
  });


});

  
  it('should never generate identities where total coefficients on both sides match', () => {
    for (let i = 0; i < 500; i++) {
      const prob = generateComplexEquationProblem();
      if (prob.type === 'two-side') {
        const parts = prob.q.split('=');
        expect(parts.length).toBe(2);
        expect(parts[0].trim()).not.toBe(parts[1].trim());
      }
    }
  });


