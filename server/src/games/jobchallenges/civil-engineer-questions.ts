// Civil Engineer – Infrastructure Design Challenge (Infrastructure Project)
// 20 questions per difficulty tier. All numeric answers.

export interface CivilEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Measurement & Area (area, perimeter, scale)
export const easyQuestions: CivilEngineerQuestion[] = [
  { question: "A road is 100 m long and 5 m wide. What is the surface area (m²)?", answer: 500, explanation: "100 × 5 = 500 m²" },
  { question: "Scale drawing 1:100. Building length on paper = 8 cm. Real length in metres?", answer: 8, explanation: "8 cm × 100 = 800 cm = 8 m" },
  { question: "A rectangular site is 20 m × 10 m. Area (m²)?", answer: 200, explanation: "20 × 10 = 200 m²" },
  { question: "Scale 1:50. Length on paper = 4 cm. Real length (m)?", answer: 2, explanation: "4 × 50 = 200 cm = 2 m" },
  { question: "Rectangle 30 m × 15 m. Perimeter (m)?", answer: 90, explanation: "2×(30+15) = 90 m" },
  { question: "Scale 1:200. 5 cm on paper. Real length (m)?", answer: 10, explanation: "5 × 200 = 1,000 cm = 10 m" },
  { question: "Road 80 m long, 6 m wide. Surface area (m²)?", answer: 480, explanation: "80 × 6 = 480 m²" },
  { question: "Scale 1:100. 12 cm on paper. Real length (m)?", answer: 12, explanation: "12 × 100 = 1,200 cm = 12 m" },
  { question: "Plot 25 m × 8 m. Area (m²)?", answer: 200, explanation: "25 × 8 = 200 m²" },
  { question: "Scale 1:50. 10 cm on paper. Real length (m)?", answer: 5, explanation: "10 × 50 = 500 cm = 5 m" },
  { question: "Rectangle 40 m × 20 m. Perimeter (m)?", answer: 120, explanation: "2×(40+20) = 120 m" },
  { question: "Road 60 m × 4 m. Surface area (m²)?", answer: 240, explanation: "60 × 4 = 240 m²" },
  { question: "Scale 1:100. 7 cm on paper. Real length (m)?", answer: 7, explanation: "7 × 100 = 700 cm = 7 m" },
  { question: "Site 15 m × 12 m. Area (m²)?", answer: 180, explanation: "15 × 12 = 180 m²" },
  { question: "Scale 1:200. 3 cm on paper. Real length (m)?", answer: 6, explanation: "3 × 200 = 600 cm = 6 m" },
  { question: "Rectangle 50 m × 25 m. Perimeter (m)?", answer: 150, explanation: "2×(50+25) = 150 m" },
  { question: "Road 200 m long, 5 m wide. Surface area (m²)?", answer: 1000, explanation: "200 × 5 = 1,000 m²" },
  { question: "Scale 1:50. 6 cm on paper. Real length (m)?", answer: 3, explanation: "6 × 50 = 300 cm = 3 m" },
  { question: "Plot 18 m × 10 m. Area (m²)?", answer: 180, explanation: "18 × 10 = 180 m²" },
  { question: "Scale 1:100. 9 cm on paper. Real length (m)?", answer: 9, explanation: "9 × 100 = 900 cm = 9 m" }
];

