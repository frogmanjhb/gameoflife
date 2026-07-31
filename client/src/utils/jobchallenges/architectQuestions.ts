// Client-side architect question bank (same as server-side)
// 20 questions per difficulty tier. All numeric answers.

export interface ArchitectQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: ArchitectQuestion[] = [
  { question: "A science lab is 8 m × 7 m. What is the area in square meters?", answer: 56, explanation: "Area = 8 × 7 = 56 m²" },
  { question: "A fence surrounds a 9 m × 5 m herb garden. What is the perimeter in meters?", answer: 28, explanation: "Perimeter = 2 × (9 + 5) = 28 m" },
  { question: "A rectangular art studio is 12 m long and 6 m wide. What is the area?", answer: 72, explanation: "Area = 12 × 6 = 72 m²" },
  { question: "A square reception area has sides of 10 m each. What is the perimeter?", answer: 40, explanation: "Perimeter = 4 × 10 = 40 m" },
  { question: "A rectangular site is 16 m × 7 m. What is the area?", answer: 112, explanation: "Area = 16 × 7 = 112 m²" },
  { question: "A room measures 14 m by 6 m. What is the perimeter?", answer: 40, explanation: "Perimeter = 2 × (14 + 6) = 40 m" },
  { question: "A square patio has an area of 64 m². What is the length of one side?", answer: 8, explanation: "Side = √64 = 8 m" },
  { question: "A rectangular hall is 20 m long and 8 m wide. What is the area?", answer: 160, explanation: "Area = 20 × 8 = 160 m²" },
  { question: "A square room has a perimeter of 52 m. What is the length of one side?", answer: 13, explanation: "Side = 52 ÷ 4 = 13 m" },
  { question: "A rectangular garden is 18 m × 5 m. What is the area?", answer: 90, explanation: "Area = 18 × 5 = 90 m²" },
  { question: "A room is 11 m long and 9 m wide. What is the perimeter?", answer: 40, explanation: "Perimeter = 2 × (11 + 9) = 40 m" },
  { question: "A square office has sides of 12 m. What is the area?", answer: 144, explanation: "Area = 12 × 12 = 144 m²" },
  { question: "A rectangular space is 21 m × 5 m. What is the area?", answer: 105, explanation: "Area = 21 × 5 = 105 m²" },
  { question: "A square room has an area of 144 m². What is the perimeter?", answer: 48, explanation: "Side = 12 m, Perimeter = 4 × 12 = 48 m" },
  { question: "A rectangular plot is 12 m × 10 m. What is the perimeter?", answer: 44, explanation: "Perimeter = 2 × (12 + 10) = 44 m" },
  { question: "A room measures 9 m by 8 m. What is the area?", answer: 72, explanation: "Area = 9 × 8 = 72 m²" },
  { question: "A square courtyard has a perimeter of 56 m. What is the area?", answer: 196, explanation: "Side = 14 m, Area = 14 × 14 = 196 m²" },
  { question: "A rectangular hall is 22 m long and 9 m wide. What is the area?", answer: 198, explanation: "Area = 22 × 9 = 198 m²" },
  { question: "A room is 16 m long and 5 m wide. What is the perimeter?", answer: 42, explanation: "Perimeter = 2 × (16 + 5) = 42 m" },
  { question: "A square office has an area of 169 m². What is the length of one side?", answer: 13, explanation: "Side = √169 = 13 m" }
];

