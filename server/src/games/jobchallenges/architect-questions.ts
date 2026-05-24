// Architect Math Game - Question Bank
// 20 questions per difficulty tier. All numeric answers.

export interface ArchitectQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY: Room Planning (Area & Perimeter)
export const easyQuestions: ArchitectQuestion[] = [
  {
    question: "A classroom is 9 m × 6 m. What is the area in square meters?",
    answer: 54,
    explanation: "Area = 9 × 6 = 54 m²"
  },
  {
    question: "A fence surrounds a 7 m × 4 m vegetable patch. What is the perimeter in meters?",
    answer: 22,
    explanation: "Perimeter = 2 × (7 + 4) = 22 m"
  },
  {
    question: "A rectangular studio is 11 m long and 7 m wide. What is the area?",
    answer: 77,
    explanation: "Area = 11 × 7 = 77 m²"
  },
  {
    question: "A square lobby has sides of 9 m each. What is the perimeter?",
    answer: 36,
    explanation: "Perimeter = 4 × 9 = 36 m"
  },
  {
    question: "A rectangular plot is 14 m × 8 m. What is the area?",
    answer: 112,
    explanation: "Area = 14 × 8 = 112 m²"
  },
  {
    question: "A room measures 13 m by 5 m. What is the perimeter?",
    answer: 36,
    explanation: "Perimeter = 2 × (13 + 5) = 36 m"
  },
  {
    question: "A square courtyard has an area of 81 m². What is the length of one side?",
    answer: 9,
    explanation: "Side = √81 = 9 m"
  },
  {
    question: "A rectangular hall is 19 m long and 7 m wide. What is the area?",
    answer: 133,
    explanation: "Area = 19 × 7 = 133 m²"
  },
  {
    question: "A square room has a perimeter of 44 m. What is the length of one side?",
    answer: 11,
    explanation: "Side = 44 ÷ 4 = 11 m"
  },
  {
    question: "A rectangular garden is 15 m × 6 m. What is the area?",
    answer: 90,
    explanation: "Area = 15 × 6 = 90 m²"
  },
  {
    question: "A room is 10 m long and 6 m wide. What is the perimeter?",
    answer: 32,
    explanation: "Perimeter = 2 × (10 + 6) = 32 m"
  },
  {
    question: "A square office has sides of 8 m. What is the area?",
    answer: 64,
    explanation: "Area = 8 × 8 = 64 m²"
  },
  {
    question: "A rectangular space is 17 m × 6 m. What is the area?",
    answer: 102,
    explanation: "Area = 17 × 6 = 102 m²"
  },
  {
    question: "A square room has an area of 100 m². What is the perimeter?",
    answer: 40,
    explanation: "Side = 10 m, Perimeter = 4 × 10 = 40 m"
  },
  {
    question: "A rectangular plot is 16 m × 9 m. What is the perimeter?",
    answer: 50,
    explanation: "Perimeter = 2 × (16 + 9) = 50 m"
  },
  {
    question: "A room measures 8 m by 7 m. What is the area?",
    answer: 56,
    explanation: "Area = 8 × 7 = 56 m²"
  },
  {
    question: "A square courtyard has a perimeter of 48 m. What is the area?",
    answer: 144,
    explanation: "Side = 12 m, Area = 12 × 12 = 144 m²"
  },
  {
    question: "A rectangular hall is 18 m long and 11 m wide. What is the area?",
    answer: 198,
    explanation: "Area = 18 × 11 = 198 m²"
  },
  {
    question: "A room is 15 m long and 4 m wide. What is the perimeter?",
    answer: 38,
    explanation: "Perimeter = 2 × (15 + 4) = 38 m"
  },
  {
    question: "A square office has an area of 121 m². What is the length of one side?",
    answer: 11,
    explanation: "Side = √121 = 11 m"
  }
];

