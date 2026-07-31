// Electrical Engineer – Power Systems Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface ElectricalEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Power & Basic Calculations (W to kW, Energy = Power × Time)
const easyQuestions: ElectricalEngineerQuestion[] = [
  { question: "An oven uses 3,500 W. How many kilowatts (kW)?", answer: 3.5, explanation: "3,500 W = 3.5 kW" },
  { question: "Town hall runs 8 kW for 6 hours. How many kWh used?", answer: 48, explanation: "8 × 6 = 48 kWh" },
  { question: "A pump uses 1,250 W. How many kW?", answer: 1.25, explanation: "1,250 W = 1.25 kW" },
  { question: "5 kW for 8 hours. How many kWh?", answer: 40, explanation: "5 × 8 = 40 kWh" },
  { question: "Street lights draw 5,600 W. How many kW?", answer: 5.6, explanation: "5,600 W = 5.6 kW" },
  { question: "10 kW for 3 hours. kWh used?", answer: 30, explanation: "10 × 3 = 30 kWh" },
  { question: "A heater uses 850 W. How many kW?", answer: 0.85, explanation: "850 W = 0.85 kW" },
  { question: "4 kW for 6 hours. How many kWh?", answer: 24, explanation: "4 × 6 = 24 kWh" },
  { question: "Workshop equipment uses 3,300 W. How many kW?", answer: 3.3, explanation: "3,300 W = 3.3 kW" },
  { question: "6 kW for 5 hours. How many kWh used?", answer: 30, explanation: "6 × 5 = 30 kWh" },
  { question: "A fan uses 1,650 W. How many kilowatts?", answer: 1.65, explanation: "1,650 W = 1.65 kW" },
  { question: "9 kW for 4 hours. How many kWh?", answer: 36, explanation: "9 × 4 = 36 kWh" },
  { question: "Cooling unit draws 7,200 W. How many kW?", answer: 7.2, explanation: "7,200 W = 7.2 kW" },
  { question: "2 kW for 11 hours. kWh used?", answer: 22, explanation: "2 × 11 = 22 kWh" },
  { question: "A projector uses 450 W. How many kW?", answer: 0.45, explanation: "450 W = 0.45 kW" },
  { question: "13 kW for 2 hours. How many kWh?", answer: 26, explanation: "13 × 2 = 26 kWh" },
  { question: "Kitchen appliances use 2,600 W. How many kW?", answer: 2.6, explanation: "2,600 W = 2.6 kW" },
  { question: "7 kW for 6 hours. How many kWh used?", answer: 42, explanation: "7 × 6 = 42 kWh" },
  { question: "A lift motor uses 9,500 W. How many kW?", answer: 9.5, explanation: "9,500 W = 9.5 kW" },
  { question: "3 kW for 10 hours. How many kWh?", answer: 30, explanation: "3 × 10 = 30 kWh" }
];

