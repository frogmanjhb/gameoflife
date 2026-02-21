// Electrical Engineer – Power Systems Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface ElectricalEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: ElectricalEngineerQuestion[] = [
  { question: "A heater uses 1,000 W. How many kilowatts (kW) is that?", answer: 1, explanation: "1,000 W = 1 kW" },
  { question: "A school uses 5 kW for 2 hours. How many kWh used?", answer: 10, explanation: "Energy = Power × Time; 5 × 2 = 10 kWh" },
  { question: "A device uses 2,000 W. How many kW?", answer: 2, explanation: "2,000 W = 2 kW" },
  { question: "3 kW for 4 hours. How many kWh?", answer: 12, explanation: "3 × 4 = 12 kWh" },
  { question: "500 W in kilowatts?", answer: 0.5, explanation: "500 W = 0.5 kW" },
  { question: "10 kW for 1 hour. kWh used?", answer: 10, explanation: "10 × 1 = 10 kWh" },
  { question: "4,000 W. How many kW?", answer: 4, explanation: "4,000 W = 4 kW" },
  { question: "2 kW for 5 hours. How many kWh?", answer: 10, explanation: "2 × 5 = 10 kWh" },
  { question: "5,000 W in kilowatts?", answer: 5, explanation: "5,000 W = 5 kW" },
  { question: "6 kW for 3 hours. kWh?", answer: 18, explanation: "6 × 3 = 18 kWh" },
  { question: "800 W. How many kW?", answer: 0.8, explanation: "800 W = 0.8 kW" },
  { question: "4 kW for 6 hours. How many kWh?", answer: 24, explanation: "4 × 6 = 24 kWh" },
  { question: "1,500 W in kilowatts?", answer: 1.5, explanation: "1,500 W = 1.5 kW" },
  { question: "8 kW for 2 hours. kWh used?", answer: 16, explanation: "8 × 2 = 16 kWh" },
  { question: "2,500 W. How many kW?", answer: 2.5, explanation: "2,500 W = 2.5 kW" },
  { question: "7 kW for 4 hours. How many kWh?", answer: 28, explanation: "7 × 4 = 28 kWh" },
  { question: "600 W in kilowatts?", answer: 0.6, explanation: "600 W = 0.6 kW" },
  { question: "9 kW for 1 hour. kWh?", answer: 9, explanation: "9 × 1 = 9 kWh" },
  { question: "3,500 W. How many kW?", answer: 3.5, explanation: "3,500 W = 3.5 kW" },
  { question: "1 kW for 10 hours. How many kWh used?", answer: 10, explanation: "1 × 10 = 10 kWh" }
];

