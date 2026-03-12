export interface TeacherQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: TeacherQuestion[];
export declare const mediumQuestions: TeacherQuestion[];
export declare const hardQuestions: TeacherQuestion[];
export declare const extremeQuestions: TeacherQuestion[];
export declare function getTeacherQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): TeacherQuestion;
//# sourceMappingURL=teacher-questions.d.ts.map