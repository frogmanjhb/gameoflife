export interface JournalistQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: JournalistQuestion[];
export declare const mediumQuestions: JournalistQuestion[];
export declare const hardQuestions: JournalistQuestion[];
export declare const extremeQuestions: JournalistQuestion[];
export declare function getJournalistQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): JournalistQuestion;
//# sourceMappingURL=journalist-questions.d.ts.map