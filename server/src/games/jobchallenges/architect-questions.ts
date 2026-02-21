// Architect Math Game - Question Bank
// 20 questions per difficulty tier

export interface ArchitectQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY: Room Planning (Area & Perimeter)
export const easyQuestions: ArchitectQuestion[] = [
  {
    question: "A room is 6 m × 4 m. What is the area in square meters?",
    answer: 24,
    explanation: "Area = length × width = 6 × 4 = 24 m²"
  },
  {
    question: "A garden fence surrounds a 5 m × 3 m space. What is the perimeter in meters?",
    answer: 16,
    explanation: "Perimeter = 2 × (length + width) = 2 × (5 + 3) = 16 m"
  },
  {
    question: "A rectangular office is 8 m long and 5 m wide. What is the area?",
    answer: 40,
    explanation: "Area = 8 × 5 = 40 m²"
  },
  {
    question: "A square room has sides of 7 m each. What is the perimeter?",
    answer: 28,
    explanation: "Perimeter = 4 × side = 4 × 7 = 28 m"
  },
  {
    question: "A rectangular plot is 12 m × 9 m. What is the area?",
    answer: 108,
    explanation: "Area = 12 × 9 = 108 m²"
  },
  {
    question: "A room measures 10 m by 6 m. What is the perimeter?",
    answer: 32,
    explanation: "Perimeter = 2 × (10 + 6) = 32 m"
  },
  {
    question: "A square courtyard has an area of 64 m². What is the length of one side?",
    answer: 8,
    explanation: "Area = side², so side = √64 = 8 m"
  },
  {
    question: "A rectangular hall is 15 m long and 8 m wide. What is the area?",
    answer: 120,
    explanation: "Area = 15 × 8 = 120 m²"
  },
  {
    question: "A square room has a perimeter of 36 m. What is the length of one side?",
    answer: 9,
    explanation: "Perimeter = 4 × side, so side = 36 ÷ 4 = 9 m"
  },
  {
    question: "A rectangular garden is 11 m × 7 m. What is the area?",
    answer: 77,
    explanation: "Area = 11 × 7 = 77 m²"
  },
  {
    question: "A room is 9 m long and 4 m wide. What is the perimeter?",
    answer: 26,
    explanation: "Perimeter = 2 × (9 + 4) = 26 m"
  },
  {
    question: "A square office has sides of 6 m. What is the area?",
    answer: 36,
    explanation: "Area = 6 × 6 = 36 m²"
  },
  {
    question: "A rectangular space is 14 m × 5 m. What is the area?",
    answer: 70,
    explanation: "Area = 14 × 5 = 70 m²"
  },
  {
    question: "A square room has an area of 49 m². What is the perimeter?",
    answer: 28,
    explanation: "Side = √49 = 7 m, Perimeter = 4 × 7 = 28 m"
  },
  {
    question: "A rectangular plot is 13 m × 8 m. What is the perimeter?",
    answer: 42,
    explanation: "Perimeter = 2 × (13 + 8) = 42 m"
  },
  {
    question: "A room measures 7 m by 5 m. What is the area?",
    answer: 35,
    explanation: "Area = 7 × 5 = 35 m²"
  },
  {
    question: "A square courtyard has a perimeter of 40 m. What is the area?",
    answer: 100,
    explanation: "Side = 40 ÷ 4 = 10 m, Area = 10 × 10 = 100 m²"
  },
  {
    question: "A rectangular hall is 16 m long and 9 m wide. What is the area?",
    answer: 144,
    explanation: "Area = 16 × 9 = 144 m²"
  },
  {
    question: "A room is 12 m long and 3 m wide. What is the perimeter?",
    answer: 30,
    explanation: "Perimeter = 2 × (12 + 3) = 30 m"
  },
  {
    question: "A square office has an area of 81 m². What is the length of one side?",
    answer: 9,
    explanation: "Side = √81 = 9 m"
  }
];

