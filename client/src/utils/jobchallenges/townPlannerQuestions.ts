// Town Planner – Zoning & Biome Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface TownPlannerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: TownPlannerQuestion[] = [
  { question: "A Grassland plot costs R5,000. A student buys 3 plots. Total cost (R)?", answer: 15000, explanation: "5,000 × 3 = R15,000" },
  { question: "A rectangular plot is 20 m × 15 m. What is the area (m²)?", answer: 300, explanation: "20 × 15 = 300 m²" },
  { question: "A plot costs R2,000 each. A student buys 5 plots. Total cost (R)?", answer: 10000, explanation: "2,000 × 5 = R10,000" },
  { question: "A rectangular plot is 10 m × 8 m. Area (m²)?", answer: 80, explanation: "10 × 8 = 80 m²" },
  { question: "R7,500 per plot. 2 plots. Total cost (R)?", answer: 15000, explanation: "7,500 × 2 = R15,000" },
  { question: "Rectangular plot 25 m × 4 m. Area (m²)?", answer: 100, explanation: "25 × 4 = 100 m²" },
  { question: "4 plots at R3,000 each. Total cost (R)?", answer: 12000, explanation: "3,000 × 4 = R12,000" },
  { question: "A square plot is 12 m × 12 m. Area (m²)?", answer: 144, explanation: "12 × 12 = 144 m²" },
  { question: "R4,500 per plot. 4 plots. Total (R)?", answer: 18000, explanation: "4,500 × 4 = R18,000" },
  { question: "Rectangular plot 30 m × 20 m. Area (m²)?", answer: 600, explanation: "30 × 20 = 600 m²" },
  { question: "6 plots at R2,500 each. Total cost (R)?", answer: 15000, explanation: "2,500 × 6 = R15,000" },
  { question: "Plot 15 m × 10 m. Area (m²)?", answer: 150, explanation: "15 × 10 = 150 m²" },
  { question: "R6,000 per plot. 3 plots. Total (R)?", answer: 18000, explanation: "6,000 × 3 = R18,000" },
  { question: "Rectangular plot 18 m × 5 m. Area (m²)?", answer: 90, explanation: "18 × 5 = 90 m²" },
  { question: "5 plots at R4,000 each. Total cost (R)?", answer: 20000, explanation: "4,000 × 5 = R20,000" },
  { question: "Plot 24 m × 10 m. Area (m²)?", answer: 240, explanation: "24 × 10 = 240 m²" },
  { question: "R3,500 per plot. 6 plots. Total (R)?", answer: 21000, explanation: "3,500 × 6 = R21,000" },
  { question: "Rectangular plot 7 m × 9 m. Area (m²)?", answer: 63, explanation: "7 × 9 = 63 m²" },
  { question: "8 plots at R1,500 each. Total cost (R)?", answer: 12000, explanation: "1,500 × 8 = R12,000" },
  { question: "Plot 16 m × 15 m. Area (m²)?", answer: 240, explanation: "16 × 15 = 240 m²" }
];

