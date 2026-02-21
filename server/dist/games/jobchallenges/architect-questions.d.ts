export interface ArchitectQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: ArchitectQuestion[];
export declare const mediumQuestions: ArchitectQuestion[];
export declare const hardQuestions: ArchitectQuestion[];
export declare const extremeQuestions: ArchitectQuestion[];
export declare function getArchitectQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): ArchitectQuestion;
//# sourceMappingURL=architect-questions.d.ts.map