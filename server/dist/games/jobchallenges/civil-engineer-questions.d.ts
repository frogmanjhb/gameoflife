export interface CivilEngineerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: CivilEngineerQuestion[];
export declare const mediumQuestions: CivilEngineerQuestion[];
export declare const hardQuestions: CivilEngineerQuestion[];
export declare const extremeQuestions: CivilEngineerQuestion[];
export declare function getCivilEngineerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): CivilEngineerQuestion;
//# sourceMappingURL=civil-engineer-questions.d.ts.map