const mediumQuestions: ArchitectQuestion[] = [
  { question: "Scale: 1 cm = 3 m. Draw 15 m length → how many cm?", answer: 5, explanation: "15 ÷ 3 = 5 cm" },
  { question: "Flooring costs R310 per m². Floor area = 48 m². Total cost?", answer: 14880, explanation: "48 × 310 = R14,880" },
  { question: "Scale: 1 cm = 2 m. Draw 14 m length → how many cm?", answer: 7, explanation: "14 ÷ 2 = 7 cm" },
  { question: "Paint costs R185 per m². Wall area = 42 m². Total cost?", answer: 7770, explanation: "42 × 185 = R7,770" },
  { question: "Scale: 1 cm = 4 m. Draw 20 m length → how many cm?", answer: 5, explanation: "20 ÷ 4 = 5 cm" },
  { question: "Tiles cost R320 per m². Floor area = 36 m². Total cost?", answer: 11520, explanation: "36 × 320 = R11,520" },
  { question: "Scale: 1 cm = 5 m. Draw 35 m length → how many cm?", answer: 7, explanation: "35 ÷ 5 = 7 cm" },
  { question: "Carpet costs R385 per m². Floor area = 28 m². Total cost?", answer: 10780, explanation: "28 × 385 = R10,780" },
  { question: "Scale: 1 cm = 2.5 m. Draw 20 m length → how many cm?", answer: 8, explanation: "20 ÷ 2.5 = 8 cm" },
  { question: "Windows cost R880 per m². Window area = 16 m². Total cost?", answer: 14080, explanation: "16 × 880 = R14,080" },
  { question: "Scale: 1 cm = 6 m. Draw 42 m length → how many cm?", answer: 7, explanation: "42 ÷ 6 = 7 cm" },
  { question: "Roofing costs R340 per m². Roof area = 52 m². Total cost?", answer: 17680, explanation: "52 × 340 = R17,680" },
  { question: "Scale: 1 cm = 3.5 m. Draw 24.5 m length → how many cm?", answer: 7, explanation: "24.5 ÷ 3.5 = 7 cm" },
  { question: "Insulation costs R255 per m². Wall area = 56 m². Total cost?", answer: 14280, explanation: "56 × 255 = R14,280" },
  { question: "Scale: 1 cm = 4 m. Draw 32 m length → how many cm?", answer: 8, explanation: "32 ÷ 4 = 8 cm" },
  { question: "Doors cost R980 per m². Door area = 9 m². Total cost?", answer: 8820, explanation: "9 × 980 = R8,820" },
  { question: "Scale: 1 cm = 1.5 m. Draw 10.5 m length → how many cm?", answer: 7, explanation: "10.5 ÷ 1.5 = 7 cm" },
  { question: "Plaster costs R125 per m². Wall area = 64 m². Total cost?", answer: 8000, explanation: "64 × 125 = R8,000" },
  { question: "Scale: 1 cm = 8 m. Draw 40 m length → how many cm?", answer: 5, explanation: "40 ÷ 8 = 5 cm" },
  { question: "Electrical work costs R175 per m². Floor area = 54 m². Total cost?", answer: 9450, explanation: "54 × 175 = R9,450" }
];

