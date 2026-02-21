export interface MarketingManagerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: MarketingManagerQuestion[];
export declare const mediumQuestions: MarketingManagerQuestion[];
export declare const hardQuestions: MarketingManagerQuestion[];
export declare const extremeQuestions: MarketingManagerQuestion[];
export declare function getMarketingManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): MarketingManagerQuestion;
//# sourceMappingURL=marketing-manager-questions.d.ts.map