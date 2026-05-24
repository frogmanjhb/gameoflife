// Town Planner – Zoning & Biome Challenge (Planning Proposal)
// 20 questions per difficulty tier. All numeric answers.

export interface TownPlannerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Land Area & Cost (area, price per plot, simple multiplication)
export const easyQuestions: TownPlannerQuestion[] = [
  {
    question: "A Savanna plot costs R6,200. A student buys 4 plots. Total cost (R)?",
    answer: 24800,
    explanation: "6,200 × 4 = R24,800"
  },
  {
    question: "A rectangular plot is 22 m × 16 m. What is the area (m²)?",
    answer: 352,
    explanation: "22 × 16 = 352 m²"
  },
  {
    question: "A plot costs R2,400 each. A student buys 6 plots. Total cost (R)?",
    answer: 14400,
    explanation: "2,400 × 6 = R14,400"
  },
  {
    question: "A rectangular plot is 12 m × 9 m. Area (m²)?",
    answer: 108,
    explanation: "12 × 9 = 108 m²"
  },
  {
    question: "R8,500 per plot. 3 plots. Total cost (R)?",
    answer: 25500,
    explanation: "8,500 × 3 = R25,500"
  },
  {
    question: "Rectangular plot 28 m × 5 m. Area (m²)?",
    answer: 140,
    explanation: "28 × 5 = 140 m²"
  },
  {
    question: "5 plots at R3,200 each. Total cost (R)?",
    answer: 16000,
    explanation: "3,200 × 5 = R16,000"
  },
  {
    question: "A square plot is 14 m × 14 m. Area (m²)?",
    answer: 196,
    explanation: "14 × 14 = 196 m²"
  },
  {
    question: "R5,800 per plot. 5 plots. Total (R)?",
    answer: 29000,
    explanation: "5,800 × 5 = R29,000"
  },
  {
    question: "Rectangular plot 32 m × 18 m. Area (m²)?",
    answer: 576,
    explanation: "32 × 18 = 576 m²"
  },
  {
    question: "7 plots at R2,800 each. Total cost (R)?",
    answer: 19600,
    explanation: "2,800 × 7 = R19,600"
  },
  {
    question: "Plot 18 m × 11 m. Area (m²)?",
    answer: 198,
    explanation: "18 × 11 = 198 m²"
  },
  {
    question: "R7,200 per plot. 4 plots. Total (R)?",
    answer: 28800,
    explanation: "7,200 × 4 = R28,800"
  },
  {
    question: "Rectangular plot 20 m × 6 m. Area (m²)?",
    answer: 120,
    explanation: "20 × 6 = 120 m²"
  },
  {
    question: "6 plots at R4,500 each. Total cost (R)?",
    answer: 27000,
    explanation: "4,500 × 6 = R27,000"
  },
  {
    question: "Plot 26 m × 11 m. Area (m²)?",
    answer: 286,
    explanation: "26 × 11 = 286 m²"
  },
  {
    question: "R4,200 per plot. 7 plots. Total (R)?",
    answer: 29400,
    explanation: "4,200 × 7 = R29,400"
  },
  {
    question: "Rectangular plot 9 m × 11 m. Area (m²)?",
    answer: 99,
    explanation: "9 × 11 = 99 m²"
  },
  {
    question: "9 plots at R1,800 each. Total cost (R)?",
    answer: 16200,
    explanation: "1,800 × 9 = R16,200"
  },
  {
    question: "Plot 19 m × 17 m. Area (m²)?",
    answer: 323,
    explanation: "19 × 17 = 323 m²"
  }
];