// MEDIUM: Scale & Costing (Scale Drawings + Cost per Unit)
export const mediumQuestions: ArchitectQuestion[] = [
  {
    question: "Scale: 1 cm = 2.5 m. Draw 12.5 m length → how many cm?",
    answer: 5,
    explanation: "12.5 ÷ 2.5 = 5 cm"
  },
  {
    question: "Flooring costs R280 per m². Floor area = 52 m². Total cost?",
    answer: 14560,
    explanation: "52 × 280 = R14,560"
  },
  {
    question: "Scale: 1 cm = 4 m. Draw 24 m length → how many cm?",
    answer: 6,
    explanation: "24 ÷ 4 = 6 cm"
  },
  {
    question: "Paint costs R195 per m². Wall area = 38 m². Total cost?",
    answer: 7410,
    explanation: "38 × 195 = R7,410"
  },
  {
    question: "Scale: 1 cm = 3 m. Draw 18 m length → how many cm?",
    answer: 6,
    explanation: "18 ÷ 3 = 6 cm"
  },
  {
    question: "Tiles cost R275 per m². Floor area = 44 m². Total cost?",
    answer: 12100,
    explanation: "44 × 275 = R12,100"
  },
  {
    question: "Scale: 1 cm = 5 m. Draw 30 m length → how many cm?",
    answer: 6,
    explanation: "30 ÷ 5 = 6 cm"
  },
  {
    question: "Carpet costs R420 per m². Floor area = 33 m². Total cost?",
    answer: 13860,
    explanation: "33 × 420 = R13,860"
  },
  {
    question: "Scale: 1 cm = 2 m. Draw 16 m length → how many cm?",
    answer: 8,
    explanation: "16 ÷ 2 = 8 cm"
  },
  {
    question: "Windows cost R920 per m². Window area = 14 m². Total cost?",
    answer: 12880,
    explanation: "14 × 920 = R12,880"
  },
  {
    question: "Scale: 1 cm = 2.5 m. Draw 22.5 m length → how many cm?",
    answer: 9,
    explanation: "22.5 ÷ 2.5 = 9 cm"
  },
  {
    question: "Roofing costs R365 per m². Roof area = 48 m². Total cost?",
    answer: 17520,
    explanation: "48 × 365 = R17,520"
  },
  {
    question: "Scale: 1 cm = 6 m. Draw 36 m length → how many cm?",
    answer: 6,
    explanation: "36 ÷ 6 = 6 cm"
  },
  {
    question: "Insulation costs R240 per m². Wall area = 62 m². Total cost?",
    answer: 14880,
    explanation: "62 × 240 = R14,880"
  },
  {
    question: "Scale: 1 cm = 3.5 m. Draw 28 m length → how many cm?",
    answer: 8,
    explanation: "28 ÷ 3.5 = 8 cm"
  },
  {
    question: "Doors cost R1,050 per m². Door area = 11 m². Total cost?",
    answer: 11550,
    explanation: "11 × 1050 = R11,550"
  },
  {
    question: "Scale: 1 cm = 4 m. Draw 28 m length → how many cm?",
    answer: 7,
    explanation: "28 ÷ 4 = 7 cm"
  },
  {
    question: "Plaster costs R110 per m². Wall area = 58 m². Total cost?",
    answer: 6380,
    explanation: "58 × 110 = R6,380"
  },
  {
    question: "Scale: 1 cm = 1.5 m. Draw 12 m length → how many cm?",
    answer: 8,
    explanation: "12 ÷ 1.5 = 8 cm"
  },
  {
    question: "Electrical work costs R165 per m². Floor area = 46 m². Total cost?",
    answer: 7590,
    explanation: "46 × 165 = R7,590"
  }
];