// MEDIUM – Cost per Metre (unit rates, beams × cost)
export const mediumQuestions: CivilEngineerQuestion[] = [
  { question: "Road costs R500 per metre. Road length = 120 m. Total cost (R)?", answer: 60000, explanation: "500 × 120 = R60,000" },
  { question: "Bridge requires 30 support beams. Each costs R800. Total material cost (R)?", answer: 24000, explanation: "30 × 800 = R24,000" },
  { question: "R400 per metre. Road 80 m. Total cost (R)?", answer: 32000, explanation: "400 × 80 = R32,000" },
  { question: "25 beams at R600 each. Total cost (R)?", answer: 15000, explanation: "25 × 600 = R15,000" },
  { question: "Road R550 per m. Length 100 m. Total cost (R)?", answer: 55000, explanation: "550 × 100 = R55,000" },
  { question: "40 beams at R750 each. Total (R)?", answer: 30000, explanation: "40 × 750 = R30,000" },
  { question: "R450 per m. Road 90 m. Total cost (R)?", answer: 40500, explanation: "450 × 90 = R40,500" },
  { question: "20 beams at R900 each. Total (R)?", answer: 18000, explanation: "20 × 900 = R18,000" },
  { question: "Road R600 per m. 75 m. Total cost (R)?", answer: 45000, explanation: "600 × 75 = R45,000" },
  { question: "35 beams at R650 each. Total (R)?", answer: 22750, explanation: "35 × 650 = R22,750" },
  { question: "R350 per m. Road 140 m. Total cost (R)?", answer: 49000, explanation: "350 × 140 = R49,000" },
  { question: "50 beams at R500 each. Total (R)?", answer: 25000, explanation: "50 × 500 = R25,000" },
  { question: "Road R480 per m. 95 m. Total cost (R)?", answer: 45600, explanation: "480 × 95 = R45,600" },
  { question: "28 beams at R700 each. Total (R)?", answer: 19600, explanation: "28 × 700 = R19,600" },
  { question: "R520 per m. Road 110 m. Total cost (R)?", answer: 57200, explanation: "520 × 110 = R57,200" },
  { question: "45 beams at R820 each. Total (R)?", answer: 36900, explanation: "45 × 820 = R36,900" },
  { question: "Road R380 per m. 130 m. Total cost (R)?", answer: 49400, explanation: "380 × 130 = R49,400" },
  { question: "22 beams at R950 each. Total (R)?", answer: 20900, explanation: "22 × 950 = R20,900" },
  { question: "R420 per m. Road 85 m. Total cost (R)?", answer: 35700, explanation: "420 × 85 = R35,700" },
  { question: "38 beams at R720 each. Total (R)?", answer: 27360, explanation: "38 × 720 = R27,360" }
];

// HARD – Load & Volume (volume L×W×D, capacity ÷ load)
export const hardQuestions: CivilEngineerQuestion[] = [
  { question: "Concrete slab: length 10 m, width 5 m, depth 0.2 m. Volume of concrete required (m³)?", answer: 10, explanation: "10 × 5 × 0.2 = 10 m³" },
  { question: "Bridge supports 10,000 kg. Truck weighs 2,500 kg. How many trucks safely at once?", answer: 4, explanation: "10,000 ÷ 2,500 = 4" },
  { question: "Slab 8 m × 4 m × 0.15 m. Volume (m³)?", answer: 4.8, explanation: "8 × 4 × 0.15 = 4.8 m³" },
  { question: "Capacity 8,000 kg. Truck 2,000 kg. How many trucks at once?", answer: 4, explanation: "8,000 ÷ 2,000 = 4" },
  { question: "Slab 12 m × 6 m × 0.25 m. Volume (m³)?", answer: 18, explanation: "12 × 6 × 0.25 = 18 m³" },
  { question: "Bridge 15,000 kg. Truck 3,000 kg. Trucks at once?", answer: 5, explanation: "15,000 ÷ 3,000 = 5" },
  { question: "Slab 5 m × 5 m × 0.2 m. Volume (m³)?", answer: 5, explanation: "5 × 5 × 0.2 = 5 m³" },
  { question: "Capacity 12,000 kg. Vehicle 4,000 kg. Vehicles at once?", answer: 3, explanation: "12,000 ÷ 4,000 = 3" },
  { question: "Slab 15 m × 10 m × 0.3 m. Volume (m³)?", answer: 45, explanation: "15 × 10 × 0.3 = 45 m³" },
  { question: "Bridge 20,000 kg. Truck 5,000 kg. Trucks at once?", answer: 4, explanation: "20,000 ÷ 5,000 = 4" },
  { question: "Slab 6 m × 3 m × 0.2 m. Volume (m³)?", answer: 3.6, explanation: "6 × 3 × 0.2 = 3.6 m³" },
  { question: "Capacity 9,000 kg. Truck 2,250 kg. Trucks at once?", answer: 4, explanation: "9,000 ÷ 2,250 = 4" },
  { question: "Slab 20 m × 8 m × 0.25 m. Volume (m³)?", answer: 40, explanation: "20 × 8 × 0.25 = 40 m³" },
  { question: "Bridge 25,000 kg. Truck 6,250 kg. Trucks at once?", answer: 4, explanation: "25,000 ÷ 6,250 = 4" },
  { question: "Slab 7 m × 4 m × 0.15 m. Volume (m³)?", answer: 4.2, explanation: "7 × 4 × 0.15 = 4.2 m³" },
  { question: "Capacity 6,000 kg. Truck 1,500 kg. Trucks at once?", answer: 4, explanation: "6,000 ÷ 1,500 = 4" },
  { question: "Slab 9 m × 5 m × 0.2 m. Volume (m³)?", answer: 9, explanation: "9 × 5 × 0.2 = 9 m³" },
  { question: "Bridge 18,000 kg. Truck 4,500 kg. Trucks at once?", answer: 4, explanation: "18,000 ÷ 4,500 = 4" },
  { question: "Slab 11 m × 7 m × 0.3 m. Volume (m³)?", answer: 23.1, explanation: "11 × 7 × 0.3 = 23.1 m³" },
  { question: "Capacity 14,000 kg. Truck 3,500 kg. Trucks at once?", answer: 4, explanation: "14,000 ÷ 3,500 = 4" }
];

