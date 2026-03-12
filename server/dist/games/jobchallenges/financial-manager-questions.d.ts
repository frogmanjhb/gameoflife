export interface FinancialManagerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: FinancialManagerQuestion[];
export declare const mediumQuestions: FinancialManagerQuestion[];
export declare const hardQuestions: FinancialManagerQuestion[];
export declare const extremeQuestions: FinancialManagerQuestion[];
export declare function getFinancialManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): FinancialManagerQuestion;
//# sourceMappingURL=financial-manager-questions.d.ts.map