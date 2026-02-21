export interface AccountantQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: AccountantQuestion[];
export declare const mediumQuestions: AccountantQuestion[];
export declare const hardQuestions: AccountantQuestion[];
export declare const extremeQuestions: AccountantQuestion[];
export declare function getAccountantQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): AccountantQuestion;
//# sourceMappingURL=accountant-questions.d.ts.map