// MEDIUM – Zoning Percentages (percentage allocation, planning ratios)
export const mediumQuestions: TownPlannerQuestion[] = [
  {
    question: "Town has 1,200 m² available. 35% must be residential. How many m² is residential?",
    answer: 420,
    explanation: "1,200 × 0.35 = 420 m²"
  },
  {
    question: "Karoo zone: 30% land reserved for conservation. Plot is 900 m². How much must remain untouched (m²)?",
    answer: 270,
    explanation: "900 × 0.30 = 270 m²"
  },
  {
    question: "2,400 m² available. 45% commercial. Commercial area (m²)?",
    answer: 1080,
    explanation: "2,400 × 0.45 = 1,080 m²"
  },
  {
    question: "600 m² total. 25% green space. Green space (m²)?",
    answer: 150,
    explanation: "600 × 0.25 = 150 m²"
  },
  {
    question: "1,500 m². 55% residential. Residential (m²)?",
    answer: 825,
    explanation: "1,500 × 0.55 = 825 m²"
  },
  {
    question: "750 m² plot. 18% reserved for conservation. Reserved (m²)?",
    answer: 135,
    explanation: "750 × 0.18 = 135 m²"
  },
  {
    question: "3,200 m². 28% residential. Residential (m²)?",
    answer: 896,
    explanation: "3,200 × 0.28 = 896 m²"
  },
  {
    question: "450 m². 40% conservation. Conservation (m²)?",
    answer: 180,
    explanation: "450 × 0.40 = 180 m²"
  },
  {
    question: "1,800 m². 65% residential. Residential (m²)?",
    answer: 1170,
    explanation: "1,800 × 0.65 = 1,170 m²"
  },
  {
    question: "Coastal: 22% flood buffer required. 850 m² plot. Buffer (m²)?",
    answer: 187,
    explanation: "850 × 0.22 = 187 m²"
  },
  {
    question: "2,600 m². 38% commercial. Commercial (m²)?",
    answer: 988,
    explanation: "2,600 × 0.38 = 988 m²"
  },
  {
    question: "820 m². 32% must remain untouched. Untouched (m²)?",
    answer: 262.4,
    explanation: "820 × 0.32 = 262.4 m²"
  },
  {
    question: "2,100 m². 42% residential. Residential (m²)?",
    answer: 882,
    explanation: "2,100 × 0.42 = 882 m²"
  },
  {
    question: "380 m². 45% biodiversity reserve. Reserve (m²)?",
    answer: 171,
    explanation: "380 × 0.45 = 171 m²"
  },
  {
    question: "2,900 m². 22% green space. Green (m²)?",
    answer: 638,
    explanation: "2,900 × 0.22 = 638 m²"
  },
  {
    question: "720 m². 25% reserved. Reserved (m²)?",
    answer: 180,
    explanation: "720 × 0.25 = 180 m²"
  },
  {
    question: "2,500 m². 48% residential. Residential (m²)?",
    answer: 1200,
    explanation: "2,500 × 0.48 = 1,200 m²"
  },
  {
    question: "580 m². 20% conservation. Conservation (m²)?",
    answer: 116,
    explanation: "580 × 0.20 = 116 m²"
  },
  {
    question: "3,800 m². 30% roads. Road area (m²)?",
    answer: 1140,
    explanation: "3,800 × 0.30 = 1,140 m²"
  },
  {
    question: "520 m². 35% reserved. Reserved (m²)?",
    answer: 182,
    explanation: "520 × 0.35 = 182 m²"
  }
];

// HARD – Sustainability Constraints (multi-step, environmental compliance)
export const hardQuestions: TownPlannerQuestion[] = [
  {
    question: "Desert biome: 35% solar coverage required. Building footprint = 220 m². How much roof space must be solar (m²)?",
    answer: 77,
    explanation: "220 × 0.35 = 77 m²"
  },
  {
    question: "Forest biome allows only 55% land development. Plot = 1,400 m². Maximum buildable area (m²)?",
    answer: 770,
    explanation: "1,400 × 0.55 = 770 m²"
  },
  {
    question: "Desert: 45% solar. Building 160 m². Solar roof required (m²)?",
    answer: 72,
    explanation: "160 × 0.45 = 72 m²"
  },
  {
    question: "Forest: 48% developable. 950 m² plot. Max buildable (m²)?",
    answer: 456,
    explanation: "950 × 0.48 = 456 m²"
  },
  {
    question: "Coastal: 18% flood buffer. 1,100 m². Buffer area (m²)?",
    answer: 198,
    explanation: "1,100 × 0.18 = 198 m²"
  },
  {
    question: "Desert: 28% solar. Footprint 350 m². Solar (m²)?",
    answer: 98,
    explanation: "350 × 0.28 = 98 m²"
  },
  {
    question: "Forest: 62% developable. 650 m² plot. Max buildable (m²)?",
    answer: 403,
    explanation: "650 × 0.62 = 403 m²"
  },
  {
    question: "38% solar coverage. Building 250 m². Solar roof (m²)?",
    answer: 95,
    explanation: "250 × 0.38 = 95 m²"
  },
  {
    question: "Plot 1,350 m². Only 58% buildable. Max buildable (m²)?",
    answer: 783,
    explanation: "1,350 × 0.58 = 783 m²"
  },
  {
    question: "Desert: 22% solar. 280 m² building. Solar (m²)?",
    answer: 61.6,
    explanation: "280 × 0.22 = 61.6 m²"
  },
  {
    question: "Forest: 42% development limit. 1,050 m². Buildable (m²)?",
    answer: 441,
    explanation: "1,050 × 0.42 = 441 m²"
  },
  {
    question: "Coastal: 12% flood buffer. 750 m². Buffer (m²)?",
    answer: 90,
    explanation: "750 × 0.12 = 90 m²"
  },
  {
    question: "Desert: 55% solar. 140 m² footprint. Solar (m²)?",
    answer: 77,
    explanation: "140 × 0.55 = 77 m²"
  },
  {
    question: "Forest: 58% developable. 1,150 m². Max buildable (m²)?",
    answer: 667,
    explanation: "1,150 × 0.58 = 667 m²"
  },
  {
    question: "Building 450 m². 28% must be solar. Solar (m²)?",
    answer: 126,
    explanation: "450 × 0.28 = 126 m²"
  },
  {
    question: "Plot 2,200 m². 38% buildable. Buildable (m²)?",
    answer: 836,
    explanation: "2,200 × 0.38 = 836 m²"
  },
  {
    question: "Desert: 32% solar. 195 m² building. Solar (m²)?",
    answer: 62.4,
    explanation: "195 × 0.32 = 62.4 m²"
  },
  {
    question: "Forest: 68% development. 720 m². Buildable (m²)?",
    answer: 489.6,
    explanation: "720 × 0.68 = 489.6 m²"
  },
  {
    question: "Coastal: 28% buffer. 950 m². Buffer (m²)?",
    answer: 266,
    explanation: "950 × 0.28 = 266 m²"
  },
  {
    question: "Plot 1,650 m². 52% buildable. Max buildable (m²)?",
    answer: 858,
    explanation: "1,650 × 0.52 = 858 m²"
  }
];

