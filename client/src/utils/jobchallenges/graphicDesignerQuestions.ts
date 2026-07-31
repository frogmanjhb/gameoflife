// Graphic Designer – Design Precision Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface GraphicDesignerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Size & Dimensions (width×height, area, proportional resizing)
const easyQuestions: GraphicDesignerQuestion[] = [
  { question: "A township mural poster is 52 cm wide and 78 cm high. What is the area (cm²)?", answer: 4056, explanation: "52 × 78 = 4,056 cm²" },
  { question: "A school fete banner is 28 cm by 84 cm. What is its area (cm²)?", answer: 2352, explanation: "28 × 84 = 2,352 cm²" },
  { question: "A logo mock-up is 40 cm wide and 60 cm tall. Area (cm²)?", answer: 2400, explanation: "40 × 60 = 2,400 cm²" },
  { question: "An invitation card is 14 cm × 21 cm. What is the area (cm²)?", answer: 294, explanation: "14 × 21 = 294 cm²" },
  { question: "You scale a badge from 8 cm wide to 32 cm wide. Original height was 12 cm. New height (cm) if proportions stay the same?", answer: 48, explanation: "Scale factor 4; 12 × 4 = 48 cm" },
  { question: "A photo frame is 60 cm by 80 cm. Area (cm²)?", answer: 4800, explanation: "60 × 80 = 4,800 cm²" },
  { question: "Rectangle 17 cm × 25 cm. Area (cm²)?", answer: 425, explanation: "17 × 25 = 425 cm²" },
  { question: "Image 8 cm wide, 12 cm high. Scaled to 30 cm wide, same proportions. New height (cm)?", answer: 45, explanation: "30/8 = 3.75; 12 × 3.75 = 45 cm" },
  { question: "A heritage day poster is 45 cm wide and 60 cm high. Area (cm²)?", answer: 2700, explanation: "45 × 60 = 2,700 cm²" },
  { question: "Brochure design 20 cm × 30 cm. Area (cm²)?", answer: 600, explanation: "20 × 30 = 600 cm²" },
  { question: "Original 7 cm wide, 14 cm high. Scaled to 21 cm wide. New height (cm) keeping proportion?", answer: 42, explanation: "21/7 = 3; 14 × 3 = 42 cm" },
  { question: "Exhibition canvas 70 cm × 100 cm. Area (cm²)?", answer: 7000, explanation: "70 × 100 = 7,000 cm²" },
  { question: "Community newsletter 22 cm × 31 cm. Area (cm²)?", answer: 682, explanation: "22 × 31 = 682 cm²" },
  { question: "Social media graphic 19 cm × 28 cm. Area (cm²)?", answer: 532, explanation: "19 × 28 = 532 cm²" },
  { question: "Image 9 cm wide, 16 cm high. Scaled to 27 cm wide. New height (cm)?", answer: 48, explanation: "27/9 = 3; 16 × 3 = 48 cm" },
  { question: "Shopfront sign 120 cm × 50 cm. Area (cm²)?", answer: 6000, explanation: "120 × 50 = 6,000 cm²" },
  { question: "Rectangle 14 cm × 22 cm. Area (cm²)?", answer: 308, explanation: "14 × 22 = 308 cm²" },
  { question: "Original 4 cm × 9 cm. Scaled to 16 cm wide. New height (cm)?", answer: 36, explanation: "16/4 = 4; 9 × 4 = 36 cm" },
  { question: "Display panel 45 cm × 70 cm. Area (cm²)?", answer: 3150, explanation: "45 × 70 = 3,150 cm²" },
  { question: "Artboard 30 cm × 42 cm. Area (cm²)?", answer: 1260, explanation: "30 × 42 = 1,260 cm²" },
];

