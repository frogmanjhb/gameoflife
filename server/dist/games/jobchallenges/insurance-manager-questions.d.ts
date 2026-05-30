export interface InsuranceManagerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: InsuranceManagerQuestion[];
export declare const mediumQuestions: InsuranceManagerQuestion[];
export declare const hardQuestions: InsuranceManagerQuestion[];
export declare const extremeQuestions: InsuranceManagerQuestion[];
export declare function getInsuranceManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): InsuranceManagerQuestion;
//# sourceMappingURL=insurance-manager-questions.d.ts.map