const mediumQuestions: TownPlannerQuestion[] = [
  { question: "Town has 1,000 m² available. 40% must be residential. How many m² is residential?", answer: 400, explanation: "1,000 × 0.40 = 400 m²" },
  { question: "Fynbos zone: 25% land reserved for conservation. Plot is 800 m². How much must remain untouched (m²)?", answer: 200, explanation: "800 × 0.25 = 200 m²" },
  { question: "2,000 m² available. 30% commercial. Commercial area (m²)?", answer: 600, explanation: "2,000 × 0.30 = 600 m²" },
  { question: "500 m² total. 20% green space. Green space (m²)?", answer: 100, explanation: "500 × 0.20 = 100 m²" },
  { question: "1,200 m². 50% residential. Residential (m²)?", answer: 600, explanation: "1,200 × 0.50 = 600 m²" },
  { question: "600 m² plot. 15% reserved for conservation. Reserved (m²)?", answer: 90, explanation: "600 × 0.15 = 90 m²" },
  { question: "3,000 m². 25% residential. Residential (m²)?", answer: 750, explanation: "3,000 × 0.25 = 750 m²" },
  { question: "400 m². 35% conservation. Conservation (m²)?", answer: 140, explanation: "400 × 0.35 = 140 m²" },
  { question: "1,500 m². 60% residential. Residential (m²)?", answer: 900, explanation: "1,500 × 0.60 = 900 m²" },
  { question: "Coastal: 20% flood buffer required. 900 m² plot. Buffer (m²)?", answer: 180, explanation: "900 × 0.20 = 180 m²" },
  { question: "2,400 m². 45% commercial. Commercial (m²)?", answer: 1080, explanation: "2,400 × 0.45 = 1,080 m²" },
  { question: "750 m². 30% must remain untouched. Untouched (m²)?", answer: 225, explanation: "750 × 0.30 = 225 m²" },
  { question: "1,800 m². 35% residential. Residential (m²)?", answer: 630, explanation: "1,800 × 0.35 = 630 m²" },
  { question: "350 m². 40% biodiversity reserve. Reserve (m²)?", answer: 140, explanation: "350 × 0.40 = 140 m²" },
  { question: "2,700 m². 20% green space. Green (m²)?", answer: 540, explanation: "2,700 × 0.20 = 540 m²" },
  { question: "650 m². 20% reserved. Reserved (m²)?", answer: 130, explanation: "650 × 0.20 = 130 m²" },
  { question: "2,200 m². 50% residential. Residential (m²)?", answer: 1100, explanation: "2,200 × 0.50 = 1,100 m²" },
  { question: "550 m². 18% conservation. Conservation (m²)?", answer: 99, explanation: "550 × 0.18 = 99 m²" },
  { question: "3,600 m². 25% roads. Road area (m²)?", answer: 900, explanation: "3,600 × 0.25 = 900 m²" },
  { question: "480 m². 30% reserved. Reserved (m²)?", answer: 144, explanation: "480 × 0.30 = 144 m²" }
];

const hardQuestions: TownPlannerQuestion[] = [
  { question: "Desert biome: 30% solar coverage required. Building footprint = 200 m². How much roof space must be solar (m²)?", answer: 60, explanation: "200 × 0.30 = 60 m²" },
  { question: "Forest biome allows only 60% land development. Plot = 1,200 m². Maximum buildable area (m²)?", answer: 720, explanation: "1,200 × 0.60 = 720 m²" },
  { question: "Desert: 40% solar. Building 150 m². Solar roof required (m²)?", answer: 60, explanation: "150 × 0.40 = 60 m²" },
  { question: "Forest: 50% developable. 800 m² plot. Max buildable (m²)?", answer: 400, explanation: "800 × 0.50 = 400 m²" },
  { question: "Coastal: 20% flood buffer. 1,000 m². Buffer area (m²)?", answer: 200, explanation: "1,000 × 0.20 = 200 m²" },
  { question: "Desert: 25% solar. Footprint 300 m². Solar (m²)?", answer: 75, explanation: "300 × 0.25 = 75 m²" },
  { question: "Forest: 70% developable. 500 m² plot. Max buildable (m²)?", answer: 350, explanation: "500 × 0.70 = 350 m²" },
  { question: "35% solar coverage. Building 200 m². Solar roof (m²)?", answer: 70, explanation: "200 × 0.35 = 70 m²" },
  { question: "Plot 1,200 m². Only 60% buildable. Max buildable (m²)?", answer: 720, explanation: "1,200 × 0.60 = 720 m²" },
  { question: "Desert: 20% solar. 250 m² building. Solar (m²)?", answer: 50, explanation: "250 × 0.20 = 50 m²" },
  { question: "Forest: 45% development limit. 900 m². Buildable (m²)?", answer: 405, explanation: "900 × 0.45 = 405 m²" },
  { question: "Coastal: 15% flood buffer. 600 m². Buffer (m²)?", answer: 90, explanation: "600 × 0.15 = 90 m²" },
  { question: "Desert: 50% solar. 120 m² footprint. Solar (m²)?", answer: 60, explanation: "120 × 0.50 = 60 m²" },
  { question: "Forest: 55% developable. 1,000 m². Max buildable (m²)?", answer: 550, explanation: "1,000 × 0.55 = 550 m²" },
  { question: "Building 400 m². 25% must be solar. Solar (m²)?", answer: 100, explanation: "400 × 0.25 = 100 m²" },
  { question: "Plot 2,000 m². 40% buildable. Buildable (m²)?", answer: 800, explanation: "2,000 × 0.40 = 800 m²" },
  { question: "Desert: 35% solar. 180 m² building. Solar (m²)?", answer: 63, explanation: "180 × 0.35 = 63 m²" },
  { question: "Forest: 65% development. 600 m². Buildable (m²)?", answer: 390, explanation: "600 × 0.65 = 390 m²" },
  { question: "Coastal: 25% buffer. 800 m². Buffer (m²)?", answer: 200, explanation: "800 × 0.25 = 200 m²" },
  { question: "Plot 1,500 m². 50% buildable. Max buildable (m²)?", answer: 750, explanation: "1,500 × 0.50 = 750 m²" }
];

