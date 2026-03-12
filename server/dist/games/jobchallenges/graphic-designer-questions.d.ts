export interface GraphicDesignerQuestion {
    question: string;
    answer: number;
    explanation?: string;
}
export declare const easyQuestions: GraphicDesignerQuestion[];
export declare const mediumQuestions: GraphicDesignerQuestion[];
export declare const hardQuestions: GraphicDesignerQuestion[];
export declare const extremeQuestions: GraphicDesignerQuestion[];
export declare function getGraphicDesignerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): GraphicDesignerQuestion;
//# sourceMappingURL=graphic-designer-questions.d.ts.map