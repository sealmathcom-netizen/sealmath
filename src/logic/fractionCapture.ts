export type Frac = { n: number; d: number }

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}

export function simplify(n: number, d: number): Frac {
  const common = gcd(Math.abs(n), Math.abs(d))
  return { n: n / common, d: d / common }
}

export function calculateFrac(f1: Frac, f2: Frac, op: string): Frac {
  let n = 0
  let d = 1
  if (op === '+') {
    n = f1.n * f2.d + f2.n * f1.d
    d = f1.d * f2.d
  } else if (op === '-') {
    n = f1.n * f2.d - f2.n * f1.d
    d = f1.d * f2.d
  } else if (op === '*') {
    n = f1.n * f2.n
    d = f1.d * f2.d
  } else if (op === '/') {
    n = f1.n * f2.d
    d = f1.d * f2.n
  }
  return simplify(n, d)
}

export function shuffle<T>(array: T[]): T[] {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateNewGame(): { target: Frac; ingredients: Frac[] } {
  const denoms = [2, 3, 4, 5, 6, 8, 10]
  const ops = ['+', '-', '*', '/']

  // Avoid runaway recursion by using a loop with a generous cap.
  for (let tries = 0; tries < 500; tries++) {
    const ingredientsRaw: Frac[] = []
    for (let i = 0; i < 4; i++) {
      const d = denoms[Math.floor(Math.random() * denoms.length)]
      const n = Math.floor(Math.random() * (d - 1)) + 1
      ingredientsRaw.push(simplify(n, d))
    }

    const op = ops[Math.floor(Math.random() * ops.length)]
    const res = calculateFrac(ingredientsRaw[0], ingredientsRaw[1], op)

    if (res.n > 0 && res.d <= 100 && res.n <= 200) {
      return { target: simplify(res.n, res.d), ingredients: shuffle(ingredientsRaw) }
    }
  }

  // Fallback (extremely unlikely unless RNG is very unlucky).
  const fallbackIngredients = [simplify(1, 2), simplify(1, 4), simplify(2, 3), simplify(3, 5)]
  const fallbackOp = '+'
  return { target: calculateFrac(fallbackIngredients[0], fallbackIngredients[1], fallbackOp), ingredients: shuffle(fallbackIngredients) }
}

export function findSolution(ingredients: Frac[], target: Frac): string | null {
  const ops = ['+', '-', '*', '/']
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (i === j) continue
      for (const op of ops) {
        const res = calculateFrac(ingredients[i], ingredients[j], op)
        if (res.n === target.n && res.d === target.d) {
          const f1 = ingredients[i]
          const f2 = ingredients[j]
          const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op
          return `${f1.n}/${f1.d} ${opSymbol} ${f2.n}/${f2.d}`
        }
      }
    }
  }
  return null
}