const extremeQuestions: TownPlannerQuestion[] = [
  { question: "Town allocates: 50% residential, 20% commercial, 15% roads, 15% green. Total land = 5,000 m². Residential (m²)?", answer: 2500, explanation: "5,000 × 0.50 = 2,500 m²" },
  { question: "Road cost = R500 per metre. Planner designs 120 m of road. Total cost (R)?", answer: 60000, explanation: "500 × 120 = R60,000" },
  { question: "Total 5,000 m². 50% residential, 20% commercial, 15% roads, 15% green. Commercial (m²)?", answer: 1000, explanation: "5,000 × 0.20 = 1,000 m²" },
  { question: "Road R400 per m. 80 m designed. Total cost (R)?", answer: 32000, explanation: "400 × 80 = R32,000" },
  { question: "Total 4,000 m²: 40% residential, 30% commercial, 20% roads, 10% green. Roads (m²)?", answer: 800, explanation: "4,000 × 0.20 = 800 m²" },
  { question: "Road R600 per m. 50 m. Total cost (R)?", answer: 30000, explanation: "600 × 50 = R30,000" },
  { question: "Land 6,000 m²: 45% residential, 25% commercial, 20% roads, 10% green. Green (m²)?", answer: 600, explanation: "6,000 × 0.10 = 600 m²" },
  { question: "Road R350 per m. 100 m. Total (R)?", answer: 35000, explanation: "350 × 100 = R35,000" },
  { question: "Total 3,000 m²: 50% res, 25% com, 15% roads, 10% green. Commercial (m²)?", answer: 750, explanation: "3,000 × 0.25 = 750 m²" },
  { question: "Road R450 per m. 90 m. Total cost (R)?", answer: 40500, explanation: "450 × 90 = R40,500" },
  { question: "Land 8,000 m²: 40% res, 30% com, 20% roads, 10% green. Residential (m²)?", answer: 3200, explanation: "8,000 × 0.40 = 3,200 m²" },
  { question: "Road R550 per m. 60 m. Total (R)?", answer: 33000, explanation: "550 × 60 = R33,000" },
  { question: "Total 5,500 m²: 45% res, 20% com, 25% roads, 10% green. Roads (m²)?", answer: 1375, explanation: "5,500 × 0.25 = 1,375 m²" },
  { question: "Road R480 per m. 75 m. Total cost (R)?", answer: 36000, explanation: "480 × 75 = R36,000" },
  { question: "Land 7,000 m²: 35% res, 35% com, 20% roads, 10% green. Commercial (m²)?", answer: 2450, explanation: "7,000 × 0.35 = 2,450 m²" },
  { question: "Road R520 per m. 110 m. Total (R)?", answer: 57200, explanation: "520 × 110 = R57,200" },
  { question: "Total 4,500 m²: 50% res, 20% com, 20% roads, 10% green. Green (m²)?", answer: 450, explanation: "4,500 × 0.10 = 450 m²" },
  { question: "Road R380 per m. 95 m. Total cost (R)?", answer: 36100, explanation: "380 × 95 = R36,100" },
  { question: "Land 9,000 m²: 40% res, 25% com, 25% roads, 10% green. Residential (m²)?", answer: 3600, explanation: "9,000 × 0.40 = 3,600 m²" },
  { question: "Road R420 per m. 85 m. Total (R)?", answer: 35700, explanation: "420 × 85 = R35,700" }
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