const hardQuestions: ArchitectQuestion[] = [
  { question: "Budget: R135,000. Floor area ≥95 m². Perimeter ≤54 m. If length=12 m, what is max width?", answer: 15, explanation: "2(12+w) ≤ 54 → w ≤ 15 m. Area = 180 m² ≥ 95 ✓" },
  { question: "Budget: R88,000. Floor area ≥55 m². Perimeter ≤40 m. If length=10 m, max width?", answer: 10, explanation: "2(10+w) ≤ 40 → w ≤ 10 m. Area = 100 m² ≥ 55 ✓" },
  { question: "Budget: R156,000. Roof area ≥120 m². Perimeter ≤62 m. If length=18 m, max width?", answer: 13, explanation: "2(18+w) ≤ 62 → w ≤ 13 m. Area = 234 m² ≥ 120 ✓" },
  { question: "Budget: R104,000. Floor area ≥68 m². Perimeter ≤49 m. If length=13 m, max width?", answer: 11.5, explanation: "2(13+w) ≤ 49 → w ≤ 11.5 m. Area = 149.5 m² ≥ 68 ✓" },
  { question: "Budget: R198,000. Wall area ≥145 m². Perimeter ≤68 m. If length=21 m, max width?", answer: 13, explanation: "2(21+w) ≤ 68 → w ≤ 13 m. Area = 273 m² ≥ 145 ✓" },
  { question: "Budget: R122,000. Floor area ≥88 m². Perimeter ≤56 m. If length=14 m, max width?", answer: 14, explanation: "2(14+w) ≤ 56 → w ≤ 14 m. Area = 196 m² ≥ 88 ✓" },
  { question: "Budget: R142,000. Window area ≥105 m². Perimeter ≤58 m. If length=16 m, max width?", answer: 13, explanation: "2(16+w) ≤ 58 → w ≤ 13 m. Area = 208 m² ≥ 105 ✓" },
  { question: "Budget: R96,000. Floor area ≥56 m². Perimeter ≤45 m. If length=11 m, max width?", answer: 11.5, explanation: "2(11+w) ≤ 45 → w ≤ 11.5 m. Area = 126.5 m² ≥ 56 ✓" },
  { question: "Budget: R184,000. Roof area ≥135 m². Perimeter ≤66 m. If length=19 m, max width?", answer: 14, explanation: "2(19+w) ≤ 66 → w ≤ 14 m. Area = 266 m² ≥ 135 ✓" },
  { question: "Budget: R108,000. Floor area ≥74 m². Perimeter ≤50 m. If length=12 m, max width?", answer: 13, explanation: "2(12+w) ≤ 50 → w ≤ 13 m. Area = 156 m² ≥ 74 ✓" },
  { question: "Budget: R152,000. Floor area ≥110 m². Perimeter ≤61 m. If length=17 m, max width?", answer: 13.5, explanation: "2(17+w) ≤ 61 → w ≤ 13.5 m. Area = 229.5 m² ≥ 110 ✓" },
  { question: "Budget: R92,000. Floor area ≥52 m². Perimeter ≤44 m. If length=9 m, max width?", answer: 13, explanation: "2(9+w) ≤ 44 → w ≤ 13 m. Area = 117 m² ≥ 52 ✓" },
  { question: "Budget: R168,000. Roof area ≥125 m². Perimeter ≤64 m. If length=18 m, max width?", answer: 14, explanation: "2(18+w) ≤ 64 → w ≤ 14 m. Area = 252 m² ≥ 125 ✓" },
  { question: "Budget: R116,000. Floor area ≥80 m². Perimeter ≤53 m. If length=15 m, max width?", answer: 11.5, explanation: "2(15+w) ≤ 53 → w ≤ 11.5 m. Area = 172.5 m² ≥ 80 ✓" },
  { question: "Budget: R134,000. Wall area ≥98 m². Perimeter ≤59 m. If length=14 m, max width?", answer: 15.5, explanation: "2(14+w) ≤ 59 → w ≤ 15.5 m. Area = 217 m² ≥ 98 ✓" },
  { question: "Budget: R89,000. Floor area ≥48 m². Perimeter ≤41 m. If length=10 m, max width?", answer: 10.5, explanation: "2(10+w) ≤ 41 → w ≤ 10.5 m. Area = 105 m² ≥ 48 ✓" },
  { question: "Budget: R205,000. Floor area ≥160 m². Perimeter ≤72 m. If length=22 m, max width?", answer: 14, explanation: "2(22+w) ≤ 72 → w ≤ 14 m. Area = 308 m² ≥ 160 ✓" },
  { question: "Budget: R84,000. Floor area ≥46 m². Perimeter ≤40 m. If length=7 m, max width?", answer: 13, explanation: "2(7+w) ≤ 40 → w ≤ 13 m. Area = 91 m² ≥ 46 ✓" },
  { question: "Budget: R162,000. Roof area ≥118 m². Perimeter ≤63 m. If length=17 m, max width?", answer: 14.5, explanation: "2(17+w) ≤ 63 → w ≤ 14.5 m. Area = 246.5 m² ≥ 118 ✓" },
  { question: "Budget: R119,000. Floor area ≥82 m². Perimeter ≤54 m. If length=14 m, max width?", answer: 13, explanation: "2(14+w) ≤ 54 → w ≤ 13 m. Area = 182 m² ≥ 82 ✓" }
];

