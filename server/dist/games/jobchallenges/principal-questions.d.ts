export interface PrincipalQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: PrincipalQuestion[];
export declare const mediumQuestions: PrincipalQuestion[];
export declare const hardQuestions: PrincipalQuestion[];
export declare const extremeQuestions: PrincipalQuestion[];
export declare function getPrincipalQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): PrincipalQuestion;
//# sourceMappingURL=principal-questions.d.ts.map