// MEDIUM – Ratios & Proportion (aspect ratios, grid columns)
const mediumQuestions: GraphicDesignerQuestion[] = [
  { question: "Original image ratio = 5:4. Width = 30 cm. What is the correct height (cm)?", answer: 24, explanation: "30 × 4/5 = 24 cm" },
  { question: "A design grid has 6 equal columns. Page width is 36 cm. How wide is each column (cm)?", answer: 6, explanation: "36 ÷ 6 = 6 cm" },
  { question: "Aspect ratio 16:9. Width = 64 cm. Height (cm)?", answer: 36, explanation: "64 × 9/16 = 36 cm" },
  { question: "Grid has 8 columns. Total width 40 cm. Column width (cm)?", answer: 5, explanation: "40 ÷ 8 = 5 cm" },
  { question: "Ratio 3:2. Width = 21 cm. Height (cm)?", answer: 14, explanation: "21 × 2/3 = 14 cm" },
  { question: "12-column grid. Page 48 cm wide. One column width (cm)?", answer: 4, explanation: "48 ÷ 12 = 4 cm" },
  { question: "Image ratio 4:5. Width = 28 cm. Height (cm)?", answer: 35, explanation: "28 × 5/4 = 35 cm" },
  { question: "5 equal columns. Layout width 45 cm. Column width (cm)?", answer: 9, explanation: "45 ÷ 5 = 9 cm" },
  { question: "Aspect 4:3. Height = 21 cm. Width (cm)?", answer: 28, explanation: "21 × 4/3 = 28 cm" },
  { question: "Grid 9 columns. Width 63 cm. Column width (cm)?", answer: 7, explanation: "63 ÷ 9 = 7 cm" },
  { question: "Ratio 2:1. Width = 26 cm. Height (cm)?", answer: 13, explanation: "26 × 1/2 = 13 cm" },
  { question: "12 columns. Page 72 cm. One column (cm)?", answer: 6, explanation: "72 ÷ 12 = 6 cm" },
  { question: "Aspect 3:4. Height = 32 cm. Width (cm)?", answer: 24, explanation: "32 × 3/4 = 24 cm" },
  { question: "7 columns. Total 49 cm. Column width (cm)?", answer: 7, explanation: "49 ÷ 7 = 7 cm" },
  { question: "Ratio 16:10. Width = 48 cm. Height (cm)?", answer: 30, explanation: "48 × 10/16 = 30 cm" },
  { question: "Grid 4 columns. Layout 44 cm. Column width (cm)?", answer: 11, explanation: "44 ÷ 4 = 11 cm" },
  { question: "Aspect 1:1 (square). One side = 22 cm. Other side (cm)?", answer: 22, explanation: "1:1 → 22 cm" },
  { question: "12 columns. Width 60 cm. Column width (cm)?", answer: 5, explanation: "60 ÷ 12 = 5 cm" },
  { question: "Ratio 5:3. Width = 35 cm. Height (cm)?", answer: 21, explanation: "35 × 3/5 = 21 cm" },
  { question: "10 columns. Page 50 cm. Column width (cm)?", answer: 5, explanation: "50 ÷ 10 = 5 cm" },
];

// HARD – Layout & Spacing (margins, sections, white space)
const hardQuestions: GraphicDesignerQuestion[] = [
  { question: "Page width = 38 cm. Left and right margins equal. Content area = 28 cm wide. How wide is each margin (cm)?", answer: 5, explanation: "(38 − 28) ÷ 2 = 5 cm" },
  { question: "A banner is divided into 4 equal sections. Total width = 88 cm. Section width (cm)?", answer: 22, explanation: "88 ÷ 4 = 22 cm" },
  { question: "You need 15% white space on a 600 cm² design. How much area is reserved for white space (cm²)?", answer: 90, explanation: "600 × 0.15 = 90 cm²" },
  { question: "Page 44 cm wide. Content 32 cm. Equal side margins. Each margin (cm)?", answer: 6, explanation: "(44 − 32) ÷ 2 = 6 cm" },
  { question: "Banner 150 cm wide, 5 equal panels. Panel width (cm)?", answer: 30, explanation: "150 ÷ 5 = 30 cm" },
  { question: "Design 800 cm². 20% white space. White space area (cm²)?", answer: 160, explanation: "800 × 0.20 = 160 cm²" },
  { question: "Sheet 50 cm wide. Content 38 cm. Equal margins. Each margin (cm)?", answer: 6, explanation: "(50 − 38) ÷ 2 = 6 cm" },
  { question: "Strip 84 cm long, 7 equal sections. Section width (cm)?", answer: 12, explanation: "84 ÷ 7 = 12 cm" },
  { question: "Layout 900 cm². 10% margins (white space). Margin area (cm²)?", answer: 90, explanation: "900 × 0.10 = 90 cm²" },
  { question: "Page 36 cm. Content 24 cm. Equal side margins. Each (cm)?", answer: 6, explanation: "(36 − 24) ÷ 2 = 6 cm" },
  { question: "Banner 105 cm, 7 equal parts. Part width (cm)?", answer: 15, explanation: "105 ÷ 7 = 15 cm" },
  { question: "Design 1000 cm². 25% white space. White space (cm²)?", answer: 250, explanation: "1000 × 0.25 = 250 cm²" },
  { question: "Width 60 cm. Content 44 cm. Equal margins. Each margin (cm)?", answer: 8, explanation: "(60 − 44) ÷ 2 = 8 cm" },
  { question: "Display 96 cm, 8 equal columns. Column width (cm)?", answer: 12, explanation: "96 ÷ 8 = 12 cm" },
  { question: "Canvas 1500 cm². 12% white space. White space (cm²)?", answer: 180, explanation: "1500 × 0.12 = 180 cm²" },
  { question: "Page 42 cm. Content 30 cm. Equal margins. Each (cm)?", answer: 6, explanation: "(42 − 30) ÷ 2 = 6 cm" },
  { question: "Banner 63 cm, 3 sections. Section width (cm)?", answer: 21, explanation: "63 ÷ 3 = 21 cm" },
  { question: "Layout 550 cm². 6% white space. White space (cm²)?", answer: 33, explanation: "550 × 0.06 = 33 cm²" },
  { question: "Sheet 58 cm. Content 42 cm. Equal side margins. Each (cm)?", answer: 8, explanation: "(58 − 42) ÷ 2 = 8 cm" },
  { question: "Strip 120 cm, 6 equal segments. Segment width (cm)?", answer: 20, explanation: "120 ÷ 6 = 20 cm" },
];

