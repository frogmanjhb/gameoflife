// Civil Engineer – Infrastructure Design Challenge (Infrastructure Project)
// 20 questions per difficulty tier. All numeric answers.

export interface CivilEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Measurement & Area (area, perimeter, scale)
export const easyQuestions: CivilEngineerQuestion[] = [
  { question: "A road is 85 m long and 8 m wide. What is the surface area (m²)?", answer: 680, explanation: "85 × 8 = 680 m²" },
  { question: "Scale drawing 1:100. Building length on paper = 12 cm. Real length in metres?", answer: 12, explanation: "12 cm × 100 = 1200 cm = 12 m" },
  { question: "A rectangular site is 30 m × 15 m. Area (m²)?", answer: 450, explanation: "30 × 15 = 450 m²" },
  { question: "Scale 1:50. Length on paper = 10 cm. Real length (m)?", answer: 5, explanation: "10 × 50 = 500 cm = 5 m" },
  { question: "Rectangle 40 m × 20 m. Perimeter (m)?", answer: 120, explanation: "2×(40+20) = 120 m" },
  { question: "Scale 1:200. 3.5 cm on paper. Real length (m)?", answer: 7, explanation: "3.5 × 200 = 700 cm = 7 m" },
  { question: "Road 110 m long, 5 m wide. Surface area (m²)?", answer: 550, explanation: "110 × 5 = 550 m²" },
  { question: "Scale 1:100. 8 cm on paper. Real length (m)?", answer: 8, explanation: "8 × 100 = 800 cm = 8 m" },
  { question: "Plot 32 m × 11 m. Area (m²)?", answer: 352, explanation: "32 × 11 = 352 m²" },
  { question: "Scale 1:50. 12 cm on paper. Real length (m)?", answer: 6, explanation: "12 × 50 = 600 cm = 6 m" },
  { question: "Rectangle 50 m × 25 m. Perimeter (m)?", answer: 150, explanation: "2×(50+25) = 150 m" },
  { question: "Road 95 m × 4 m. Surface area (m²)?", answer: 380, explanation: "95 × 4 = 380 m²" },
  { question: "Scale 1:100. 16 cm on paper. Real length (m)?", answer: 16, explanation: "16 × 100 = 1600 cm = 16 m" },
  { question: "Site 18 m × 16 m. Area (m²)?", answer: 288, explanation: "18 × 16 = 288 m²" },
  { question: "Scale 1:200. 5 cm on paper. Real length (m)?", answer: 10, explanation: "5 × 200 = 1000 cm = 10 m" },
  { question: "Rectangle 60 m × 30 m. Perimeter (m)?", answer: 180, explanation: "2×(60+30) = 180 m" },
  { question: "Road 130 m long, 7 m wide. Surface area (m²)?", answer: 910, explanation: "130 × 7 = 910 m²" },
  { question: "Scale 1:50. 16 cm on paper. Real length (m)?", answer: 8, explanation: "16 × 50 = 800 cm = 8 m" },
  { question: "Plot 25 m × 13 m. Area (m²)?", answer: 325, explanation: "25 × 13 = 325 m²" },
  { question: "Scale 1:100. 10 cm on paper. Real length (m)?", answer: 10, explanation: "10 × 100 = 1000 cm = 10 m" }
];