// EXTREME – Infrastructure Modelling (road planning, cost distribution, multi-variable zoning)
export const extremeQuestions: TownPlannerQuestion[] = [
  {
    question: "Town allocates: 45% residential, 25% commercial, 20% roads, 10% green. Total land = 6,000 m². Residential (m²)?",
    answer: 2700,
    explanation: "6,000 × 0.45 = 2,700 m²"
  },
  {
    question: "Road cost = R520 per metre. Planner designs 140 m of road. Total cost (R)?",
    answer: 72800,
    explanation: "520 × 140 = R72,800"
  },
  {
    question: "Total 6,000 m². 45% residential, 25% commercial, 20% roads, 10% green. Commercial (m²)?",
    answer: 1500,
    explanation: "6,000 × 0.25 = 1,500 m²"
  },
  {
    question: "Road R430 per m. 95 m designed. Total cost (R)?",
    answer: 40850,
    explanation: "430 × 95 = R40,850"
  },
  {
    question: "Total 4,500 m²: 42% residential, 28% commercial, 22% roads, 8% green. Roads (m²)?",
    answer: 990,
    explanation: "4,500 × 0.22 = 990 m²"
  },
  {
    question: "Road R580 per m. 65 m. Total cost (R)?",
    answer: 37700,
    explanation: "580 × 65 = R37,700"
  },
  {
    question: "Land 7,200 m²: 40% residential, 30% commercial, 20% roads, 10% green. Green (m²)?",
    answer: 720,
    explanation: "7,200 × 0.10 = 720 m²"
  },
  {
    question: "Road R390 per m. 115 m. Total (R)?",
    answer: 44850,
    explanation: "390 × 115 = R44,850"
  },
  {
    question: "Total 3,600 m²: 48% res, 22% com, 18% roads, 12% green. Commercial (m²)?",
    answer: 792,
    explanation: "3,600 × 0.22 = 792 m²"
  },
  {
    question: "Road R470 per m. 105 m. Total cost (R)?",
    answer: 49350,
    explanation: "470 × 105 = R49,350"
  },
  {
    question: "Land 8,500 m²: 38% res, 32% com, 22% roads, 8% green. Residential (m²)?",
    answer: 3230,
    explanation: "8,500 × 0.38 = 3,230 m²"
  },
  {
    question: "Road R560 per m. 72 m. Total (R)?",
    answer: 40320,
    explanation: "560 × 72 = R40,320"
  },
  {
    question: "Total 5,800 m²: 42% res, 23% com, 27% roads, 8% green. Roads (m²)?",
    answer: 1566,
    explanation: "5,800 × 0.27 = 1,566 m²"
  },
  {
    question: "Road R505 per m. 88 m. Total cost (R)?",
    answer: 44440,
    explanation: "505 × 88 = R44,440"
  },
  {
    question: "Land 7,800 m²: 36% res, 34% com, 22% roads, 8% green. Commercial (m²)?",
    answer: 2652,
    explanation: "7,800 × 0.34 = 2,652 m²"
  },
  {
    question: "Road R540 per m. 125 m. Total (R)?",
    answer: 67500,
    explanation: "540 × 125 = R67,500"
  },
  {
    question: "Total 4,800 m²: 46% res, 24% com, 22% roads, 8% green. Green (m²)?",
    answer: 384,
    explanation: "4,800 × 0.08 = 384 m²"
  },
  {
    question: "Road R415 per m. 102 m. Total cost (R)?",
    answer: 42330,
    explanation: "415 × 102 = R42,330"
  },
  {
    question: "Land 9,600 m²: 44% res, 26% com, 22% roads, 8% green. Residential (m²)?",
    answer: 4224,
    explanation: "9,600 × 0.44 = 4,224 m²"
  },
  {
    question: "Road R460 per m. 92 m. Total (R)?",
    answer: 42320,
    explanation: "460 × 92 = R42,320"
  }
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