// MEDIUM – Electricity Cost (cost per kWh, solar vs grid)
const mediumQuestions: ElectricalEngineerQuestion[] = [
  { question: "Electricity costs R2.40 per kWh. Town uses 150 kWh. Total cost (R)?", answer: 360, explanation: "2.40 × 150 = R360" },
  { question: "Solar produces 62 kWh/day. Town needs 98 kWh. How much from grid (kWh)?", answer: 36, explanation: "98 - 62 = 36 kWh" },
  { question: "R1.80 per kWh. 220 kWh used. Total cost (R)?", answer: 396, explanation: "1.80 × 220 = R396" },
  { question: "Solar 47 kWh/day. Town needs 82 kWh. Grid shortfall (kWh)?", answer: 35, explanation: "82 - 47 = 35 kWh" },
  { question: "R2.50 per kWh. 140 kWh. Total cost (R)?", answer: 350, explanation: "2.50 × 140 = R350" },
  { question: "Solar 38 kWh. Need 71 kWh. How much from grid (kWh)?", answer: 33, explanation: "71 - 38 = 33 kWh" },
  { question: "R1.65 per kWh. 300 kWh used. Total cost (R)?", answer: 495, explanation: "1.65 × 300 = R495" },
  { question: "Solar 54 kWh/day. Town needs 89 kWh. Grid needed (kWh)?", answer: 35, explanation: "89 - 54 = 35 kWh" },
  { question: "R2.85 per kWh. 100 kWh. Total cost (R)?", answer: 285, explanation: "2.85 × 100 = R285" },
  { question: "Solar 31 kWh. Need 66 kWh. From grid (kWh)?", answer: 35, explanation: "66 - 31 = 35 kWh" },
  { question: "R2.00 per kWh. 195 kWh. Total cost (R)?", answer: 390, explanation: "2.00 × 195 = R390" },
  { question: "Solar 76 kWh. Town needs 112 kWh. Grid (kWh)?", answer: 36, explanation: "112 - 76 = 36 kWh" },
  { question: "R1.70 per kWh. 250 kWh. Total cost (R)?", answer: 425, explanation: "1.70 × 250 = R425" },
  { question: "Solar 44 kWh/day. Need 79 kWh. Grid shortfall (kWh)?", answer: 35, explanation: "79 - 44 = 35 kWh" },
  { question: "R2.45 per kWh. 160 kWh used. Total cost (R)?", answer: 392, explanation: "2.45 × 160 = R392" },
  { question: "Solar 59 kWh. Need 94 kWh. How much from grid (kWh)?", answer: 35, explanation: "94 - 59 = 35 kWh" },
  { question: "R1.90 per kWh. 270 kWh. Total cost (R)?", answer: 513, explanation: "1.90 × 270 = R513" },
  { question: "Solar 33 kWh/day. Town needs 68 kWh. Grid (kWh)?", answer: 35, explanation: "68 - 33 = 35 kWh" },
  { question: "R2.30 per kWh. 180 kWh. Total cost (R)?", answer: 414, explanation: "2.30 × 180 = R414" },
  { question: "Solar 67 kWh. Need 102 kWh. From grid (kWh)?", answer: 35, explanation: "102 - 67 = 35 kWh" }
];

// HARD – Load Management (total load, overload, % increase)
const hardQuestions: ElectricalEngineerQuestion[] = [
  { question: "Library 15 kW, Gym 18 kW, Hall 13 kW. Total load (kW)?", answer: 46, explanation: "15 + 18 + 13 = 46 kW" },
  { question: "Current load 95 kW. Usage increases 10%. New total load (kW)?", answer: 104.5, explanation: "95 × 1.10 = 104.5 kW" },
  { question: "Factory 23 kW, Warehouse 19 kW, Office 11 kW. Total load (kW)?", answer: 53, explanation: "23 + 19 + 11 = 53 kW" },
  { question: "Load 120 kW. 10% increase. New load (kW)?", answer: 132, explanation: "120 × 1.10 = 132 kW" },
  { question: "Market 9 kW, School 21 kW, Clinic 15 kW. Total (kW)?", answer: 45, explanation: "9 + 21 + 15 = 45 kW" },
  { question: "Load 70 kW. Increases 10%. New total (kW)?", answer: 77, explanation: "70 × 1.10 = 77 kW" },
  { question: "Hospital 28 kW, School 16 kW, Shop 19 kW. Total load (kW)?", answer: 63, explanation: "28 + 16 + 19 = 63 kW" },
  { question: "Current 145 kW. 10% increase. New load (kW)?", answer: 159.5, explanation: "145 × 1.10 = 159.5 kW" },
  { question: "Building A 12 kW, B 17 kW, C 14 kW. Total (kW)?", answer: 43, explanation: "12 + 17 + 14 = 43 kW" },
  { question: "Load 88 kW. 10% increase. New total (kW)?", answer: 96.8, explanation: "88 × 1.10 = 96.8 kW" },
  { question: "Town hall 11 kW, Library 20 kW, Museum 8 kW. Total load (kW)?", answer: 39, explanation: "11 + 20 + 8 = 39 kW" },
  { question: "Load 55 kW. 10% increase. New load (kW)?", answer: 60.5, explanation: "55 × 1.10 = 60.5 kW" },
  { question: "Clinic 16 kW, School 23 kW, Shop 18 kW. Total (kW)?", answer: 57, explanation: "16 + 23 + 18 = 57 kW" },
  { question: "Current load 175 kW. 10% increase. New total (kW)?", answer: 192.5, explanation: "175 × 1.10 = 192.5 kW" },
  { question: "Block 1: 13 kW, Block 2: 15 kW, Block 3: 19 kW. Total load (kW)?", answer: 47, explanation: "13 + 15 + 19 = 47 kW" },
  { question: "Load 92 kW. 10% increase. New load (kW)?", answer: 101.2, explanation: "92 × 1.10 = 101.2 kW" },
  { question: "Hospital 25 kW, School 20 kW, Office 16 kW. Total (kW)?", answer: 61, explanation: "25 + 20 + 16 = 61 kW" },
  { question: "Load 68 kW. Increases 10%. New total (kW)?", answer: 74.8, explanation: "68 × 1.10 = 74.8 kW" },
  { question: "Three facilities: 14 kW, 11 kW, 22 kW. Total load (kW)?", answer: 47, explanation: "14 + 11 + 22 = 47 kW" },
  { question: "Current 115 kW. 10% increase. New load (kW)?", answer: 126.5, explanation: "115 × 1.10 = 126.5 kW" }
];

