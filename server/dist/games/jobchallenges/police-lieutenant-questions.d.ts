export interface PoliceLieutenantQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: PoliceLieutenantQuestion[];
export declare const mediumQuestions: PoliceLieutenantQuestion[];
export declare const hardQuestions: PoliceLieutenantQuestion[];
export declare const extremeQuestions: PoliceLieutenantQuestion[];
export declare function getPoliceLieutenantQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): PoliceLieutenantQuestion;
//# sourceMappingURL=police-lieutenant-questions.d.ts.map