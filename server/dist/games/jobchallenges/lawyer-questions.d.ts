export interface LawyerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: LawyerQuestion[];
export declare const mediumQuestions: LawyerQuestion[];
export declare const hardQuestions: LawyerQuestion[];
export declare const extremeQuestions: LawyerQuestion[];
export declare function getLawyerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): LawyerQuestion;
//# sourceMappingURL=lawyer-questions.d.ts.map