// EXTREME – Renewable Planning & Efficiency (% renewable, efficiency %)
const extremeQuestions: ElectricalEngineerQuestion[] = [
  { question: "Solar produces 84 kWh/day. Town needs 168 kWh/day. What percentage is renewable?", answer: 50, explanation: "84 ÷ 168 × 100 = 50%" },
  { question: "Wind turbine 50 kW at 70% efficiency. Actual output (kW)?", answer: 35, explanation: "50 × 0.70 = 35 kW" },
  { question: "Solar 96 kWh. Town needs 128 kWh. Percentage renewable?", answer: 75, explanation: "96 ÷ 128 × 100 = 75%" },
  { question: "Generator 40 kW at 85% efficiency. Actual output (kW)?", answer: 34, explanation: "40 × 0.85 = 34 kW" },
  { question: "Solar 63 kWh/day. Need 126 kWh. % renewable?", answer: 50, explanation: "63 ÷ 126 × 100 = 50%" },
  { question: "Wind 48 kW at 75% efficiency. Output (kW)?", answer: 36, explanation: "48 × 0.75 = 36 kW" },
  { question: "Solar 110 kWh. Town needs 220 kWh. % from solar?", answer: 50, explanation: "110 ÷ 220 × 100 = 50%" },
  { question: "Turbine 35 kW at 90% efficiency. Actual output (kW)?", answer: 31.5, explanation: "35 × 0.90 = 31.5 kW" },
  { question: "Solar 72 kWh. Need 90 kWh. Percentage renewable?", answer: 80, explanation: "72 ÷ 90 × 100 = 80%" },
  { question: "Generator 25 kW at 88% efficiency. Output (kW)?", answer: 22, explanation: "25 × 0.88 = 22 kW" },
  { question: "Solar 54 kWh/day. Town needs 108 kWh. % renewable?", answer: 50, explanation: "54 ÷ 108 × 100 = 50%" },
  { question: "Wind 42 kW at 95% efficiency. Actual output (kW)?", answer: 39.9, explanation: "42 × 0.95 = 39.9 kW" },
  { question: "Solar 99 kWh. Need 165 kWh. % from solar?", answer: 60, explanation: "99 ÷ 165 × 100 = 60%" },
  { question: "Turbine 56 kW at 80% efficiency. Output (kW)?", answer: 44.8, explanation: "56 × 0.80 = 44.8 kW" },
  { question: "Solar 81 kWh/day. Town needs 135 kWh. % renewable?", answer: 60, explanation: "81 ÷ 135 × 100 = 60%" },
  { question: "Generator 50 kW at 70% efficiency. Actual output (kW)?", answer: 35, explanation: "50 × 0.70 = 35 kW" },
  { question: "Solar 117 kWh. Need 156 kWh. Percentage renewable?", answer: 75, explanation: "117 ÷ 156 × 100 = 75%" },
  { question: "Wind 65 kW at 84% efficiency. Output (kW)?", answer: 54.6, explanation: "65 × 0.84 = 54.6 kW" },
  { question: "Solar 48 kWh. Town needs 96 kWh. % renewable?", answer: 50, explanation: "48 ÷ 96 × 100 = 50%" },
  { question: "Turbine 72 kW at 92% efficiency. Actual output (kW)?", answer: 66.24, explanation: "72 × 0.92 = 66.24 kW" }
];

export function getElectricalEngineerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): ElectricalEngineerQuestion {
  let questions: ElectricalEngineerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
