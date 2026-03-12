export interface RetailManagerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: RetailManagerQuestion[];
export declare const mediumQuestions: RetailManagerQuestion[];
export declare const hardQuestions: RetailManagerQuestion[];
export declare const extremeQuestions: RetailManagerQuestion[];
export declare function getRetailManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): RetailManagerQuestion;
//# sourceMappingURL=retail-manager-questions.d.ts.map