// MEDIUM – Cost per Metre (unit rates, beams × cost)
export const mediumQuestions: CivilEngineerQuestion[] = [
  { question: "Road costs R520 per metre. Road length = 120 m. Total cost (R)?", answer: 62400, explanation: "520 × 120 = R62,400" },
  { question: "Bridge requires 36 support beams. Each costs R640. Total material cost (R)?", answer: 23040, explanation: "36 × 640 = R23,040" },
  { question: "R450 per metre. Road 98 m. Total cost (R)?", answer: 44100, explanation: "450 × 98 = R44,100" },
  { question: "30 beams at R780 each. Total cost (R)?", answer: 23400, explanation: "30 × 780 = R23,400" },
  { question: "Road R580 per m. Length 88 m. Total cost (R)?", answer: 51040, explanation: "580 × 88 = R51,040" },
  { question: "45 beams at R720 each. Total (R)?", answer: 32400, explanation: "45 × 720 = R32,400" },
  { question: "R400 per m. Road 112 m. Total cost (R)?", answer: 44800, explanation: "400 × 112 = R44,800" },
  { question: "22 beams at R890 each. Total (R)?", answer: 19580, explanation: "22 × 890 = R19,580" },
  { question: "Road R470 per m. 130 m. Total cost (R)?", answer: 61100, explanation: "470 × 130 = R61,100" },
  { question: "38 beams at R650 each. Total (R)?", answer: 24700, explanation: "38 × 650 = R24,700" },
  { question: "R510 per m. Road 75 m. Total cost (R)?", answer: 38250, explanation: "510 × 75 = R38,250" },
  { question: "52 beams at R580 each. Total (R)?", answer: 30160, explanation: "52 × 580 = R30,160" },
  { question: "Road R620 per m. 68 m. Total cost (R)?", answer: 42160, explanation: "620 × 68 = R42,160" },
  { question: "27 beams at R940 each. Total (R)?", answer: 25380, explanation: "27 × 940 = R25,380" },
  { question: "R380 per m. Road 142 m. Total cost (R)?", answer: 53960, explanation: "380 × 142 = R53,960" },
  { question: "33 beams at R770 each. Total (R)?", answer: 25410, explanation: "33 × 770 = R25,410" },
  { question: "Road R490 per m. 105 m. Total cost (R)?", answer: 51450, explanation: "490 × 105 = R51,450" },
  { question: "41 beams at R830 each. Total (R)?", answer: 34030, explanation: "41 × 830 = R34,030" },
  { question: "R550 per m. Road 91 m. Total cost (R)?", answer: 50050, explanation: "550 × 91 = R50,050" },
  { question: "29 beams at R710 each. Total (R)?", answer: 20590, explanation: "29 × 710 = R20,590" }
];

// HARD – Load & Volume (volume L×W×D, capacity ÷ load)
export const hardQuestions: CivilEngineerQuestion[] = [
  { question: "Concrete slab: length 12 m, width 8 m, depth 0.15 m. Volume required (m³)?", answer: 14.4, explanation: "12 × 8 × 0.15 = 14.4 m³" },
  { question: "Bridge supports 15,000 kg. Truck weighs 3,750 kg. How many trucks safely at once?", answer: 4, explanation: "15,000 ÷ 3,750 = 4" },
  { question: "Slab 10 m × 5 m × 0.2 m. Volume (m³)?", answer: 10, explanation: "10 × 5 × 0.2 = 10 m³" },
  { question: "Capacity 20,000 kg. Truck 4,000 kg. How many trucks at once?", answer: 5, explanation: "20,000 ÷ 4,000 = 5" },
  { question: "Slab 15 m × 6 m × 0.25 m. Volume (m³)?", answer: 22.5, explanation: "15 × 6 × 0.25 = 22.5 m³" },
  { question: "Bridge 24,000 kg. Truck 6,000 kg. Trucks at once?", answer: 4, explanation: "24,000 ÷ 6,000 = 4" },
  { question: "Slab 8 m × 4 m × 0.3 m. Volume (m³)?", answer: 9.6, explanation: "8 × 4 × 0.3 = 9.6 m³" },
  { question: "Capacity 18,000 kg. Vehicle 4,500 kg. Vehicles at once?", answer: 4, explanation: "18,000 ÷ 4,500 = 4" },
  { question: "Slab 20 m × 12 m × 0.2 m. Volume (m³)?", answer: 48, explanation: "20 × 12 × 0.2 = 48 m³" },
  { question: "Bridge 32,000 kg. Truck 8,000 kg. Trucks at once?", answer: 4, explanation: "32,000 ÷ 8,000 = 4" },
  { question: "Slab 9 m × 6 m × 0.18 m. Volume (m³)?", answer: 9.72, explanation: "9 × 6 × 0.18 = 9.72 m³" },
  { question: "Capacity 14,400 kg. Truck 3,600 kg. Trucks at once?", answer: 4, explanation: "14,400 ÷ 3,600 = 4" },
  { question: "Slab 11 m × 7 m × 0.22 m. Volume (m³)?", answer: 16.94, explanation: "11 × 7 × 0.22 = 16.94 m³" },
  { question: "Bridge 21,000 kg. Truck 5,250 kg. Trucks at once?", answer: 4, explanation: "21,000 ÷ 5,250 = 4" },
  { question: "Slab 14 m × 5 m × 0.24 m. Volume (m³)?", answer: 16.8, explanation: "14 × 5 × 0.24 = 16.8 m³" },
  { question: "Capacity 9,600 kg. Truck 2,400 kg. Trucks at once?", answer: 4, explanation: "9,600 ÷ 2,400 = 4" },
  { question: "Slab 17 m × 9 m × 0.26 m. Volume (m³)?", answer: 39.78, explanation: "17 × 9 × 0.26 = 39.78 m³" },
  { question: "Bridge 27,500 kg. Truck 5,500 kg. Trucks at once?", answer: 5, explanation: "27,500 ÷ 5,500 = 5" },
  { question: "Slab 6 m × 5 m × 0.35 m. Volume (m³)?", answer: 10.5, explanation: "6 × 5 × 0.35 = 10.5 m³" },
  { question: "Capacity 16,800 kg. Truck 4,200 kg. Trucks at once?", answer: 4, explanation: "16,800 ÷ 4,200 = 4" }
];

