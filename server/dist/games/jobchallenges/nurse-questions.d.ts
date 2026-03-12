export interface NurseQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: NurseQuestion[];
export declare const mediumQuestions: NurseQuestion[];
export declare const hardQuestions: NurseQuestion[];
export declare const extremeQuestions: NurseQuestion[];
export declare function getNurseQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): NurseQuestion;
//# sourceMappingURL=nurse-questions.d.ts.map