export interface TownPlannerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: TownPlannerQuestion[];
export declare const mediumQuestions: TownPlannerQuestion[];
export declare const hardQuestions: TownPlannerQuestion[];
export declare const extremeQuestions: TownPlannerQuestion[];
export declare function getTownPlannerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): TownPlannerQuestion;
//# sourceMappingURL=town-planner-questions.d.ts.map