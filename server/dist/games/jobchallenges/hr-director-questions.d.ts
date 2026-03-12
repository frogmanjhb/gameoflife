export interface HRDirectorQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: HRDirectorQuestion[];
export declare const mediumQuestions: HRDirectorQuestion[];
export declare const hardQuestions: HRDirectorQuestion[];
export declare const extremeQuestions: HRDirectorQuestion[];
export declare function getHRDirectorQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): HRDirectorQuestion;
//# sourceMappingURL=hr-director-questions.d.ts.map