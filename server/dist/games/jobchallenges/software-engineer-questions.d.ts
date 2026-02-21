export interface SoftwareEngineerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: SoftwareEngineerQuestion[];
export declare const mediumQuestions: SoftwareEngineerQuestion[];
export declare const hardQuestions: SoftwareEngineerQuestion[];
export declare const extremeQuestions: SoftwareEngineerQuestion[];
export declare function getSoftwareEngineerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): SoftwareEngineerQuestion;
//# sourceMappingURL=software-engineer-questions.d.ts.map