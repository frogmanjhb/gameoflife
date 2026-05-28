"use strict";
// Graphic Designer – Design Precision Challenge
// 20 questions per difficulty tier. All numeric answers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extremeQuestions = exports.hardQuestions = exports.mediumQuestions = exports.easyQuestions = void 0;
exports.getGraphicDesignerQuestion = getGraphicDesignerQuestion;
// EASY – Size & Dimensions (width×height, area, proportional resizing)
exports.easyQuestions = [
    {
        question: "A poster is 48 cm wide and 72 cm high. What is the area (in cm²)?",
        answer: 3456,
        explanation: "48 × 72 = 3,456 cm²"
    },
    {
        question: "A banner is 32 cm by 90 cm. What is its area (cm²)?",
        answer: 2880,
        explanation: "32 × 90 = 2,880 cm²"
    },
    {
        question: "An image is 36 cm wide and 54 cm tall. Area (cm²)?",
        answer: 1944,
        explanation: "36 × 54 = 1,944 cm²"
    },
    {
        question: "A card is 12 cm × 18 cm. What is the area (cm²)?",
        answer: 216,
        explanation: "12 × 18 = 216 cm²"
    },
    {
        question: "You scale an image from 12 cm wide to 24 cm wide. Original height was 18 cm. New height (cm) if proportions stay the same?",
        answer: 36,
        explanation: "Scale factor 2; 18 × 2 = 36 cm"
    },
    {
        question: "A frame is 55 cm by 75 cm. Area (cm²)?",
        answer: 4125,
        explanation: "55 × 75 = 4,125 cm²"
    },
    {
        question: "Rectangle 15 cm × 28 cm. Area (cm²)?",
        answer: 420,
        explanation: "15 × 28 = 420 cm²"
    },
    {
        question: "Image 10 cm wide, 14 cm high. Scaled to 25 cm wide, same proportions. New height (cm)?",
        answer: 35,
        explanation: "25/10 = 2.5; 14 × 2.5 = 35 cm"
    },
    {
        question: "A poster is 42 cm wide and 56 cm high. Area (cm²)?",
        answer: 2352,
        explanation: "42 × 56 = 2,352 cm²"
    },
    {
        question: "Design 24 cm × 36 cm. Area (cm²)?",
        answer: 864,
        explanation: "24 × 36 = 864 cm²"
    },
    {
        question: "Original 6 cm wide, 10 cm high. Scaled to 18 cm wide. New height (cm) keeping proportion?",
        answer: 30,
        explanation: "18/6 = 3; 10 × 3 = 30 cm"
    },
    {
        question: "Canvas 65 cm × 95 cm. Area (cm²)?",
        answer: 6175,
        explanation: "65 × 95 = 6,175 cm²"
    },
    {
        question: "Flyer 21 cm × 29.7 cm (A4). Area (cm²)?",
        answer: 623.7,
        explanation: "21 × 29.7 = 623.7 cm²"
    },
    {
        question: "Graphic 18 cm × 27 cm. Area (cm²)?",
        answer: 486,
        explanation: "18 × 27 = 486 cm²"
    },
    {
        question: "Image 11 cm wide, 15 cm high. Scaled to 22 cm wide. New height (cm)?",
        answer: 30,
        explanation: "22/11 = 2; 15 × 2 = 30 cm"
    },
    {
        question: "Sign 110 cm × 45 cm. Area (cm²)?",
        answer: 4950,
        explanation: "110 × 45 = 4,950 cm²"
    },
    {
        question: "Rectangle 16 cm × 26 cm. Area (cm²)?",
        answer: 416,
        explanation: "16 × 26 = 416 cm²"
    },
    {
        question: "Original 5 cm × 8 cm. Scaled to 20 cm wide. New height (cm)?",
        answer: 32,
        explanation: "20/5 = 4; 8 × 4 = 32 cm"
    },
    {
        question: "Panel 50 cm × 65 cm. Area (cm²)?",
        answer: 3250,
        explanation: "50 × 65 = 3,250 cm²"
    },
    {
        question: "Artboard 42 cm × 59.4 cm (A3). Area (cm²)?",
        answer: 2494.8,
        explanation: "42 × 59.4 = 2,494.8 cm²"
    }
];
// MEDIUM – Ratios & Proportion (aspect ratios, grid columns)
exports.mediumQuestions = [
    {
        question: "Original image ratio = 5:4. Width = 25 cm. What is the correct height (cm)?",
        answer: 20,
        explanation: "25 × 4/5 = 20 cm"
    },
    {
        question: "A design grid has 8 equal columns. Page width is 32 cm. How wide is each column (cm)?",
        answer: 4,
        explanation: "32 ÷ 8 = 4 cm"
    },
    {
        question: "Aspect ratio 16:9. Width = 48 cm. Height (cm)?",
        answer: 27,
        explanation: "48 × 9/16 = 27 cm"
    },
    {
        question: "Grid has 10 columns. Total width 50 cm. Column width (cm)?",
        answer: 5,
        explanation: "50 ÷ 10 = 5 cm"
    },
    {
        question: "Ratio 3:2. Width = 18 cm. Height (cm)?",
        answer: 12,
        explanation: "18 × 2/3 = 12 cm"
    },
    {
        question: "12-column grid. Page 54 cm wide. One column width (cm)?",
        answer: 4.5,
        explanation: "54 ÷ 12 = 4.5 cm"
    },
    {
        question: "Image ratio 4:5. Width = 32 cm. Height (cm)?",
        answer: 40,
        explanation: "32 × 5/4 = 40 cm"
    },
    {
        question: "6 equal columns. Layout width 36 cm. Column width (cm)?",
        answer: 6,
        explanation: "36 ÷ 6 = 6 cm"
    },
    {
        question: "Aspect 4:3. Height = 24 cm. Width (cm)?",
        answer: 32,
        explanation: "24 × 4/3 = 32 cm"
    },
    {
        question: "Grid 9 columns. Width 45 cm. Column width (cm)?",
        answer: 5,
        explanation: "45 ÷ 9 = 5 cm"
    },
    {
        question: "Ratio 2:1. Width = 22 cm. Height (cm)?",
        answer: 11,
        explanation: "22 × 1/2 = 11 cm"
    },
    {
        question: "12 columns. Page 66 cm. One column (cm)?",
        answer: 5.5,
        explanation: "66 ÷ 12 = 5.5 cm"
    },
    {
        question: "Aspect 3:4. Height = 28 cm. Width (cm)?",
        answer: 21,
        explanation: "28 × 3/4 = 21 cm"
    },
    {
        question: "8 columns. Total 32 cm. Column width (cm)?",
        answer: 4,
        explanation: "32 ÷ 8 = 4 cm"
    },
    {
        question: "Ratio 16:10. Width = 40 cm. Height (cm)?",
        answer: 25,
        explanation: "40 × 10/16 = 25 cm"
    },
    {
        question: "Grid 5 columns. Layout 35 cm. Column width (cm)?",
        answer: 7,
        explanation: "35 ÷ 5 = 7 cm"
    },
    {
        question: "Aspect 1:1 (square). One side = 18 cm. Other side (cm)?",
        answer: 18,
        explanation: "1:1 → 18 cm"
    },
    {
        question: "12 columns. Width 54 cm. Column width (cm)?",
        answer: 4.5,
        explanation: "54 ÷ 12 = 4.5 cm"
    },
    {
        question: "Ratio 5:3. Width = 30 cm. Height (cm)?",
        answer: 18,
        explanation: "30 × 3/5 = 18 cm"
    },
    {
        question: "10 columns. Page 40 cm. Column width (cm)?",
        answer: 4,
        explanation: "40 ÷ 10 = 4 cm"
    }
];
// HARD – Layout & Spacing (margins, sections, white space)
exports.hardQuestions = [
    {
        question: "Page width = 36 cm. Left and right margins equal. Content area = 26 cm wide. How wide is each margin (cm)?",
        answer: 5,
        explanation: "(36 − 26) ÷ 2 = 5 cm"
    },
    {
        question: "A banner is divided into 4 equal sections. Total width = 96 cm. Section width (cm)?",
        answer: 24,
        explanation: "96 ÷ 4 = 24 cm"
    },
    {
        question: "You need 12% white space on a 600 cm² design. How much area is reserved for white space (cm²)?",
        answer: 72,
        explanation: "600 × 0.12 = 72 cm²"
    },
    {
        question: "Page 32 cm wide. Content 24 cm. Equal side margins. Each margin (cm)?",
        answer: 4,
        explanation: "(32 − 24) ÷ 2 = 4 cm"
    },
    {
        question: "Banner 140 cm wide, 5 equal panels. Panel width (cm)?",
        answer: 28,
        explanation: "140 ÷ 5 = 28 cm"
    },
    {
        question: "Design 900 cm². 18% white space. White space area (cm²)?",
        answer: 162,
        explanation: "900 × 0.18 = 162 cm²"
    },
    {
        question: "Sheet 48 cm wide. Content 36 cm. Equal margins. Each margin (cm)?",
        answer: 6,
        explanation: "(48 − 36) ÷ 2 = 6 cm"
    },
    {
        question: "Strip 72 cm long, 6 equal sections. Section width (cm)?",
        answer: 12,
        explanation: "72 ÷ 6 = 12 cm"
    },
    {
        question: "Layout 750 cm². 16% margins (white space). Margin area (cm²)?",
        answer: 120,
        explanation: "750 × 0.16 = 120 cm²"
    },
    {
        question: "Page 40 cm. Content 28 cm. Equal side margins. Each (cm)?",
        answer: 6,
        explanation: "(40 − 28) ÷ 2 = 6 cm"
    },
    {
        question: "Banner 90 cm, 6 equal parts. Part width (cm)?",
        answer: 15,
        explanation: "90 ÷ 6 = 15 cm"
    },
    {
        question: "Design 500 cm². 22% white space. White space (cm²)?",
        answer: 110,
        explanation: "500 × 0.22 = 110 cm²"
    },
    {
        question: "Width 56 cm. Content 42 cm. Equal margins. Each margin (cm)?",
        answer: 7,
        explanation: "(56 − 42) ÷ 2 = 7 cm"
    },
    {
        question: "Display 108 cm, 9 equal columns. Column width (cm)?",
        answer: 12,
        explanation: "108 ÷ 9 = 12 cm"
    },
    {
        question: "Canvas 1200 cm². 14% white space. White space (cm²)?",
        answer: 168,
        explanation: "1200 × 0.14 = 168 cm²"
    },
    {
        question: "Page 34 cm. Content 22 cm. Equal margins. Each (cm)?",
        answer: 6,
        explanation: "(34 − 22) ÷ 2 = 6 cm"
    },
    {
        question: "Banner 54 cm, 3 sections. Section width (cm)?",
        answer: 18,
        explanation: "54 ÷ 3 = 18 cm"
    },
    {
        question: "Layout 450 cm². 8% white space. White space (cm²)?",
        answer: 36,
        explanation: "450 × 0.08 = 36 cm²"
    },
    {
        question: "Sheet 52 cm. Content 38 cm. Equal side margins. Each (cm)?",
        answer: 7,
        explanation: "(52 − 38) ÷ 2 = 7 cm"
    },
    {
        question: "Strip 100 cm, 5 equal segments. Segment width (cm)?",
        answer: 20,
        explanation: "100 ÷ 5 = 20 cm"
    }
];
// EXTREME – Scaling & Print (scale %, area change, print size)
exports.extremeQuestions = [
    {
        question: "A logo increases in width by 60%. Original width was 10 cm. What is the new width (cm)?",
        answer: 16,
        explanation: "10 × 1.6 = 16 cm"
    },
    {
        question: "You reduce an image by 30%. Original width 30 cm. New width (cm)?",
        answer: 21,
        explanation: "30 × 0.70 = 21 cm"
    },
    {
        question: "Poster printed at 175% size. Original width = 32 cm. New width (cm)?",
        answer: 56,
        explanation: "32 × 1.75 = 56 cm"
    },
    {
        question: "Design scaled up 45%. Original width 20 cm. New width (cm)?",
        answer: 29,
        explanation: "20 × 1.45 = 29 cm"
    },
    {
        question: "Image reduced to 40%. Original width 35 cm. New width (cm)?",
        answer: 14,
        explanation: "35 × 0.40 = 14 cm"
    },
    {
        question: "Print at 160%. Original width 25 cm. New width (cm)?",
        answer: 40,
        explanation: "25 × 1.6 = 40 cm"
    },
    {
        question: "Logo width increased by 80%. Original 10 cm. New width (cm)?",
        answer: 18,
        explanation: "10 × 1.8 = 18 cm"
    },
    {
        question: "Reduce by 25%. Original width 28 cm. New width (cm)?",
        answer: 21,
        explanation: "28 × 0.75 = 21 cm"
    },
    {
        question: "Print at 220%. Original width 15 cm. New width (cm)?",
        answer: 33,
        explanation: "15 × 2.2 = 33 cm"
    },
    {
        question: "Scale up 85%. Original width 20 cm. New width (cm)?",
        answer: 37,
        explanation: "20 × 1.85 = 37 cm"
    },
    {
        question: "Reduce by 35%. Original 40 cm wide. New width (cm)?",
        answer: 26,
        explanation: "40 × 0.65 = 26 cm"
    },
    {
        question: "Print 280%. Original 18 cm. New width (cm)?",
        answer: 50.4,
        explanation: "18 × 2.8 = 50.4 cm"
    },
    {
        question: "Width increased by 55%. Original 12 cm. New width (cm)?",
        answer: 18.6,
        explanation: "12 × 1.55 = 18.6 cm"
    },
    {
        question: "Scale down 22%. Original width 50 cm. New width (cm)?",
        answer: 39,
        explanation: "50 × 0.78 = 39 cm"
    },
    {
        question: "Print at 135%. Original 28 cm. New width (cm)?",
        answer: 37.8,
        explanation: "28 × 1.35 = 37.8 cm"
    },
    {
        question: "Logo +30% width. Original 14 cm. New width (cm)?",
        answer: 18.2,
        explanation: "14 × 1.30 = 18.2 cm"
    },
    {
        question: "Reduce 18%. Original 25 cm. New width (cm)?",
        answer: 20.5,
        explanation: "25 × 0.82 = 20.5 cm"
    },
    {
        question: "Print 190%. Original 20 cm. New width (cm)?",
        answer: 38,
        explanation: "20 × 1.9 = 38 cm"
    },
    {
        question: "Scale up 55%. Original 22 cm. New width (cm)?",
        answer: 34.1,
        explanation: "22 × 1.55 = 34.1 cm"
    },
    {
        question: "Reduce to 55%. Original 60 cm. New width (cm)?",
        answer: 33,
        explanation: "60 × 0.55 = 33 cm"
    }
];
function getGraphicDesignerQuestion(difficulty) {
    let questions;
    switch (difficulty) {
        case 'easy':
            questions = exports.easyQuestions;
            break;
        case 'medium':
            questions = exports.mediumQuestions;
            break;
        case 'hard':
            questions = exports.hardQuestions;
            break;
        case 'extreme':
            questions = exports.extremeQuestions;
            break;
    }
    return questions[Math.floor(Math.random() * questions.length)];
}
//# sourceMappingURL=graphic-designer-questions.js.map