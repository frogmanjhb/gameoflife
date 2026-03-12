export interface EntrepreneurQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: EntrepreneurQuestion[];
export declare const mediumQuestions: EntrepreneurQuestion[];
export declare const hardQuestions: EntrepreneurQuestion[];
export declare const extremeQuestions: EntrepreneurQuestion[];
export declare function getEntrepreneurQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): EntrepreneurQuestion;
//# sourceMappingURL=entrepreneur-questions.d.ts.map