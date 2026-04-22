import { WordProblem } from './types';

export interface WordProblemTemplate {
  generate: (t: (key: string, params: any[]) => string) => WordProblem;
}

export const WORD_PROBLEMS: WordProblemTemplate[] = [
  {
    // 1: Ron and Dan age
    generate: (t) => {
      const x = Math.floor(Math.random() * 15) + 5;
      const diff = Math.floor(Math.random() * 10) + 2;
      const sum = 2 * x + diff;
      return {
        text: t('word_prob_1', [diff, sum]),
        templateKey: 'word_prob_1',
        params: [diff, sum],
        equation: `x + (x + ${diff}) = ${sum}`,
        variable: 'x',
        q: `x + (x + ${diff}) = ${sum}`,
        a: x,
        rationalA: { num: x, den: 1 }
      };
    }
  },
  {
      // 2: Pens and Pencils
      generate: (t) => {
          const x = Math.floor(Math.random() * 10) + 2;
          const diff = Math.floor(Math.random() * 5) + 1;
          const sum = 3 * (x + diff) + 2 * x;
          return {
              text: t('word_prob_2', [diff, sum]),
              templateKey: 'word_prob_2',
              params: [diff, sum],
              equation: `3(x + ${diff}) + 2x = ${sum}`,
              variable: 'x',
              q: `3(x + ${diff}) + 2x = ${sum}`,
              a: x,
              rationalA: { num: x, den: 1 }
          };
      }
  },
  {
      // 3: Consecutive numbers
      generate: (t) => {
          const x = Math.floor(Math.random() * 50) + 1;
          const sum = x + (x + 1) + (x + 2);
          return {
              text: t('word_prob_3', [sum]),
              templateKey: 'word_prob_3',
              params: [sum],
              equation: `x + (x + 1) + (x + 2) = ${sum}`,
              variable: 'x',
              q: `x + (x + 1) + (x + 2) = ${sum}`,
              a: x,
              rationalA: { num: x, den: 1 }
          };
      }
  },
  {
      // 4: Rectangle perimeter
      generate: (t) => {
          const w = Math.floor(Math.random() * 20) + 2;
          const diff = Math.floor(Math.random() * 10) + 1;
          const peri = 2 * (w + (w + diff));
          return {
              text: t('word_prob_4', [diff, peri]),
              templateKey: 'word_prob_4',
              params: [diff, peri],
              equation: `2(x + (x + ${diff})) = ${peri}`,
              variable: 'x',
              q: `2(x + (x + ${diff})) = ${peri}`,
              a: w,
              rationalA: { num: w, den: 1 }
          };
      }
  },
  {
      // 5: Savings
      generate: (t) => {
          const start = Math.floor(Math.random() * 100) + 50;
          const weekly = Math.floor(Math.random() * 20) + 10;
          const weeks = Math.floor(Math.random() * 10) + 2;
          const total = start + weekly * weeks;
          return {
              text: t('word_prob_5', [start, weekly, total]),
              templateKey: 'word_prob_5',
              params: [start, weekly, total],
              equation: `${start} + ${weekly}x = ${total}`,
              variable: 'x',
              q: `${start} + ${weekly}x = ${total}`,
              a: weeks,
              rationalA: { num: weeks, den: 1 }
          };
      }
  },
  {
      // 6: Train trip
      generate: (t) => {
          const v1 = Math.floor(Math.random() * 40) + 60;
          const speedIncrease = 20;
          const t1 = Math.floor(Math.random() * 3) + 2;
          const dist = v1 * t1 + (v1 + speedIncrease) * 2;
          return {
              text: t('word_prob_6', [v1, speedIncrease, dist]),
              templateKey: 'word_prob_6',
              params: [v1, speedIncrease, dist],
              equation: `${v1}x + 2(${v1} + ${speedIncrease}) = ${dist}`,
              variable: 'x',
              q: `${v1}x + 2(${v1} + ${speedIncrease}) = ${dist}`,
              a: t1,
              rationalA: { num: t1, den: 1 }
          };
      }
  },
  {
      // 7: Coins
      generate: (t) => {
          const c5 = Math.floor(Math.random() * 10) + 5;
          const c10 = Math.floor(Math.random() * 10) + 2;
          const total = c5 * 5 + c10 * 10;
          return {
              text: t('word_prob_7', [c5, total]),
              templateKey: 'word_prob_7',
              params: [c5, total],
              equation: `${c5} * 5 + 10x = ${total}`,
              variable: 'x',
              q: `${c5} * 5 + 10x = ${total}`,
              a: c10,
              rationalA: { num: c10, den: 1 }
          };
      }
  },
  {
      // 8: Marbles
      generate: (t) => {
          const tal = Math.floor(Math.random() * 20) + 5;
          const diff = Math.floor(Math.random() * 15) + 5;
          const total = tal + (tal + diff);
          return {
              text: t('word_prob_8', [diff, total]),
              templateKey: 'word_prob_8',
              params: [diff, total],
              equation: `x + (x + ${diff}) = ${total}`,
              variable: 'x',
              q: `x + (x + ${diff}) = ${total}`,
              a: tal,
              rationalA: { num: tal, den: 1 }
          };
      }
  },
  {
      // 9: Pizza
      generate: (t) => {
          const slice = 12;
          const drink = 8;
          const x = Math.floor(Math.random() * 8) + 4;
          const total = slice * x + 4 * drink;
          return {
              text: t('word_prob_9', [slice, drink, total]),
              templateKey: 'word_prob_9',
              params: [slice, drink, total],
              equation: `${slice}x + 4 * ${drink} = ${total}`,
              variable: 'x',
              q: `${slice}x + 4 * ${drink} = ${total}`,
              a: x,
              rationalA: { num: x, den: 1 }
          };
      }
  },
  {
      // 10: Classroom
      generate: (t) => {
          const boys = Math.floor(Math.random() * 10) + 10;
          const diff = Math.floor(Math.random() * 6) + 2;
          const total = boys + (boys + diff);
          return {
              text: t('word_prob_10', [diff, total]),
              templateKey: 'word_prob_10',
              params: [diff, total],
              equation: `x + (x + ${diff}) = ${total}`,
              variable: 'x',
              q: `x + (x + ${diff}) = ${total}`,
              a: boys,
              rationalA: { num: boys, den: 1 }
          };
      }
  },
  {
      // 11: Books
      generate: (t) => {
          const p1 = Math.floor(Math.random() * 30) + 20;
          const diff = Math.floor(Math.random() * 20) + 5;
          const total = p1 + (p1 + diff) + (2 * p1);
          return {
              text: t('word_prob_11', [diff, total]),
              templateKey: 'word_prob_11',
              params: [diff, total],
              equation: `x + (x + ${diff}) + 2x = ${total}`,
              variable: 'x',
              q: `x + (x + ${diff}) + 2x = ${total}`,
              a: p1,
              rationalA: { num: p1, den: 1 }
          };
      }
  },
  {
      // 12: Salary
      generate: (t) => {
          const hourlyRate = 45;
          const bonus = 500;
          const hours = Math.floor(Math.random() * 50) + 100;
          const total = hourlyRate * hours + bonus;
          return {
              text: t('word_prob_12', [hourlyRate, bonus, total]),
              templateKey: 'word_prob_12',
              params: [hourlyRate, bonus, total],
              equation: `${hourlyRate}x + ${bonus} = ${total}`,
              variable: 'x',
              q: `${hourlyRate}x + ${bonus} = ${total}`,
              a: hours,
              rationalA: { num: hours, den: 1 }
          };
      }
  },
  {
      // 13: Animals
      generate: (t) => {
          const cows = Math.floor(Math.random() * 20) + 5;
          const diff = Math.floor(Math.random() * 10) + 2;
          const totalLegs = cows * 4 + (cows + diff) * 2;
          return {
              text: t('word_prob_13', [diff, totalLegs]),
              templateKey: 'word_prob_13',
              params: [diff, totalLegs],
              equation: `4x + 2(x + ${diff}) = ${totalLegs}`,
              variable: 'x',
              q: `4x + 2(x + ${diff}) = ${totalLegs}`,
              a: cows,
              rationalA: { num: cows, den: 1 }
          };
      }
  },
  {
      // 14: Candy
      generate: (t) => {
          const blue = Math.floor(Math.random() * 15) + 5;
          const diff = Math.floor(Math.random() * 5) + 1;
          const red = 3 * blue - diff;
          const total = blue + red;
          return {
              text: t('word_prob_14', [diff, total]),
              templateKey: 'word_prob_14',
              params: [diff, total],
              equation: `x + (3x - ${diff}) = ${total}`,
              variable: 'x',
              q: `x + (3x - ${diff}) = ${total}`,
              a: blue,
              rationalA: { num: blue, den: 1 }
          };
      }
  },
  {
      // 15: Trees
      generate: (t) => {
          const x = Math.floor(Math.random() * 20) + 10;
          const d1 = Math.floor(Math.random() * 5) + 3;
          const d2 = Math.floor(Math.random() * 5) + 3;
          const x2 = x + d1;
          const x3 = x2 + d2;
          const total = x + x2 + x3;
          return {
              text: t('word_prob_15', [d1, d2, total]),
              templateKey: 'word_prob_15',
              params: [d1, d2, total],
              equation: `x + (x + ${d1}) + (x + ${d1} + ${d2}) = ${total}`,
              variable: 'x',
              q: `x + (x + ${d1}) + (x + ${d1} + ${d2}) = ${total}`,
              a: x,
              rationalA: { num: x, den: 1 }
          };
      }
  }
];