// EXTREME – Terrain & Biome Adaptation (overflow, slope)
export const extremeQuestions: CivilEngineerQuestion[] = [
  { question: "Rainfall in Wetlands biome = 285 mm/week. Drainage removes 210 mm/week. Overflow (mm)?", answer: 75, explanation: "285 - 210 = 75 mm" },
  { question: "Slope ratio 1:15. Vertical rise = 3 m. Horizontal distance (m)?", answer: 45, explanation: "3 × 15 = 45 m" },
  { question: "Rainfall 350 mm/week. Drainage 265 mm/week. Overflow (mm)?", answer: 85, explanation: "350 - 265 = 85 mm" },
  { question: "Slope 1:20. Rise 2.5 m. Horizontal distance (m)?", answer: 50, explanation: "2.5 × 20 = 50 m" },
  { question: "Rainfall 160 mm. Drainage 95 mm. Overflow (mm)?", answer: 65, explanation: "160 - 95 = 65 mm" },
  { question: "Slope 1:8. Rise 4 m. Horizontal distance (m)?", answer: 32, explanation: "4 × 8 = 32 m" },
  { question: "Rainfall 290 mm/week. Drainage 215 mm. Overflow (mm)?", answer: 75, explanation: "290 - 215 = 75 mm" },
  { question: "Slope 1:24. Rise 1.5 m. Horizontal distance (m)?", answer: 36, explanation: "1.5 × 24 = 36 m" },
  { question: "Rainfall 410 mm. Drainage 340 mm. Overflow (mm)?", answer: 70, explanation: "410 - 340 = 70 mm" },
  { question: "Slope 1:11. Rise 3.5 m. Horizontal distance (m)?", answer: 38.5, explanation: "3.5 × 11 = 38.5 m" },
  { question: "Rainfall 180 mm. Drainage 115 mm. Overflow (mm)?", answer: 65, explanation: "180 - 115 = 65 mm" },
  { question: "Slope 1:30. Rise 2 m. Horizontal distance (m)?", answer: 60, explanation: "2 × 30 = 60 m" },
  { question: "Rainfall 330 mm. Drainage 255 mm. Overflow (mm)?", answer: 75, explanation: "330 - 255 = 75 mm" },
  { question: "Slope 1:7. Rise 3 m. Horizontal distance (m)?", answer: 21, explanation: "3 × 7 = 21 m" },
  { question: "Rainfall 220 mm. Drainage 150 mm. Overflow (mm)?", answer: 70, explanation: "220 - 150 = 70 mm" },
  { question: "Slope 1:13. Rise 4 m. Horizontal distance (m)?", answer: 52, explanation: "4 × 13 = 52 m" },
  { question: "Rainfall 395 mm. Drainage 320 mm. Overflow (mm)?", answer: 75, explanation: "395 - 320 = 75 mm" },
  { question: "Slope 1:25. Rise 2.4 m. Horizontal distance (m)?", answer: 60, explanation: "2.4 × 25 = 60 m" },
  { question: "Rainfall 150 mm. Drainage 80 mm. Overflow (mm)?", answer: 70, explanation: "150 - 80 = 70 mm" },
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
