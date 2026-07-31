// Town Planner – Zoning & Biome Challenge (Planning Proposal)
// 20 questions per difficulty tier. All numeric answers.

export interface TownPlannerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Land Area & Cost (area, price per plot, simple multiplication)
export const easyQuestions: TownPlannerQuestion[] = [
  { question: "A Karoo plot costs R5,400. A student buys 5 plots. Total cost (R)?", answer: 27000, explanation: "5,400 × 5 = R27,000" },
  { question: "A rectangular plot is 24 m × 15 m. What is the area (m²)?", answer: 360, explanation: "24 × 15 = 360 m²" },
  { question: "A plot costs R3,600 each. A student buys 4 plots. Total cost (R)?", answer: 14400, explanation: "3,600 × 4 = R14,400" },
  { question: "A rectangular plot is 16 m × 13 m. Area (m²)?", answer: 208, explanation: "16 × 13 = 208 m²" },
  { question: "R9,200 per plot. 2 plots. Total cost (R)?", answer: 18400, explanation: "9,200 × 2 = R18,400" },
  { question: "Rectangular plot 30 m × 7 m. Area (m²)?", answer: 210, explanation: "30 × 7 = 210 m²" },
  { question: "8 plots at R2,600 each. Total cost (R)?", answer: 20800, explanation: "2,600 × 8 = R20,800" },
  { question: "A square plot is 12 m × 12 m. Area (m²)?", answer: 144, explanation: "12 × 12 = 144 m²" },
  { question: "R6,500 per plot. 3 plots. Total (R)?", answer: 19500, explanation: "6,500 × 3 = R19,500" },
  { question: "Rectangular plot 25 m × 14 m. Area (m²)?", answer: 350, explanation: "25 × 14 = 350 m²" },
  { question: "6 plots at R3,900 each. Total cost (R)?", answer: 23400, explanation: "3,900 × 6 = R23,400" },
  { question: "Plot 17 m × 12 m. Area (m²)?", answer: 204, explanation: "17 × 12 = 204 m²" },
  { question: "R5,500 per plot. 5 plots. Total (R)?", answer: 27500, explanation: "5,500 × 5 = R27,500" },
  { question: "Rectangular plot 21 m × 8 m. Area (m²)?", answer: 168, explanation: "21 × 8 = 168 m²" },
  { question: "4 plots at R5,250 each. Total cost (R)?", answer: 21000, explanation: "5,250 × 4 = R21,000" },
  { question: "Plot 23 m × 13 m. Area (m²)?", answer: 299, explanation: "23 × 13 = 299 m²" },
  { question: "R3,300 per plot. 8 plots. Total (R)?", answer: 26400, explanation: "3,300 × 8 = R26,400" },
  { question: "Rectangular plot 11 m × 15 m. Area (m²)?", answer: 165, explanation: "11 × 15 = 165 m²" },
  { question: "10 plots at R2,200 each. Total cost (R)?", answer: 22000, explanation: "2,200 × 10 = R22,000" },
  { question: "Plot 15 m × 19 m. Area (m²)?", answer: 285, explanation: "15 × 19 = 285 m²" }
];

