// Graphic Designer – Design Precision Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers (cm, cm²).

export interface GraphicDesignerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: GraphicDesignerQuestion[] = [
  { question: "A poster is 40 cm wide and 60 cm high. What is the area (in cm²)?", answer: 2400, explanation: "40 × 60 = 2,400 cm²" },
  { question: "A banner is 25 cm by 80 cm. What is its area (cm²)?", answer: 2000, explanation: "25 × 80 = 2,000 cm²" },
  { question: "An image is 30 cm wide and 45 cm tall. Area (cm²)?", answer: 1350, explanation: "30 × 45 = 1,350 cm²" },
  { question: "A card is 10 cm × 15 cm. What is the area (cm²)?", answer: 150, explanation: "10 × 15 = 150 cm²" },
  { question: "You scale an image from 10 cm wide to 20 cm wide. Original height was 15 cm. New height (cm) if proportions stay the same?", answer: 30, explanation: "Scale factor 2; 15 × 2 = 30 cm" },
  { question: "A frame is 50 cm by 70 cm. Area (cm²)?", answer: 3500, explanation: "50 × 70 = 3,500 cm²" },
  { question: "Rectangle 12 cm × 25 cm. Area (cm²)?", answer: 300, explanation: "12 × 25 = 300 cm²" },
  { question: "Image 8 cm wide, 12 cm high. Scaled to 16 cm wide, same proportions. New height (cm)?", answer: 24, explanation: "16/8 = 2; 12 × 2 = 24 cm" },
  { question: "A poster is 35 cm wide and 50 cm high. Area (cm²)?", answer: 1750, explanation: "35 × 50 = 1,750 cm²" },
  { question: "Design 20 cm × 30 cm. Area (cm²)?", answer: 600, explanation: "20 × 30 = 600 cm²" },
  { question: "Original 5 cm wide, 8 cm high. Scaled to 15 cm wide. New height (cm) keeping proportion?", answer: 24, explanation: "15/5 = 3; 8 × 3 = 24 cm" },
  { question: "Canvas 60 cm × 90 cm. Area (cm²)?", answer: 5400, explanation: "60 × 90 = 5,400 cm²" },
  { question: "Flyer 21 cm × 29.7 cm (A4). Area (cm²)?", answer: 623.7, explanation: "21 × 29.7 = 623.7 cm²" },
  { question: "Graphic 16 cm × 24 cm. Area (cm²)?", answer: 384, explanation: "16 × 24 = 384 cm²" },
  { question: "Image 9 cm wide, 12 cm high. Scaled to 18 cm wide. New height (cm)?", answer: 24, explanation: "18/9 = 2; 12 × 2 = 24 cm" },
  { question: "Sign 100 cm × 40 cm. Area (cm²)?", answer: 4000, explanation: "100 × 40 = 4,000 cm²" },
  { question: "Rectangle 14 cm × 22 cm. Area (cm²)?", answer: 308, explanation: "14 × 22 = 308 cm²" },
  { question: "Original 4 cm × 6 cm. Scaled to 12 cm wide. New height (cm)?", answer: 18, explanation: "12/4 = 3; 6 × 3 = 18 cm" },
  { question: "Panel 45 cm × 60 cm. Area (cm²)?", answer: 2700, explanation: "45 × 60 = 2,700 cm²" },
  { question: "Artboard 42 cm × 59.4 cm (A3). Area (cm²)?", answer: 2494.8, explanation: "42 × 59.4 = 2,494.8 cm²" }
];