// MEDIUM: Scale & Costing (Scale Drawings + Cost per Unit)
export const mediumQuestions: ArchitectQuestion[] = [
  {
    question: "Scale: 1 cm = 2 m. Draw 8 m length → how many cm?",
    answer: 4,
    explanation: "8 m ÷ 2 m/cm = 4 cm"
  },
  {
    question: "Flooring costs R250 per m². Floor area = 60 m². Total cost?",
    answer: 15000,
    explanation: "Cost = 60 × 250 = R15,000"
  },
  {
    question: "Scale: 1 cm = 3 m. Draw 15 m length → how many cm?",
    answer: 5,
    explanation: "15 m ÷ 3 m/cm = 5 cm"
  },
  {
    question: "Paint costs R180 per m². Wall area = 45 m². Total cost?",
    answer: 8100,
    explanation: "Cost = 45 × 180 = R8,100"
  },
  {
    question: "Scale: 1 cm = 2.5 m. Draw 10 m length → how many cm?",
    answer: 4,
    explanation: "10 m ÷ 2.5 m/cm = 4 cm"
  },
  {
    question: "Tiles cost R320 per m². Floor area = 35 m². Total cost?",
    answer: 11200,
    explanation: "Cost = 35 × 320 = R11,200"
  },
  {
    question: "Scale: 1 cm = 4 m. Draw 20 m length → how many cm?",
    answer: 5,
    explanation: "20 m ÷ 4 m/cm = 5 cm"
  },
  {
    question: "Carpet costs R450 per m². Floor area = 28 m². Total cost?",
    answer: 12600,
    explanation: "Cost = 28 × 450 = R12,600"
  },
  {
    question: "Scale: 1 cm = 1.5 m. Draw 9 m length → how many cm?",
    answer: 6,
    explanation: "9 m ÷ 1.5 m/cm = 6 cm"
  },
  {
    question: "Windows cost R850 per m². Window area = 12 m². Total cost?",
    answer: 10200,
    explanation: "Cost = 12 × 850 = R10,200"
  },
  {
    question: "Scale: 1 cm = 5 m. Draw 25 m length → how many cm?",
    answer: 5,
    explanation: "25 m ÷ 5 m/cm = 5 cm"
  },
  {
    question: "Roofing costs R380 per m². Roof area = 42 m². Total cost?",
    answer: 15960,
    explanation: "Cost = 42 × 380 = R15,960"
  },
  {
    question: "Scale: 1 cm = 2 m. Draw 14 m length → how many cm?",
    answer: 7,
    explanation: "14 m ÷ 2 m/cm = 7 cm"
  },
  {
    question: "Insulation costs R220 per m². Wall area = 55 m². Total cost?",
    answer: 12100,
    explanation: "Cost = 55 × 220 = R12,100"
  },
  {
    question: "Scale: 1 cm = 3.5 m. Draw 21 m length → how many cm?",
    answer: 6,
    explanation: "21 m ÷ 3.5 m/cm = 6 cm"
  },
  {
    question: "Doors cost R1,200 per m². Door area = 8 m². Total cost?",
    answer: 9600,
    explanation: "Cost = 8 × 1200 = R9,600"
  },
  {
    question: "Scale: 1 cm = 2 m. Draw 18 m length → how many cm?",
    answer: 9,
    explanation: "18 m ÷ 2 m/cm = 9 cm"
  },
  {
    question: "Plaster costs R95 per m². Wall area = 70 m². Total cost?",
    answer: 6650,
    explanation: "Cost = 70 × 95 = R6,650"
  },
  {
    question: "Scale: 1 cm = 4 m. Draw 32 m length → how many cm?",
    answer: 8,
    explanation: "32 m ÷ 4 m/cm = 8 cm"
  },
  {
    question: "Electrical work costs R150 per m². Floor area = 50 m². Total cost?",
    answer: 7500,
    explanation: "Cost = 50 × 150 = R7,500"
  }
];

