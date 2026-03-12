export interface DoctorQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: DoctorQuestion[];
export declare const mediumQuestions: DoctorQuestion[];
export declare const hardQuestions: DoctorQuestion[];
export declare const extremeQuestions: DoctorQuestion[];
export declare function getDoctorQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): DoctorQuestion;
//# sourceMappingURL=doctor-questions.d.ts.map