// MEDIUM – Zoning Percentages (percentage allocation, planning ratios)
export const mediumQuestions: TownPlannerQuestion[] = [
  { question: "Town has 1,400 m² available. 40% must be residential. How many m² is residential?", answer: 560, explanation: "1,400 × 0.40 = 560 m²" },
  { question: "Karoo zone: 25% land reserved for conservation. Plot is 800 m². How much must remain untouched (m²)?", answer: 200, explanation: "800 × 0.25 = 200 m²" },
  { question: "2,800 m² available. 50% commercial. Commercial area (m²)?", answer: 1400, explanation: "2,800 × 0.50 = 1,400 m²" },
  { question: "720 m² total. 30% green space. Green space (m²)?", answer: 216, explanation: "720 × 0.30 = 216 m²" },
  { question: "1,600 m². 60% residential. Residential (m²)?", answer: 960, explanation: "1,600 × 0.60 = 960 m²" },
  { question: "680 m² plot. 20% reserved for conservation. Reserved (m²)?", answer: 136, explanation: "680 × 0.20 = 136 m²" },
  { question: "3,500 m². 32% residential. Residential (m²)?", answer: 1120, explanation: "3,500 × 0.32 = 1,120 m²" },
  { question: "500 m². 36% conservation. Conservation (m²)?", answer: 180, explanation: "500 × 0.36 = 180 m²" },
  { question: "2,000 m². 70% residential. Residential (m²)?", answer: 1400, explanation: "2,000 × 0.70 = 1,400 m²" },
  { question: "Coastal: 15% flood buffer required. 920 m² plot. Buffer (m²)?", answer: 138, explanation: "920 × 0.15 = 138 m²" },
  { question: "2,400 m². 42% commercial. Commercial (m²)?", answer: 1008, explanation: "2,400 × 0.42 = 1,008 m²" },
  { question: "760 m². 28% must remain untouched. Untouched (m²)?", answer: 212.8, explanation: "760 × 0.28 = 212.8 m²" },
  { question: "1,950 m². 38% residential. Residential (m²)?", answer: 741, explanation: "1,950 × 0.38 = 741 m²" },
  { question: "420 m². 50% biodiversity reserve. Reserve (m²)?", answer: 210, explanation: "420 × 0.50 = 210 m²" },
  { question: "3,100 m². 24% green space. Green (m²)?", answer: 744, explanation: "3,100 × 0.24 = 744 m²" },
  { question: "640 m². 30% reserved. Reserved (m²)?", answer: 192, explanation: "640 × 0.30 = 192 m²" },
  { question: "2,200 m². 45% residential. Residential (m²)?", answer: 990, explanation: "2,200 × 0.45 = 990 m²" },
  { question: "540 m². 25% conservation. Conservation (m²)?", answer: 135, explanation: "540 × 0.25 = 135 m²" },
  { question: "4,200 m². 35% roads. Road area (m²)?", answer: 1470, explanation: "4,200 × 0.35 = 1,470 m²" },
  { question: "480 m². 40% reserved. Reserved (m²)?", answer: 192, explanation: "480 × 0.40 = 192 m²" }
];

// HARD – Sustainability Constraints (multi-step, environmental compliance)
export const hardQuestions: TownPlannerQuestion[] = [
  { question: "Desert biome: 40% solar coverage required. Building footprint = 200 m². How much roof space must be solar (m²)?", answer: 80, explanation: "200 × 0.40 = 80 m²" },
  { question: "Forest biome allows only 50% land development. Plot = 1,200 m². Maximum buildable area (m²)?", answer: 600, explanation: "1,200 × 0.50 = 600 m²" },
  { question: "Desert: 50% solar. Building 180 m². Solar roof required (m²)?", answer: 90, explanation: "180 × 0.50 = 90 m²" },
  { question: "Forest: 52% developable. 850 m² plot. Max buildable (m²)?", answer: 442, explanation: "850 × 0.52 = 442 m²" },
  { question: "Coastal: 20% flood buffer. 900 m². Buffer area (m²)?", answer: 180, explanation: "900 × 0.20 = 180 m²" },
  { question: "Desert: 30% solar. Footprint 320 m². Solar (m²)?", answer: 96, explanation: "320 × 0.30 = 96 m²" },
  { question: "Forest: 65% developable. 580 m² plot. Max buildable (m²)?", answer: 377, explanation: "580 × 0.65 = 377 m²" },
  { question: "42% solar coverage. Building 300 m². Solar roof (m²)?", answer: 126, explanation: "300 × 0.42 = 126 m²" },
  { question: "Plot 1,500 m². Only 60% buildable. Max buildable (m²)?", answer: 900, explanation: "1,500 × 0.60 = 900 m²" },
  { question: "Desert: 25% solar. 240 m² building. Solar (m²)?", answer: 60, explanation: "240 × 0.25 = 60 m²" },
  { question: "Forest: 45% development limit. 980 m². Buildable (m²)?", answer: 441, explanation: "980 × 0.45 = 441 m²" },
  { question: "Coastal: 16% flood buffer. 625 m². Buffer (m²)?", answer: 100, explanation: "625 × 0.16 = 100 m²" },
  { question: "Desert: 60% solar. 130 m² footprint. Solar (m²)?", answer: 78, explanation: "130 × 0.60 = 78 m²" },
  { question: "Forest: 55% developable. 1,280 m². Max buildable (m²)?", answer: 704, explanation: "1,280 × 0.55 = 704 m²" },
  { question: "Building 380 m². 35% must be solar. Solar (m²)?", answer: 133, explanation: "380 × 0.35 = 133 m²" },
  { question: "Plot 1,900 m². 44% buildable. Buildable (m²)?", answer: 836, explanation: "1,900 × 0.44 = 836 m²" },
  { question: "Desert: 36% solar. 175 m² building. Solar (m²)?", answer: 63, explanation: "175 × 0.36 = 63 m²" },
  { question: "Forest: 70% development. 680 m². Buildable (m²)?", answer: 476, explanation: "680 × 0.70 = 476 m²" },
  { question: "Coastal: 24% buffer. 1,050 m². Buffer (m²)?", answer: 252, explanation: "1,050 × 0.24 = 252 m²" },
  { question: "Plot 1,750 m². 48% buildable. Max buildable (m²)?", answer: 840, explanation: "1,750 × 0.48 = 840 m²" }
];