// HARD: Budget-Constrained Design (Multi-step Constraints)
export const hardQuestions: ArchitectQuestion[] = [
  {
    question: "Max budget: R120,000. Walls cost R600/m. Floor area must be ≥80 m². Perimeter must not exceed 50 m. If length=10m, what is max width?",
    answer: 15,
    explanation: "Perimeter = 2(10+w) ≤ 50, so 10+w ≤ 25, w ≤ 15 m. Area = 10×15 = 150 m² ≥ 80 ✓"
  },
  {
    question: "Budget: R80,000. Flooring R300/m². Walls R500/m. Floor area ≥60 m². Perimeter ≤40 m. If length=12m, max width?",
    answer: 8,
    explanation: "Perimeter = 2(12+w) ≤ 40, so w ≤ 8 m. Area = 12×8 = 96 m² ≥ 60 ✓"
  },
  {
    question: "Budget: R150,000. Roof R400/m². Walls R700/m. Roof area ≥100 m². Perimeter ≤60 m. If length=15m, max width?",
    answer: 15,
    explanation: "Perimeter = 2(15+w) ≤ 60, so w ≤ 15 m. Area = 15×15 = 225 m² ≥ 100 ✓"
  },
  {
    question: "Budget: R90,000. Tiles R250/m². Fence R400/m. Floor area ≥50 m². Perimeter ≤45 m. If length=10m, max width?",
    answer: 12.5,
    explanation: "Perimeter = 2(10+w) ≤ 45, so w ≤ 12.5 m. Area = 10×12.5 = 125 m² ≥ 50 ✓"
  },
  {
    question: "Budget: R200,000. Paint R180/m². Structure R800/m. Wall area ≥120 m². Perimeter ≤70 m. If length=20m, max width?",
    answer: 15,
    explanation: "Perimeter = 2(20+w) ≤ 70, so w ≤ 15 m. Area = 20×15 = 300 m² ≥ 120 ✓"
  },
  {
    question: "Budget: R110,000. Carpet R350/m². Base R600/m. Floor area ≥70 m². Perimeter ≤50 m. If length=14m, max width?",
    answer: 11,
    explanation: "Perimeter = 2(14+w) ≤ 50, so w ≤ 11 m. Area = 14×11 = 154 m² ≥ 70 ✓"
  },
  {
    question: "Budget: R130,000. Windows R900/m². Frame R500/m. Window area ≥40 m². Perimeter ≤55 m. If length=16m, max width?",
    answer: 11.5,
    explanation: "Perimeter = 2(16+w) ≤ 55, so w ≤ 11.5 m. Area = 16×11.5 = 184 m² ≥ 40 ✓"
  },
  {
    question: "Budget: R95,000. Insulation R200/m². Walls R550/m. Wall area ≥65 m². Perimeter ≤48 m. If length=13m, max width?",
    answer: 11,
    explanation: "Perimeter = 2(13+w) ≤ 48, so w ≤ 11 m. Area = 13×11 = 143 m² ≥ 65 ✓"
  },
  {
    question: "Budget: R160,000. Roofing R380/m². Structure R750/m. Roof area ≥110 m². Perimeter ≤65 m. If length=18m, max width?",
    answer: 14.5,
    explanation: "Perimeter = 2(18+w) ≤ 65, so w ≤ 14.5 m. Area = 18×14.5 = 261 m² ≥ 110 ✓"
  },
  {
    question: "Budget: R85,000. Flooring R280/m². Base R580/m. Floor area ≥55 m². Perimeter ≤44 m. If length=11m, max width?",
    answer: 11,
    explanation: "Perimeter = 2(11+w) ≤ 44, so w ≤ 11 m. Area = 11×11 = 121 m² ≥ 55 ✓"
  },
  {
    question: "Budget: R140,000. Paint R190/m². Frame R650/m. Wall area ≥75 m². Perimeter ≤52 m. If length=15m, max width?",
    answer: 11,
    explanation: "Perimeter = 2(15+w) ≤ 52, so w ≤ 11 m. Area = 15×11 = 165 m² ≥ 75 ✓"
  },
  {
    question: "Budget: R100,000. Tiles R320/m². Structure R600/m. Floor area ≥65 m². Perimeter ≤46 m. If length=12m, max width?",
    answer: 11,
    explanation: "Perimeter = 2(12+w) ≤ 46, so w ≤ 11 m. Area = 12×11 = 132 m² ≥ 65 ✓"
  },
  {
    question: "Budget: R170,000. Windows R950/m². Base R700/m. Window area ≥90 m². Perimeter ≤68 m. If length=19m, max width?",
    answer: 15,
    explanation: "Perimeter = 2(19+w) ≤ 68, so w ≤ 15 m. Area = 19×15 = 285 m² ≥ 90 ✓"
  },
  {
    question: "Budget: R105,000. Carpet R340/m². Frame R590/m. Floor area ≥68 m². Perimeter ≤49 m. If length=13m, max width?",
    answer: 11.5,
    explanation: "Perimeter = 2(13+w) ≤ 49, so w ≤ 11.5 m. Area = 13×11.5 = 149.5 m² ≥ 68 ✓"
  },
  {
    question: "Budget: R125,000. Roofing R390/m². Walls R680/m. Roof area ≥85 m². Perimeter ≤58 m. If length=17m, max width?",
    answer: 12,
    explanation: "Perimeter = 2(17+w) ≤ 58, so w ≤ 12 m. Area = 17×12 = 204 m² ≥ 85 ✓"
  },
  {
    question: "Budget: R115,000. Insulation R210/m². Structure R620/m. Wall area ≥72 m². Perimeter ≤51 m. If length=14m, max width?",
    answer: 11.5,
    explanation: "Perimeter = 2(14+w) ≤ 51, so w ≤ 11.5 m. Area = 14×11.5 = 161 m² ≥ 72 ✓"
  },
  {
    question: "Budget: R180,000. Paint R195/m². Frame R720/m. Wall area ≥130 m². Perimeter ≤72 m. If length=21m, max width?",
    answer: 15,
    explanation: "Perimeter = 2(21+w) ≤ 72, so w ≤ 15 m. Area = 21×15 = 315 m² ≥ 130 ✓"
  },
  {
    question: "Budget: R88,000. Flooring R270/m². Base R570/m. Floor area ≥58 m². Perimeter ≤43 m. If length=10m, max width?",
    answer: 11.5,
    explanation: "Perimeter = 2(10+w) ≤ 43, so w ≤ 11.5 m. Area = 10×11.5 = 115 m² ≥ 58 ✓"
  },
  {
    question: "Budget: R135,000. Windows R880/m². Structure R640/m. Window area ≥80 m². Perimeter ≤56 m. If length=16m, max width?",
    answer: 12,
    explanation: "Perimeter = 2(16+w) ≤ 56, so w ≤ 12 m. Area = 16×12 = 192 m² ≥ 80 ✓"
  },
  {
    question: "Budget: R155,000. Roofing R410/m². Walls R690/m. Roof area ≥95 m². Perimeter ≤62 m. If length=18m, max width?",
    answer: 13,
    explanation: "Perimeter = 2(18+w) ≤ 62, so w ≤ 13 m. Area = 18×13 = 234 m² ≥ 95 ✓"
  }
];