// EXTREME – Scaling & Print (scale %, area change, print size)
const extremeQuestions: GraphicDesignerQuestion[] = [
  { question: "A logo increases in width by 50%. Original width was 12 cm. What is the new width (cm)?", answer: 18, explanation: "12 × 1.5 = 18 cm" },
  { question: "You reduce an image by 40%. Original width 25 cm. New width (cm)?", answer: 15, explanation: "25 × 0.60 = 15 cm" },
  { question: "Poster printed at 150% size. Original width = 24 cm. New width (cm)?", answer: 36, explanation: "24 × 1.5 = 36 cm" },
  { question: "Design scaled up 25%. Original width 16 cm. New width (cm)?", answer: 20, explanation: "16 × 1.25 = 20 cm" },
  { question: "Image reduced to 50%. Original width 42 cm. New width (cm)?", answer: 21, explanation: "42 × 0.50 = 21 cm" },
  { question: "Print at 125%. Original width 32 cm. New width (cm)?", answer: 40, explanation: "32 × 1.25 = 40 cm" },
  { question: "Logo width increased by 75%. Original 8 cm. New width (cm)?", answer: 14, explanation: "8 × 1.75 = 14 cm" },
  { question: "Reduce by 20%. Original width 35 cm. New width (cm)?", answer: 28, explanation: "35 × 0.80 = 28 cm" },
  { question: "Print at 200%. Original width 14 cm. New width (cm)?", answer: 28, explanation: "14 × 2.0 = 28 cm" },
  { question: "Scale up 40%. Original width 25 cm. New width (cm)?", answer: 35, explanation: "25 × 1.40 = 35 cm" },
  { question: "Reduce by 45%. Original 40 cm wide. New width (cm)?", answer: 22, explanation: "40 × 0.55 = 22 cm" },
  { question: "Print 250%. Original 12 cm. New width (cm)?", answer: 30, explanation: "12 × 2.5 = 30 cm" },
  { question: "Width increased by 60%. Original 10 cm. New width (cm)?", answer: 16, explanation: "10 × 1.6 = 16 cm" },
  { question: "Scale down 30%. Original width 50 cm. New width (cm)?", answer: 35, explanation: "50 × 0.70 = 35 cm" },
  { question: "Print at 120%. Original 25 cm. New width (cm)?", answer: 30, explanation: "25 × 1.20 = 30 cm" },
  { question: "Logo +25% width. Original 20 cm. New width (cm)?", answer: 25, explanation: "20 × 1.25 = 25 cm" },
  { question: "Reduce 15%. Original 40 cm. New width (cm)?", answer: 34, explanation: "40 × 0.85 = 34 cm" },
  { question: "Print 180%. Original 15 cm. New width (cm)?", answer: 27, explanation: "15 × 1.8 = 27 cm" },
  { question: "Scale up 50%. Original 18 cm. New width (cm)?", answer: 27, explanation: "18 × 1.5 = 27 cm" },
  { question: "Reduce to 60%. Original 50 cm. New width (cm)?", answer: 30, explanation: "50 × 0.60 = 30 cm" },
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