const mediumQuestions: ElectricalEngineerQuestion[] = [
  { question: "Electricity costs R2 per kWh. Town uses 150 kWh. Total cost (R)?", answer: 300, explanation: "2 × 150 = R300" },
  { question: "Solar produces 40 kWh per day. Town needs 60 kWh. How much still needed from grid (kWh)?", answer: 20, explanation: "60 - 40 = 20 kWh" },
  { question: "R1.50 per kWh. 200 kWh used. Total cost (R)?", answer: 300, explanation: "1.50 × 200 = R300" },
  { question: "Solar 50 kWh/day. Town needs 80 kWh. Grid shortfall (kWh)?", answer: 30, explanation: "80 - 50 = 30 kWh" },
  { question: "R2.50 per kWh. 100 kWh. Total cost (R)?", answer: 250, explanation: "2.50 × 100 = R250" },
  { question: "Solar 30 kWh/day. Need 45 kWh. How much from grid (kWh)?", answer: 15, explanation: "45 - 30 = 15 kWh" },
  { question: "R3 per kWh. 80 kWh used. Total cost (R)?", answer: 240, explanation: "3 × 80 = R240" },
  { question: "Solar 60 kWh. Town needs 90 kWh. Grid needed (kWh)?", answer: 30, explanation: "90 - 60 = 30 kWh" },
  { question: "R1.80 per kWh. 120 kWh. Total cost (R)?", answer: 216, explanation: "1.80 × 120 = R216" },
  { question: "Solar 25 kWh/day. Need 50 kWh. Shortfall from grid (kWh)?", answer: 25, explanation: "50 - 25 = 25 kWh" },
  { question: "R2.20 per kWh. 180 kWh. Total cost (R)?", answer: 396, explanation: "2.20 × 180 = R396" },
  { question: "Solar 70 kWh. Need 100 kWh. Grid (kWh)?", answer: 30, explanation: "100 - 70 = 30 kWh" },
  { question: "R1.60 per kWh. 250 kWh. Total cost (R)?", answer: 400, explanation: "1.60 × 250 = R400" },
  { question: "Solar 20 kWh/day. Need 55 kWh. From grid (kWh)?", answer: 35, explanation: "55 - 20 = 35 kWh" },
  { question: "R2.80 per kWh. 75 kWh. Total cost (R)?", answer: 210, explanation: "2.80 × 75 = R210" },
  { question: "Solar 45 kWh. Need 65 kWh. Grid shortfall (kWh)?", answer: 20, explanation: "65 - 45 = 20 kWh" },
  { question: "R1.40 per kWh. 300 kWh. Total cost (R)?", answer: 420, explanation: "1.40 × 300 = R420" },
  { question: "Solar 55 kWh. Need 85 kWh. Grid (kWh)?", answer: 30, explanation: "85 - 55 = 30 kWh" },
  { question: "R2.10 per kWh. 140 kWh. Total cost (R)?", answer: 294, explanation: "2.10 × 140 = R294" },
  { question: "Solar 35 kWh/day. Need 70 kWh. From grid (kWh)?", answer: 35, explanation: "70 - 35 = 35 kWh" }
];

const hardQuestions: ElectricalEngineerQuestion[] = [
  { question: "Town grid capacity 50 kW. Hospital 20 kW, School 15 kW, Shop 18 kW. Total load (kW)?", answer: 53, explanation: "20 + 15 + 18 = 53 kW" },
  { question: "Current load 100 kW. Usage increases by 10%. New total load (kW)?", answer: 110, explanation: "100 × 1.10 = 110 kW" },
  { question: "Buildings: 12 kW, 8 kW, 15 kW. Total load (kW)?", answer: 35, explanation: "12 + 8 + 15 = 35 kW" },
  { question: "Load 80 kW. 10% increase. New load (kW)?", answer: 88, explanation: "80 × 1.10 = 88 kW" },
  { question: "Clinic 10 kW, School 14 kW, Shop 9 kW. Total (kW)?", answer: 33, explanation: "10 + 14 + 9 = 33 kW" },
  { question: "Load 60 kW. Increases 10%. New load (kW)?", answer: 66, explanation: "60 × 1.10 = 66 kW" },
  { question: "Hospital 22 kW, School 18 kW, Office 12 kW. Total load (kW)?", answer: 52, explanation: "22 + 18 + 12 = 52 kW" },
  { question: "Current 120 kW. 10% increase. New total (kW)?", answer: 132, explanation: "120 × 1.10 = 132 kW" },
  { question: "Three buildings: 16 kW, 11 kW, 7 kW. Total (kW)?", answer: 34, explanation: "16 + 11 + 7 = 34 kW" },
  { question: "Load 90 kW. 10% increase. New load (kW)?", answer: 99, explanation: "90 × 1.10 = 99 kW" },
  { question: "Hospital 25 kW, School 12 kW, Shop 10 kW. Total load (kW)?", answer: 47, explanation: "25 + 12 + 10 = 47 kW" },
  { question: "Load 70 kW. 10% increase. New total (kW)?", answer: 77, explanation: "70 × 1.10 = 77 kW" },
  { question: "Buildings draw: 8 kW, 14 kW, 19 kW. Total (kW)?", answer: 41, explanation: "8 + 14 + 19 = 41 kW" },
  { question: "Current load 150 kW. 10% increase. New load (kW)?", answer: 165, explanation: "150 × 1.10 = 165 kW" },
  { question: "Clinic 11 kW, School 16 kW, Shop 13 kW. Total load (kW)?", answer: 40, explanation: "11 + 16 + 13 = 40 kW" },
  { question: "Load 55 kW. 10% increase. New total (kW)?", answer: 60.5, explanation: "55 × 1.10 = 60.5 kW" },
  { question: "Hospital 18 kW, School 20 kW, Office 15 kW. Total (kW)?", answer: 53, explanation: "18 + 20 + 15 = 53 kW" },
  { question: "Load 95 kW. 10% increase. New load (kW)?", answer: 104.5, explanation: "95 × 1.10 = 104.5 kW" },
  { question: "Three facilities: 9 kW, 17 kW, 6 kW. Total load (kW)?", answer: 32, explanation: "9 + 17 + 6 = 32 kW" },
  { question: "Current 44 kW. 10% increase. New total (kW)?", answer: 48.4, explanation: "44 × 1.10 = 48.4 kW" }
];