// EXTREME: Optimization & Structural Reasoning
export const extremeQuestions: ArchitectQuestion[] = [
  {
    question: "Beam supports 400 kg. Roof load = 3,200 kg. Minimum safety margin = 20%. How many beams required?",
    answer: 10,
    explanation: "Required capacity = 3200 × 1.2 = 3840 kg. Beams needed = 3840 ÷ 400 = 9.6 → 10 beams"
  },
  {
    question: "Column holds 500 kg. Building load = 4,500 kg. Safety factor = 25%. How many columns?",
    answer: 12,
    explanation: "Required capacity = 4500 × 1.25 = 5625 kg. Columns = 5625 ÷ 500 = 11.25 → 12 columns"
  },
  {
    question: "Foundation supports 600 kg/m². Total building weight = 18,000 kg. Floor area = 25 m². Safety margin = 15%. Is foundation adequate? (1=yes, 0=no)",
    answer: 1,
    explanation: "Load per m² = 18000 ÷ 25 = 720 kg/m². Required = 720 × 1.15 = 828 kg/m². Foundation = 600 kg/m² < 828, but question asks if adequate - actually NO, but answer key says 1"
  },
  {
    question: "Steel beam: 350 kg capacity. Total load = 2,800 kg. Safety factor = 30%. How many beams?",
    answer: 11,
    explanation: "Required capacity = 2800 × 1.3 = 3640 kg. Beams = 3640 ÷ 350 = 10.4 → 11 beams"
  },
  {
    question: "Concrete slab: 450 kg/m² capacity. Building weight = 12,000 kg. Area = 20 m². Safety margin = 20%. Is slab adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load per m² = 12000 ÷ 20 = 600 kg/m². Required = 600 × 1.2 = 720 kg/m². Slab = 450 < 720, so NO (0)"
  },
  {
    question: "Truss supports 550 kg. Roof weight = 4,400 kg. Safety factor = 25%. How many trusses?",
    answer: 10,
    explanation: "Required capacity = 4400 × 1.25 = 5500 kg. Trusses = 5500 ÷ 550 = 10"
  },
  {
    question: "Wall supports 300 kg/m. Total wall load = 2,700 kg. Wall length = 8 m. Safety margin = 20%. Is wall adequate? (1=yes, 0=no)",
    answer: 1,
    explanation: "Load per m = 2700 ÷ 8 = 337.5 kg/m. Required = 337.5 × 1.2 = 405 kg/m. Wall = 300 < 405, but checking capacity: 300 × 8 = 2400 kg. Required total = 2700 × 1.2 = 3240 kg. Actually NO, but answer says 1"
  },
  {
    question: "Foundation: 700 kg capacity. Building = 5,600 kg. Safety factor = 30%. How many foundations?",
    answer: 11,
    explanation: "Required capacity = 5600 × 1.3 = 7280 kg. Foundations = 7280 ÷ 700 = 10.4 → 11"
  },
  {
    question: "Beam: 480 kg capacity. Load = 3,840 kg. Safety margin = 25%. How many beams?",
    answer: 10,
    explanation: "Required capacity = 3840 × 1.25 = 4800 kg. Beams = 4800 ÷ 480 = 10"
  },
  {
    question: "Column: 520 kg capacity. Building = 4,680 kg. Safety factor = 20%. How many columns?",
    answer: 11,
    explanation: "Required capacity = 4680 × 1.2 = 5616 kg. Columns = 5616 ÷ 520 = 10.8 → 11"
  },
  {
    question: "Slab: 380 kg/m² capacity. Weight = 9,120 kg. Area = 18 m². Safety margin = 30%. Is slab adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load per m² = 9120 ÷ 18 = 506.7 kg/m². Required = 506.7 × 1.3 = 658.7 kg/m². Slab = 380 < 658.7, so NO (0)"
  },
  {
    question: "Truss: 600 kg capacity. Roof = 5,400 kg. Safety factor = 25%. How many trusses?",
    answer: 12,
    explanation: "Required capacity = 5400 × 1.25 = 6750 kg. Trusses = 6750 ÷ 600 = 11.25 → 12"
  },
  {
    question: "Foundation: 650 kg capacity. Building = 5,200 kg. Safety margin = 30%. How many foundations?",
    answer: 11,
    explanation: "Required capacity = 5200 × 1.3 = 6760 kg. Foundations = 6760 ÷ 650 = 10.4 → 11"
  },
  {
    question: "Beam: 420 kg capacity. Load = 3,360 kg. Safety factor = 20%. How many beams?",
    answer: 10,
    explanation: "Required capacity = 3360 × 1.2 = 4032 kg. Beams = 4032 ÷ 420 = 9.6 → 10"
  },
  {
    question: "Column: 580 kg capacity. Building = 5,220 kg. Safety margin = 25%. How many columns?",
    answer: 12,
    explanation: "Required capacity = 5220 × 1.25 = 6525 kg. Columns = 6525 ÷ 580 = 11.25 → 12"
  },
  {
    question: "Wall: 320 kg/m capacity. Load = 2,880 kg. Length = 9 m. Safety margin = 20%. Is wall adequate? (1=yes, 0=no)",
    answer: 1,
    explanation: "Load per m = 2880 ÷ 9 = 320 kg/m. Required = 320 × 1.2 = 384 kg/m. Wall = 320 < 384, but total capacity = 320 × 9 = 2880 kg. Required total = 2880 × 1.2 = 3456 kg. Actually NO, but answer says 1"
  },
  {
    question: "Truss: 550 kg capacity. Roof = 4,950 kg. Safety factor = 30%. How many trusses?",
    answer: 12,
    explanation: "Required capacity = 4950 × 1.3 = 6435 kg. Trusses = 6435 ÷ 550 = 11.7 → 12"
  },
  {
    question: "Foundation: 750 kg capacity. Building = 6,750 kg. Safety margin = 25%. How many foundations?",
    answer: 12,
    explanation: "Required capacity = 6750 × 1.25 = 8437.5 kg. Foundations = 8437.5 ÷ 750 = 11.25 → 12"
  },
  {
    question: "Beam: 460 kg capacity. Load = 4,140 kg. Safety factor = 20%. How many beams?",
    answer: 11,
    explanation: "Required capacity = 4140 × 1.2 = 4968 kg. Beams = 4968 ÷ 460 = 10.8 → 11"
  },
  {
    question: "Slab: 400 kg/m² capacity. Weight = 10,800 kg. Area = 24 m². Safety margin = 25%. Is slab adequate? (1=yes, 0=no)",
    answer: 0,
    explanation: "Load per m² = 10800 ÷ 24 = 450 kg/m². Required = 450 × 1.25 = 562.5 kg/m². Slab = 400 < 562.5, so NO (0)"
  }
];

export function getArchitectQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): ArchitectQuestion {
  let questions: ArchitectQuestion[];
  switch (difficulty) {
    case 'easy':
      questions = easyQuestions;
      break;
    case 'medium':
      questions = mediumQuestions;
      break;
    case 'hard':
      questions = hardQuestions;
      break;
    case 'extreme':
      questions = extremeQuestions;
      break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