// EXTREME – Terrain & Biome Adaptation (overflow, slope)
export const extremeQuestions: CivilEngineerQuestion[] = [
  { question: "Rainfall in Coastal biome = 200 mm/week. Drainage removes 150 mm/week. Overflow (mm)?", answer: 50, explanation: "200 - 150 = 50 mm" },
  { question: "Slope ratio 1:10. Vertical rise = 2 m. Horizontal distance (m)?", answer: 20, explanation: "Run = rise × 10 = 20 m" },
  { question: "Rainfall 300 mm/week. Drainage 220 mm/week. Overflow (mm)?", answer: 80, explanation: "300 - 220 = 80 mm" },
  { question: "Slope 1:15. Rise 3 m. Horizontal distance (m)?", answer: 45, explanation: "3 × 15 = 45 m" },
  { question: "Rainfall 150 mm. Drainage 90 mm. Overflow (mm)?", answer: 60, explanation: "150 - 90 = 60 mm" },
  { question: "Slope 1:20. Rise 1.5 m. Horizontal distance (m)?", answer: 30, explanation: "1.5 × 20 = 30 m" },
  { question: "Rainfall 250 mm/week. Drainage 180 mm. Overflow (mm)?", answer: 70, explanation: "250 - 180 = 70 mm" },
  { question: "Slope 1:10. Rise 4 m. Horizontal distance (m)?", answer: 40, explanation: "4 × 10 = 40 m" },
  { question: "Rainfall 180 mm. Drainage 120 mm. Overflow (mm)?", answer: 60, explanation: "180 - 120 = 60 mm" },
  { question: "Slope 1:12. Rise 2.5 m. Horizontal distance (m)?", answer: 30, explanation: "2.5 × 12 = 30 m" },
  { question: "Rainfall 400 mm/week. Drainage 350 mm. Overflow (mm)?", answer: 50, explanation: "400 - 350 = 50 mm" },
  { question: "Slope 1:8. Rise 2 m. Horizontal distance (m)?", answer: 16, explanation: "2 × 8 = 16 m" },
  { question: "Rainfall 120 mm. Drainage 80 mm. Overflow (mm)?", answer: 40, explanation: "120 - 80 = 40 mm" },
  { question: "Slope 1:25. Rise 2 m. Horizontal distance (m)?", answer: 50, explanation: "2 × 25 = 50 m" },
  { question: "Rainfall 280 mm. Drainage 200 mm. Overflow (mm)?", answer: 80, explanation: "280 - 200 = 80 mm" },
  { question: "Slope 1:10. Rise 5 m. Horizontal distance (m)?", answer: 50, explanation: "5 × 10 = 50 m" },
  { question: "Rainfall 350 mm. Drainage 280 mm. Overflow (mm)?", answer: 70, explanation: "350 - 280 = 70 mm" },
  { question: "Slope 1:15. Rise 4 m. Horizontal distance (m)?", answer: 60, explanation: "4 × 15 = 60 m" },
  { question: "Rainfall 220 mm. Drainage 150 mm. Overflow (mm)?", answer: 70, explanation: "220 - 150 = 70 mm" },
  { question: "Slope 1:5. Rise 3 m. Horizontal distance (m)?", answer: 15, explanation: "3 × 5 = 15 m" }
];

export function getCivilEngineerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): CivilEngineerQuestion {
  let questions: CivilEngineerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
