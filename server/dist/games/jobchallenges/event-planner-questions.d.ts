export interface EventPlannerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: EventPlannerQuestion[];
export declare const mediumQuestions: EventPlannerQuestion[];
export declare const hardQuestions: EventPlannerQuestion[];
export declare const extremeQuestions: EventPlannerQuestion[];
export declare function getEventPlannerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): EventPlannerQuestion;
//# sourceMappingURL=event-planner-questions.d.ts.map