const extremeQuestions: ArchitectQuestion[] = [
  { question: "Beam supports 520 kg. Roof load = 4,160 kg. Minimum safety margin = 20%. How many beams required?", answer: 10, explanation: "Required = 4160 × 1.2 = 4992 kg. Beams = 4992 ÷ 520 = 9.6 → 10" },
  { question: "Column holds 510 kg. Building load = 4,590 kg. Safety factor = 25%. How many columns?", answer: 12, explanation: "Required = 4590 × 1.25 = 5737.5 kg. Columns = 5737.5 ÷ 510 = 11.25 → 12" },
  { question: "Foundation supports 580 kg/m². Total building weight = 14,500 kg. Floor area = 20 m². Safety margin = 20%. Is foundation adequate? (1=yes, 0=no)", answer: 0, explanation: "Load/m² = 725. Required = 870 kg/m². 580 < 870 → NO (0)" },
  { question: "Steel beam: 420 kg capacity. Total load = 3,780 kg. Safety factor = 30%. How many beams?", answer: 12, explanation: "Required = 3780 × 1.3 = 4914 kg. Beams = 4914 ÷ 420 = 11.7 → 12" },
  { question: "Concrete slab: 490 kg/m² capacity. Building weight = 10,290 kg. Area = 18 m². Safety margin = 15%. Is slab adequate? (1=yes, 0=no)", answer: 0, explanation: "Load/m² ≈ 572. Required ≈ 657 kg/m². 490 < 657 → NO (0)" },
  { question: "Truss supports 590 kg. Roof weight = 5,310 kg. Safety factor = 25%. How many trusses?", answer: 12, explanation: "Required = 5310 × 1.25 = 6637.5 kg. Trusses = 6637.5 ÷ 590 = 11.25 → 12" },
  { question: "Wall supports 380 kg/m. Total wall load = 3,040 kg. Wall length = 8 m. Safety margin = 20%. Is wall adequate? (1=yes, 0=no)", answer: 0, explanation: "Load/m = 380. Required = 456 kg/m. 380 < 456 → NO (0)" },
  { question: "Foundation: 710 kg capacity. Building = 5,680 kg. Safety factor = 30%. How many foundations?", answer: 11, explanation: "Required = 5680 × 1.3 = 7384 kg. Foundations = 7384 ÷ 710 = 10.4 → 11" },
  { question: "Beam: 490 kg capacity. Load = 4,410 kg. Safety margin = 25%. How many beams?", answer: 12, explanation: "Required = 4410 × 1.25 = 5512.5 kg. Beams = 5512.5 ÷ 490 = 11.25 → 12" },
  { question: "Column: 560 kg capacity. Building = 5,040 kg. Safety factor = 20%. How many columns?", answer: 11, explanation: "Required = 5040 × 1.2 = 6048 kg. Columns = 6048 ÷ 560 = 10.8 → 11" },
  { question: "Slab: 430 kg/m² capacity. Weight = 9,460 kg. Area = 19 m². Safety margin = 25%. Is slab adequate? (1=yes, 0=no)", answer: 0, explanation: "Load/m² ≈ 498. Required ≈ 622 kg/m². 430 < 622 → NO (0)" },
  { question: "Truss: 650 kg capacity. Roof = 5,850 kg. Safety factor = 30%. How many trusses?", answer: 12, explanation: "Required = 5850 × 1.3 = 7605 kg. Trusses = 7605 ÷ 650 = 11.7 → 12" },
  { question: "Foundation: 760 kg capacity. Building = 6,080 kg. Safety margin = 25%. How many foundations?", answer: 10, explanation: "Required = 6080 × 1.25 = 7600 kg. Foundations = 7600 ÷ 760 = 10" },
  { question: "Beam: 460 kg capacity. Load = 4,140 kg. Safety factor = 20%. How many beams?", answer: 11, explanation: "Required = 4140 × 1.2 = 4968 kg. Beams = 4968 ÷ 460 = 10.8 → 11" },
  { question: "Column: 620 kg capacity. Building = 5,580 kg. Safety margin = 25%. How many columns?", answer: 12, explanation: "Required = 5580 × 1.25 = 6975 kg. Columns = 6975 ÷ 620 = 11.25 → 12" },
  { question: "Wall: 400 kg/m capacity. Load = 3,600 kg. Length = 9 m. Safety margin = 20%. Is wall adequate? (1=yes, 0=no)", answer: 0, explanation: "Load/m = 400. Required = 480 kg/m. 400 < 480 → NO (0)" },
  { question: "Truss: 670 kg capacity. Roof = 6,030 kg. Safety factor = 25%. How many trusses?", answer: 12, explanation: "Required = 6030 × 1.25 = 7537.5 kg. Trusses = 7537.5 ÷ 670 = 11.25 → 12" },
  { question: "Foundation: 800 kg capacity. Building = 6,400 kg. Safety margin = 30%. How many foundations?", answer: 11, explanation: "Required = 6400 × 1.3 = 8320 kg. Foundations = 8320 ÷ 800 = 10.4 → 11" },
  { question: "Beam: 510 kg capacity. Load = 4,590 kg. Safety factor = 20%. How many beams?", answer: 11, explanation: "Required = 4590 × 1.2 = 5508 kg. Beams = 5508 ÷ 510 = 10.8 → 11" },
  { question: "Slab: 500 kg/m² capacity. Weight = 12,000 kg. Area = 24 m². Safety margin = 20%. Is slab adequate? (1=yes, 0=no)", answer: 0, explanation: "Load/m² = 500. Required = 600 kg/m². 500 < 600 → NO (0)" }
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