// HARD: Budget-Constrained Design (Multi-step Constraints)
export const hardQuestions: ArchitectQuestion[] = [
  {
    question: "Budget: R125,000. Floor area ≥90 m². Perimeter ≤52 m. If length=11 m, what is max width?",
    answer: 15,
    explanation: "2(11+w) ≤ 52 → w ≤ 15 m. Area = 165 m² ≥ 90 ✓"
  },
  {
    question: "Budget: R92,000. Floor area ≥75 m². Perimeter ≤42 m. If length=13 m, max width?",
    answer: 8,
    explanation: "2(13+w) ≤ 42 → w ≤ 8 m. Area = 104 m² ≥ 75 ✓"
  },
  {
    question: "Budget: R145,000. Roof area ≥110 m². Perimeter ≤58 m. If length=16 m, max width?",
    answer: 13,
    explanation: "2(16+w) ≤ 58 → w ≤ 13 m. Area = 208 m² ≥ 110 ✓"
  },
  {
    question: "Budget: R98,000. Floor area ≥60 m². Perimeter ≤47 m. If length=12 m, max width?",
    answer: 11.5,
    explanation: "2(12+w) ≤ 47 → w ≤ 11.5 m. Area = 138 m² ≥ 60 ✓"
  },
  {
    question: "Budget: R210,000. Wall area ≥140 m². Perimeter ≤74 m. If length=22 m, max width?",
    answer: 15,
    explanation: "2(22+w) ≤ 74 → w ≤ 15 m. Area = 330 m² ≥ 140 ✓"
  },
  {
    question: "Budget: R118,000. Floor area ≥85 m². Perimeter ≤54 m. If length=15 m, max width?",
    answer: 12,
    explanation: "2(15+w) ≤ 54 → w ≤ 12 m. Area = 180 m² ≥ 85 ✓"
  },
  {
    question: "Budget: R132,000. Window area ≥55 m². Perimeter ≤56 m. If length=17 m, max width?",
    answer: 11,
    explanation: "2(17+w) ≤ 56 → w ≤ 11 m. Area = 187 m² ≥ 55 ✓"
  },
  {
    question: "Budget: R87,000. Floor area ≥52 m². Perimeter ≤41 m. If length=9 m, max width?",
    answer: 11.5,
    explanation: "2(9+w) ≤ 41 → w ≤ 11.5 m. Area = 103.5 m² ≥ 52 ✓"
  },
  {
    question: "Budget: R168,000. Roof area ≥120 m². Perimeter ≤64 m. If length=19 m, max width?",
    answer: 13,
    explanation: "2(19+w) ≤ 64 → w ≤ 13 m. Area = 247 m² ≥ 120 ✓"
  },
  {
    question: "Budget: R102,000. Floor area ≥70 m². Perimeter ≤48 m. If length=11 m, max width?",
    answer: 13,
    explanation: "2(11+w) ≤ 48 → w ≤ 13 m. Area = 143 m² ≥ 70 ✓"
  },
  {
    question: "Budget: R148,000. Floor area ≥100 m². Perimeter ≤60 m. If length=18 m, max width?",
    answer: 12,
    explanation: "2(18+w) ≤ 60 → w ≤ 12 m. Area = 216 m² ≥ 100 ✓"
  },
  {
    question: "Budget: R94,000. Floor area ≥58 m². Perimeter ≤44 m. If length=10 m, max width?",
    answer: 12,
    explanation: "2(10+w) ≤ 44 → w ≤ 12 m. Area = 120 m² ≥ 58 ✓"
  },
  {
    question: "Budget: R175,000. Roof area ≥130 m². Perimeter ≤66 m. If length=20 m, max width?",
    answer: 13,
    explanation: "2(20+w) ≤ 66 → w ≤ 13 m. Area = 260 m² ≥ 130 ✓"
  },
  {
    question: "Budget: R109,000. Floor area ≥72 m². Perimeter ≤50 m. If length=14 m, max width?",
    answer: 11,
    explanation: "2(14+w) ≤ 50 → w ≤ 11 m. Area = 154 m² ≥ 72 ✓"
  },
  {
    question: "Budget: R138,000. Wall area ≥95 m². Perimeter ≤57 m. If length=16 m, max width?",
    answer: 12.5,
    explanation: "2(16+w) ≤ 57 → w ≤ 12.5 m. Area = 200 m² ≥ 95 ✓"
  },
  {
    question: "Budget: R91,000. Floor area ≥54 m². Perimeter ≤43 m. If length=12 m, max width?",
    answer: 9.5,
    explanation: "2(12+w) ≤ 43 → w ≤ 9.5 m. Area = 114 m² ≥ 54 ✓"
  },
  {
    question: "Budget: R192,000. Floor area ≥150 m². Perimeter ≤70 m. If length=21 m, max width?",
    answer: 14,
    explanation: "2(21+w) ≤ 70 → w ≤ 14 m. Area = 294 m² ≥ 150 ✓"
  },
  {
    question: "Budget: R86,000. Floor area ≥50 m². Perimeter ≤42 m. If length=8 m, max width?",
    answer: 13,
    explanation: "2(8+w) ≤ 42 → w ≤ 13 m. Area = 104 m² ≥ 50 ✓"
  },
  {
    question: "Budget: R158,000. Roof area ≥115 m². Perimeter ≤62 m. If length=17 m, max width?",
    answer: 14,
    explanation: "2(17+w) ≤ 62 → w ≤ 14 m. Area = 238 m² ≥ 115 ✓"
  },
  {
    question: "Budget: R113,000. Floor area ≥78 m². Perimeter ≤52 m. If length=13 m, max width?",
    answer: 13,
    explanation: "2(13+w) ≤ 52 → w ≤ 13 m. Area = 169 m² ≥ 78 ✓"
  }
];

