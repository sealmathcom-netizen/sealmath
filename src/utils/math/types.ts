export type ExerciseCategory = 
  | 'add-sub' 
  | 'mul-div' 
  | 'two-step' 
  | 'rounding' 
  | 'combining-like-terms' 
  | 'combining-fraction-like-terms'
  | 'complex-equation'
  | 'word-problem'
  | 'final-exam';

export interface BaseProblem {
  q: string; // The question text / LaTeX
  a: number | string; // The target answer
  templateKey?: string;
  params?: any[] | Record<string, any>;
}

export interface TwoStepProblem extends BaseProblem {
  step1Prefix: string;
  step1Ans: number;
  step2Prefix: string;
  step2Ans: number;
}

export interface Rational {
  num: number;
  den: number;
}

export interface CombiningFractionLikeTermsProblem extends BaseProblem {
  variable: string;
  isAdd: boolean;
  left: Rational;
  right: Rational;
  unsimplified: Rational;
  simplified: Rational;
}

export interface RoundingProblem extends BaseProblem {
  num: number;
  precision: number;
}

export interface LikeTermsProblem extends BaseProblem {
  variable: string;
  isAdd: boolean;
  leftCoeff?: number;
  rightCoeff?: number;
}

export interface WordProblem extends BaseProblem {
  text: string;
  equation: string;
  variable: string;
  rationalA: Rational;
}

export interface EvaluationResult {
  isCorrect: boolean;
  messageKey?: string;
  errorType?: 'precision' | 'wrong-variable' | 'formatting' | 'none';
}