const mediumQuestions: GraphicDesignerQuestion[] = [
  { question: "Original image ratio = 4:3. Width = 20 cm. What is the correct height (cm)?", answer: 15, explanation: "4:3 → height = 20 × 3/4 = 15 cm" },
  { question: "A design grid has 12 equal columns. Page width is 36 cm. How wide is each column (cm)?", answer: 3, explanation: "36 ÷ 12 = 3 cm" },
  { question: "Aspect ratio 16:9. Width = 32 cm. Height (cm)?", answer: 18, explanation: "32 × 9/16 = 18 cm" },
  { question: "Grid has 6 columns. Total width 24 cm. Column width (cm)?", answer: 4, explanation: "24 ÷ 6 = 4 cm" },
  { question: "Ratio 3:2. Width = 15 cm. Height (cm)?", answer: 10, explanation: "15 × 2/3 = 10 cm" },
  { question: "12-column grid. Page 48 cm wide. One column width (cm)?", answer: 4, explanation: "48 ÷ 12 = 4 cm" },
  { question: "Image ratio 5:4. Width = 25 cm. Height (cm)?", answer: 20, explanation: "25 × 4/5 = 20 cm" },
  { question: "8 equal columns. Layout width 40 cm. Column width (cm)?", answer: 5, explanation: "40 ÷ 8 = 5 cm" },
  { question: "Aspect 4:3. Height = 21 cm. Width (cm)?", answer: 28, explanation: "21 × 4/3 = 28 cm" },
  { question: "Grid 10 columns. Width 30 cm. Column width (cm)?", answer: 3, explanation: "30 ÷ 10 = 3 cm" },
  { question: "Ratio 2:1. Width = 18 cm. Height (cm)?", answer: 9, explanation: "18 × 1/2 = 9 cm" },
  { question: "12 columns. Page 60 cm. One column (cm)?", answer: 5, explanation: "60 ÷ 12 = 5 cm" },
  { question: "Aspect 3:4. Height = 20 cm. Width (cm)?", answer: 15, explanation: "20 × 3/4 = 15 cm" },
  { question: "6 columns. Total 18 cm. Column width (cm)?", answer: 3, explanation: "18 ÷ 6 = 3 cm" },
  { question: "Ratio 16:10. Width = 32 cm. Height (cm)?", answer: 20, explanation: "32 × 10/16 = 20 cm" },
  { question: "Grid 4 columns. Layout 28 cm. Column width (cm)?", answer: 7, explanation: "28 ÷ 4 = 7 cm" },
  { question: "Aspect 1:1 (square). One side = 14 cm. Other side (cm)?", answer: 14, explanation: "1:1 → 14 cm" },
  { question: "12 columns. Width 42 cm. Column width (cm)?", answer: 3.5, explanation: "42 ÷ 12 = 3.5 cm" },
  { question: "Ratio 5:3. Width = 25 cm. Height (cm)?", answer: 15, explanation: "25 × 3/5 = 15 cm" },
  { question: "8 columns. Page 32 cm. Column width (cm)?", answer: 4, explanation: "32 ÷ 8 = 4 cm" }
];

const hardQuestions: GraphicDesignerQuestion[] = [
  { question: "Page width = 30 cm. Left and right margins equal. Content area = 20 cm wide. How wide is each margin (cm)?", answer: 5, explanation: "(30 − 20) ÷ 2 = 5 cm" },
  { question: "A banner is divided into 3 equal sections. Total width = 90 cm. Section width (cm)?", answer: 30, explanation: "90 ÷ 3 = 30 cm" },
  { question: "You need 10% white space on a 500 cm² design. How much area is reserved for white space (cm²)?", answer: 50, explanation: "500 × 0.10 = 50 cm²" },
  { question: "Page 24 cm wide. Content 18 cm. Equal side margins. Each margin (cm)?", answer: 3, explanation: "(24 − 18) ÷ 2 = 3 cm" },
  { question: "Banner 120 cm wide, 4 equal panels. Panel width (cm)?", answer: 30, explanation: "120 ÷ 4 = 30 cm" },
  { question: "Design 800 cm². 15% white space. White space area (cm²)?", answer: 120, explanation: "800 × 0.15 = 120 cm²" },
  { question: "Sheet 40 cm wide. Content 32 cm. Equal margins. Each margin (cm)?", answer: 4, explanation: "(40 − 32) ÷ 2 = 4 cm" },
  { question: "Strip 60 cm long, 5 equal sections. Section width (cm)?", answer: 12, explanation: "60 ÷ 5 = 12 cm" },
  { question: "Layout 600 cm². 20% margins (white space). Margin area (cm²)?", answer: 120, explanation: "600 × 0.20 = 120 cm²" },
  { question: "Page 35 cm. Content 25 cm. Equal side margins. Each (cm)?", answer: 5, explanation: "(35 − 25) ÷ 2 = 5 cm" },
  { question: "Banner 75 cm, 5 equal parts. Part width (cm)?", answer: 15, explanation: "75 ÷ 5 = 15 cm" },
  { question: "Design 400 cm². 25% white space. White space (cm²)?", answer: 100, explanation: "400 × 0.25 = 100 cm²" },
  { question: "Width 50 cm. Content 38 cm. Equal margins. Each margin (cm)?", answer: 6, explanation: "(50 − 38) ÷ 2 = 6 cm" },
  { question: "Display 96 cm, 6 equal columns. Column width (cm)?", answer: 16, explanation: "96 ÷ 6 = 16 cm" },
  { question: "Canvas 1000 cm². 12% white space. White space (cm²)?", answer: 120, explanation: "1000 × 0.12 = 120 cm²" },
  { question: "Page 28 cm. Content 20 cm. Equal margins. Each (cm)?", answer: 4, explanation: "(28 − 20) ÷ 2 = 4 cm" },
  { question: "Banner 45 cm, 3 sections. Section width (cm)?", answer: 15, explanation: "45 ÷ 3 = 15 cm" },
  { question: "Layout 300 cm². 10% white space. White space (cm²)?", answer: 30, explanation: "300 × 0.10 = 30 cm²" },
  { question: "Sheet 44 cm. Content 32 cm. Equal side margins. Each (cm)?", answer: 6, explanation: "(44 − 32) ÷ 2 = 6 cm" },
  { question: "Strip 80 cm, 4 equal segments. Segment width (cm)?", answer: 20, explanation: "80 ÷ 4 = 20 cm" }
];