// EXTREME: Optimization & Structural Reasoning
export const extremeQuestions: ArchitectQuestion[] = [
  {
    question: "Beam supports 450 kg. Roof load = 3,600 kg. Minimum safety margin = 20%. How many beams required?",
    answer: 10,
    explanation: "Required = 3600 × 1.2 = 4320 kg. Beams = 4320 ÷ 450 = 9.6 → 10"
  },
  {
    question: "Column holds 480 kg. Building load = 4,320 kg. Safety factor = 25%. How many columns?",
    answer: 12,
    explanation: "Required = 4320 × 1.25 = 5400 kg. Columns = 5400 ÷ 480 = 11.25 → 12"
  },
  {
    question: "Foundation supports 550 kg/m². Total building weight = 16,500 kg. Floor area = 22 m². Safety margin = 20%. Is foundation adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load/m² = 750. Required = 900 kg/m². 550 < 900 → NO (0)"
  },
  {
    question: "Steel beam: 380 kg capacity. Total load = 3,040 kg. Safety factor = 30%. How many beams?",
    answer: 11,
    explanation: "Required = 3040 × 1.3 = 3952 kg. Beams = 3952 ÷ 380 = 10.4 → 11"
  },
  {
    question: "Concrete slab: 520 kg/m² capacity. Building weight = 11,440 kg. Area = 19 m². Safety margin = 15%. Is slab adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load/m² ≈ 602. Required ≈ 692 kg/m². 520 < 692 → NO (0)"
  },
  {
    question: "Truss supports 620 kg. Roof weight = 4,960 kg. Safety factor = 25%. How many trusses?",
    answer: 10,
    explanation: "Required = 4960 × 1.25 = 6200 kg. Trusses = 6200 ÷ 620 = 10"
  },
  {
    question: "Wall supports 340 kg/m. Total wall load = 2,720 kg. Wall length = 10 m. Safety margin = 20%. Is wall adequate? (1=yes, 0=no)",
    answer: 1,
    explanation: "Load/m = 272. Required = 326.4 kg/m. 340 ≥ 326.4 → YES (1)"
  },
  {
    question: "Foundation: 680 kg capacity. Building = 5,440 kg. Safety factor = 30%. How many foundations?",
    answer: 11,
    explanation: "Required = 5440 × 1.3 = 7072 kg. Foundations = 7072 ÷ 680 = 10.4 → 11"
  },
  {
    question: "Beam: 500 kg capacity. Load = 4,500 kg. Safety margin = 25%. How many beams?",
    answer: 12,
    explanation: "Required = 4500 × 1.25 = 5625 kg. Beams = 5625 ÷ 500 = 11.25 → 12"
  },
  {
    question: "Column: 540 kg capacity. Building = 4,860 kg. Safety factor = 20%. How many columns?",
    answer: 11,
    explanation: "Required = 4860 × 1.2 = 5832 kg. Columns = 5832 ÷ 540 = 10.8 → 11"
  },
  {
    question: "Slab: 410 kg/m² capacity. Weight = 9,020 kg. Area = 20 m². Safety margin = 25%. Is slab adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load/m² = 451. Required = 563.75 kg/m². 410 < 563.75 → NO (0)"
  },
  {
    question: "Truss: 580 kg capacity. Roof = 5,220 kg. Safety factor = 30%. How many trusses?",
    answer: 12,
    explanation: "Required = 5220 × 1.3 = 6786 kg. Trusses = 6786 ÷ 580 = 11.7 → 12"
  },
  {
    question: "Foundation: 720 kg capacity. Building = 5,760 kg. Safety margin = 25%. How many foundations?",
    answer: 10,
    explanation: "Required = 5760 × 1.25 = 7200 kg. Foundations = 7200 ÷ 720 = 10"
  },
  {
    question: "Beam: 440 kg capacity. Load = 3,960 kg. Safety factor = 20%. How many beams?",
    answer: 11,
    explanation: "Required = 3960 × 1.2 = 4752 kg. Beams = 4752 ÷ 440 = 10.8 → 11"
  },
  {
    question: "Column: 600 kg capacity. Building = 5,400 kg. Safety margin = 25%. How many columns?",
    answer: 12,
    explanation: "Required = 5400 × 1.25 = 6750 kg. Columns = 6750 ÷ 600 = 11.25 → 12"
  },
  {
    question: "Wall: 360 kg/m capacity. Load = 3,240 kg. Length = 9 m. Safety margin = 20%. Is wall adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load/m = 360. Required = 432 kg/m. 360 < 432 → NO (0)"
  },
  {
    question: "Truss: 640 kg capacity. Roof = 5,760 kg. Safety factor = 25%. How many trusses?",
    answer: 12,
    explanation: "Required = 5760 × 1.25 = 7200 kg. Trusses = 7200 ÷ 640 = 11.25 → 12"
  },
  {
    question: "Foundation: 780 kg capacity. Building = 6,240 kg. Safety margin = 30%. How many foundations?",
    answer: 11,
    explanation: "Required = 6240 × 1.3 = 8112 kg. Foundations = 8112 ÷ 780 = 10.4 → 11"
  },
  {
    question: "Beam: 470 kg capacity. Load = 4,230 kg. Safety factor = 20%. How many beams?",
    answer: 11,
    explanation: "Required = 4230 × 1.2 = 5076 kg. Beams = 5076 ÷ 470 = 10.8 → 11"
  },
  {
    question: "Slab: 480 kg/m² capacity. Weight = 11,520 kg. Area = 22 m². Safety margin = 20%. Is slab adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load/m² ≈ 524. Required ≈ 628.8 kg/m². 480 < 628.8 → NO (0)"
  }
];

export function getArchitectQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): ArchitectQuestion {
  let questions: ArchitectQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