// EXTREME – Infrastructure Modelling (road planning, cost distribution, multi-variable zoning)
export const extremeQuestions: TownPlannerQuestion[] = [
  { question: "Town allocates: 45% residential, 25% commercial, 20% roads, 10% green. Total land = 5,400 m². Residential (m²)?", answer: 2430, explanation: "5,400 × 0.45 = 2,430 m²" },
  { question: "Road cost = R480 per metre. Planner designs 130 m of road. Total cost (R)?", answer: 62400, explanation: "480 × 130 = R62,400" },
  { question: "Total 5,400 m². 45% residential, 25% commercial, 20% roads, 10% green. Commercial (m²)?", answer: 1350, explanation: "5,400 × 0.25 = 1,350 m²" },
  { question: "Road R445 per m. 110 m designed. Total cost (R)?", answer: 48950, explanation: "445 × 110 = R48,950" },
  { question: "Total 4,200 m²: 40% residential, 30% commercial, 22% roads, 8% green. Roads (m²)?", answer: 924, explanation: "4,200 × 0.22 = 924 m²" },
  { question: "Road R510 per m. 80 m. Total cost (R)?", answer: 40800, explanation: "510 × 80 = R40,800" },
  { question: "Land 6,800 m²: 42% residential, 28% commercial, 22% roads, 8% green. Green (m²)?", answer: 544, explanation: "6,800 × 0.08 = 544 m²" },
  { question: "Road R425 per m. 120 m. Total (R)?", answer: 51000, explanation: "425 × 120 = R51,000" },
  { question: "Total 3,200 m²: 50% res, 20% com, 22% roads, 8% green. Commercial (m²)?", answer: 640, explanation: "3,200 × 0.20 = 640 m²" },
  { question: "Road R495 per m. 98 m. Total cost (R)?", answer: 48510, explanation: "495 × 98 = R48,510" },
  { question: "Land 9,200 m²: 40% res, 30% com, 22% roads, 8% green. Residential (m²)?", answer: 3680, explanation: "9,200 × 0.40 = 3,680 m²" },
  { question: "Road R550 per m. 85 m. Total (R)?", answer: 46750, explanation: "550 × 85 = R46,750" },
  { question: "Total 5,400 m²: 44% res, 26% com, 24% roads, 6% green. Roads (m²)?", answer: 1296, explanation: "5,400 × 0.24 = 1,296 m²" },
  { question: "Road R525 per m. 96 m. Total cost (R)?", answer: 50400, explanation: "525 × 96 = R50,400" },
  { question: "Land 8,200 m²: 38% res, 32% com, 22% roads, 8% green. Commercial (m²)?", answer: 2624, explanation: "8,200 × 0.32 = 2,624 m²" },
  { question: "Road R490 per m. 118 m. Total (R)?", answer: 57820, explanation: "490 × 118 = R57,820" },
  { question: "Total 4,000 m²: 48% res, 24% com, 20% roads, 8% green. Green (m²)?", answer: 320, explanation: "4,000 × 0.08 = 320 m²" },
  { question: "Road R435 per m. 108 m. Total cost (R)?", answer: 46980, explanation: "435 × 108 = R46,980" },
  { question: "Land 10,400 m²: 46% res, 28% com, 20% roads, 6% green. Residential (m²)?", answer: 4784, explanation: "10,400 × 0.46 = 4,784 m²" },
  { question: "Road R475 per m. 100 m. Total (R)?", answer: 47500, explanation: "475 × 100 = R47,500" }
];

export function getTownPlannerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): TownPlannerQuestion {
  let questions: TownPlannerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