const extremeQuestions: ElectricalEngineerQuestion[] = [
  { question: "Solar produces 80 kWh/day. Town needs 120 kWh/day. What percentage of town's energy is renewable?", answer: 66.67, explanation: "80 ÷ 120 × 100 ≈ 66.67%" },
  { question: "Wind turbine generates 30 kW at 75% efficiency. Actual output (kW)?", answer: 22.5, explanation: "30 × 0.75 = 22.5 kW" },
  { question: "Solar 60 kWh. Town needs 100 kWh. Percentage renewable?", answer: 60, explanation: "60 ÷ 100 × 100 = 60%" },
  { question: "Turbine 40 kW at 80% efficiency. Actual output (kW)?", answer: 32, explanation: "40 × 0.80 = 32 kW" },
  { question: "Solar 50 kWh/day. Need 125 kWh. % renewable?", answer: 40, explanation: "50 ÷ 125 × 100 = 40%" },
  { question: "Generator 25 kW at 60% efficiency. Actual output (kW)?", answer: 15, explanation: "25 × 0.60 = 15 kW" },
  { question: "Solar 90 kWh. Town needs 150 kWh. % from solar?", answer: 60, explanation: "90 ÷ 150 × 100 = 60%" },
  { question: "Wind 50 kW at 70% efficiency. Output (kW)?", answer: 35, explanation: "50 × 0.70 = 35 kW" },
  { question: "Solar 72 kWh. Need 120 kWh. Percentage renewable?", answer: 60, explanation: "72 ÷ 120 × 100 = 60%" },
  { question: "Turbine 60 kW at 85% efficiency. Actual output (kW)?", answer: 51, explanation: "60 × 0.85 = 51 kW" },
  { question: "Solar 40 kWh/day. Town needs 80 kWh. % renewable?", answer: 50, explanation: "40 ÷ 80 × 100 = 50%" },
  { question: "Generator 20 kW at 90% efficiency. Output (kW)?", answer: 18, explanation: "20 × 0.90 = 18 kW" },
  { question: "Solar 100 kWh. Need 200 kWh. % renewable?", answer: 50, explanation: "100 ÷ 200 × 100 = 50%" },
  { question: "Wind 45 kW at 65% efficiency. Actual output (kW)?", answer: 29.25, explanation: "45 × 0.65 = 29.25 kW" },
  { question: "Solar 66 kWh. Need 110 kWh. % from solar?", answer: 60, explanation: "66 ÷ 110 × 100 = 60%" },
  { question: "Turbine 35 kW at 72% efficiency. Output (kW)?", answer: 25.2, explanation: "35 × 0.72 = 25.2 kW" },
  { question: "Solar 75 kWh/day. Need 100 kWh. % renewable?", answer: 75, explanation: "75 ÷ 100 × 100 = 75%" },
  { question: "Generator 48 kW at 75% efficiency. Actual output (kW)?", answer: 36, explanation: "48 × 0.75 = 36 kW" },
  { question: "Solar 84 kWh. Town needs 140 kWh. % renewable?", answer: 60, explanation: "84 ÷ 140 × 100 = 60%" },
  { question: "Wind 55 kW at 80% efficiency. Actual output (kW)?", answer: 44, explanation: "55 × 0.80 = 44 kW" }
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
