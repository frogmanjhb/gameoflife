export interface ElectricalEngineerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: ElectricalEngineerQuestion[];
export declare const mediumQuestions: ElectricalEngineerQuestion[];
export declare const hardQuestions: ElectricalEngineerQuestion[];
export declare const extremeQuestions: ElectricalEngineerQuestion[];
export declare function getElectricalEngineerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): ElectricalEngineerQuestion;
//# sourceMappingURL=electrical-engineer-questions.d.ts.map