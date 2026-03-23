export function solve24(numbers: number[]): string | null {
  const target = 24

  type Node = { val: number; expr: string }

  function backtrack(list: Node[]): string | null {
    if (list.length === 1) {
      return Math.abs(list[0].val - target) < 0.001 ? list[0].expr : null
    }

    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue
        const a = list[i]
        const b = list[j]
        const rem = list.filter((_, idx) => idx !== i && idx !== j)

        const ops: Array<{ val: number | null; expr: string }> = [
          { val: a.val + b.val, expr: `(${a.expr}+${b.expr})` },
          { val: a.val - b.val, expr: `(${a.expr}-${b.expr})` },
          { val: a.val * b.val, expr: `(${a.expr}*${b.expr})` },
          {
            val: Math.abs(b.val) > 0.001 ? a.val / b.val : null,
            expr: `(${a.expr}/${b.expr})`,
          },
        ]

        for (const op of ops) {
          if (op.val === null) continue
          const res = backtrack([...rem, { val: op.val, expr: op.expr }])
          if (res) return res
        }
      }
    }
    return null
  }

  return backtrack(numbers.map((n) => ({ val: n, expr: n.toString() })))
}