const extremeQuestions: GraphicDesignerQuestion[] = [
  { question: "A logo increases in width by 50%. Original width was 10 cm. What is the new width (cm)?", answer: 15, explanation: "10 × 1.5 = 15 cm" },
  { question: "You reduce an image by 25%. Original width 24 cm. New width (cm)?", answer: 18, explanation: "24 × 0.75 = 18 cm" },
  { question: "Poster printed at 200% size. Original width = 40 cm. New width (cm)?", answer: 80, explanation: "40 × 2 = 80 cm" },
  { question: "Design scaled up 50%. Original width 16 cm. New width (cm)?", answer: 24, explanation: "16 × 1.5 = 24 cm" },
  { question: "Image reduced to 50%. Original width 30 cm. New width (cm)?", answer: 15, explanation: "30 × 0.5 = 15 cm" },
  { question: "Print at 150%. Original width 20 cm. New width (cm)?", answer: 30, explanation: "20 × 1.5 = 30 cm" },
  { question: "Logo width increased by 100%. Original 8 cm. New width (cm)?", answer: 16, explanation: "8 × 2 = 16 cm" },
  { question: "Reduce by 20%. Original width 25 cm. New width (cm)?", answer: 20, explanation: "25 × 0.80 = 20 cm" },
  { question: "Print at 250%. Original width 12 cm. New width (cm)?", answer: 30, explanation: "12 × 2.5 = 30 cm" },
  { question: "Scale up 75%. Original width 20 cm. New width (cm)?", answer: 35, explanation: "20 × 1.75 = 35 cm" },
  { question: "Reduce by 40%. Original 35 cm wide. New width (cm)?", answer: 21, explanation: "35 × 0.60 = 21 cm" },
  { question: "Print 300%. Original 15 cm. New width (cm)?", answer: 45, explanation: "15 × 3 = 45 cm" },
  { question: "Width increased by 60%. Original 10 cm. New width (cm)?", answer: 16, explanation: "10 × 1.6 = 16 cm" },
  { question: "Scale down 30%. Original width 40 cm. New width (cm)?", answer: 28, explanation: "40 × 0.70 = 28 cm" },
  { question: "Print at 125%. Original 24 cm. New width (cm)?", answer: 30, explanation: "24 × 1.25 = 30 cm" },
  { question: "Logo +25% width. Original 12 cm. New width (cm)?", answer: 15, explanation: "12 × 1.25 = 15 cm" },
  { question: "Reduce 15%. Original 20 cm. New width (cm)?", answer: 17, explanation: "20 × 0.85 = 17 cm" },
  { question: "Print 175%. Original 16 cm. New width (cm)?", answer: 28, explanation: "16 × 1.75 = 28 cm" },
  { question: "Scale up 40%. Original 25 cm. New width (cm)?", answer: 35, explanation: "25 × 1.4 = 35 cm" },
  { question: "Reduce to 60%. Original 50 cm. New width (cm)?", answer: 30, explanation: "50 × 0.60 = 30 cm" }
];

export function getGraphicDesignerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): GraphicDesignerQuestion {
  let questions: GraphicDesignerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
