"use strict";
// Electrical Engineer – Power Systems Challenge (Power Allocation Review)
// 20 questions per difficulty tier. All numeric answers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extremeQuestions = exports.hardQuestions = exports.mediumQuestions = exports.easyQuestions = void 0;
exports.getElectricalEngineerQuestion = getElectricalEngineerQuestion;
// EASY – Power & Basic Calculations (W to kW, Energy = Power × Time)
exports.easyQuestions = [
    {
        question: "A geyser uses 2,200 W. How many kilowatts (kW) is that?",
        answer: 2.2,
        explanation: "2,200 W = 2.2 kW"
    },
    {
        question: "A school uses 6 kW for 3 hours. How many kWh used?",
        answer: 18,
        explanation: "6 × 3 = 18 kWh"
    },
    {
        question: "A device uses 3,200 W. How many kW?",
        answer: 3.2,
        explanation: "3,200 W = 3.2 kW"
    },
    {
        question: "4 kW for 5 hours. How many kWh?",
        answer: 20,
        explanation: "4 × 5 = 20 kWh"
    },
    {
        question: "750 W in kilowatts?",
        answer: 0.75,
        explanation: "750 W = 0.75 kW"
    },
    {
        question: "12 kW for 2 hours. kWh used?",
        answer: 24,
        explanation: "12 × 2 = 24 kWh"
    },
    {
        question: "4,800 W. How many kW?",
        answer: 4.8,
        explanation: "4,800 W = 4.8 kW"
    },
    {
        question: "3 kW for 7 hours. How many kWh?",
        answer: 21,
        explanation: "3 × 7 = 21 kWh"
    },
    {
        question: "6,400 W in kilowatts?",
        answer: 6.4,
        explanation: "6,400 W = 6.4 kW"
    },
    {
        question: "5 kW for 4 hours. kWh?",
        answer: 20,
        explanation: "5 × 4 = 20 kWh"
    },
    {
        question: "950 W. How many kW?",
        answer: 0.95,
        explanation: "950 W = 0.95 kW"
    },
    {
        question: "7 kW for 5 hours. How many kWh?",
        answer: 35,
        explanation: "7 × 5 = 35 kWh"
    },
    {
        question: "1,800 W in kilowatts?",
        answer: 1.8,
        explanation: "1,800 W = 1.8 kW"
    },
    {
        question: "9 kW for 3 hours. kWh used?",
        answer: 27,
        explanation: "9 × 3 = 27 kWh"
    },
    {
        question: "2,800 W. How many kW?",
        answer: 2.8,
        explanation: "2,800 W = 2.8 kW"
    },
    {
        question: "11 kW for 2 hours. How many kWh?",
        answer: 22,
        explanation: "11 × 2 = 22 kWh"
    },
    {
        question: "550 W in kilowatts?",
        answer: 0.55,
        explanation: "550 W = 0.55 kW"
    },
    {
        question: "8 kW for 4 hours. kWh?",
        answer: 32,
        explanation: "8 × 4 = 32 kWh"
    },
    {
        question: "4,200 W. How many kW?",
        answer: 4.2,
        explanation: "4,200 W = 4.2 kW"
    },
    {
        question: "2 kW for 9 hours. How many kWh used?",
        answer: 18,
        explanation: "2 × 9 = 18 kWh"
    }
];
// MEDIUM – Electricity Cost (cost per kWh, solar vs grid)
exports.mediumQuestions = [
    {
        question: "Electricity costs R2.20 per kWh. Town uses 180 kWh. Total cost (R)?",
        answer: 396,
        explanation: "2.20 × 180 = R396"
    },
    {
        question: "Solar produces 55 kWh per day. Town needs 85 kWh. How much still needed from grid (kWh)?",
        answer: 30,
        explanation: "85 - 55 = 30 kWh"
    },
    {
        question: "R1.75 per kWh. 240 kWh used. Total cost (R)?",
        answer: 420,
        explanation: "1.75 × 240 = R420"
    },
    {
        question: "Solar 65 kWh/day. Town needs 95 kWh. Grid shortfall (kWh)?",
        answer: 30,
        explanation: "95 - 65 = 30 kWh"
    },
    {
        question: "R2.60 per kWh. 125 kWh. Total cost (R)?",
        answer: 325,
        explanation: "2.60 × 125 = R325"
    },
    {
        question: "Solar 35 kWh/day. Need 52 kWh. How much from grid (kWh)?",
        answer: 17,
        explanation: "52 - 35 = 17 kWh"
    },
    {
        question: "R2.90 per kWh. 95 kWh used. Total cost (R)?",
        answer: 275.5,
        explanation: "2.90 × 95 = R275.50"
    },
    {
        question: "Solar 72 kWh. Town needs 108 kWh. Grid needed (kWh)?",
        answer: 36,
        explanation: "108 - 72 = 36 kWh"
    },
    {
        question: "R1.95 per kWh. 160 kWh. Total cost (R)?",
        answer: 312,
        explanation: "1.95 × 160 = R312"
    },
    {
        question: "Solar 28 kWh/day. Need 63 kWh. Shortfall from grid (kWh)?",
        answer: 35,
        explanation: "63 - 28 = 35 kWh"
    },
    {
        question: "R2.35 per kWh. 200 kWh. Total cost (R)?",
        answer: 470,
        explanation: "2.35 × 200 = R470"
    },
    {
        question: "Solar 80 kWh. Need 115 kWh. Grid (kWh)?",
        answer: 35,
        explanation: "115 - 80 = 35 kWh"
    },
    {
        question: "R1.85 per kWh. 280 kWh. Total cost (R)?",
        answer: 518,
        explanation: "1.85 × 280 = R518"
    },
    {
        question: "Solar 22 kWh/day. Need 58 kWh. From grid (kWh)?",
        answer: 36,
        explanation: "58 - 22 = 36 kWh"
    },
    {
        question: "R2.75 per kWh. 88 kWh. Total cost (R)?",
        answer: 242,
        explanation: "2.75 × 88 = R242"
    },
    {
        question: "Solar 48 kWh. Need 73 kWh. Grid shortfall (kWh)?",
        answer: 25,
        explanation: "73 - 48 = 25 kWh"
    },
    {
        question: "R1.55 per kWh. 320 kWh. Total cost (R)?",
        answer: 496,
        explanation: "1.55 × 320 = R496"
    },
    {
        question: "Solar 58 kWh. Need 93 kWh. Grid (kWh)?",
        answer: 35,
        explanation: "93 - 58 = 35 kWh"
    },
    {
        question: "R2.15 per kWh. 175 kWh. Total cost (R)?",
        answer: 376.25,
        explanation: "2.15 × 175 = R376.25"
    },
    {
        question: "Solar 42 kWh/day. Need 77 kWh. From grid (kWh)?",
        answer: 35,
        explanation: "77 - 42 = 35 kWh"
    }
];
// HARD – Load Management (total load, overload, % increase)
exports.hardQuestions = [
    {
        question: "Town grid capacity 60 kW. Hospital 22 kW, School 17 kW, Shop 16 kW. Total load (kW)?",
        answer: 55,
        explanation: "22 + 17 + 16 = 55 kW"
    },
    {
        question: "Current load 110 kW. Usage increases by 10%. New total load (kW)?",
        answer: 121,
        explanation: "110 × 1.10 = 121 kW"
    },
    {
        question: "Buildings: 14 kW, 9 kW, 18 kW. Total load (kW)?",
        answer: 41,
        explanation: "14 + 9 + 18 = 41 kW"
    },
    {
        question: "Load 85 kW. 10% increase. New load (kW)?",
        answer: 93.5,
        explanation: "85 × 1.10 = 93.5 kW"
    },
    {
        question: "Clinic 12 kW, School 16 kW, Shop 11 kW. Total (kW)?",
        answer: 39,
        explanation: "12 + 16 + 11 = 39 kW"
    },
    {
        question: "Load 65 kW. Increases 10%. New load (kW)?",
        answer: 71.5,
        explanation: "65 × 1.10 = 71.5 kW"
    },
    {
        question: "Hospital 24 kW, School 19 kW, Office 14 kW. Total load (kW)?",
        answer: 57,
        explanation: "24 + 19 + 14 = 57 kW"
    },
    {
        question: "Current 130 kW. 10% increase. New total (kW)?",
        answer: 143,
        explanation: "130 × 1.10 = 143 kW"
    },
    {
        question: "Three buildings: 18 kW, 13 kW, 8 kW. Total (kW)?",
        answer: 39,
        explanation: "18 + 13 + 8 = 39 kW"
    },
    {
        question: "Load 98 kW. 10% increase. New load (kW)?",
        answer: 107.8,
        explanation: "98 × 1.10 = 107.8 kW"
    },
    {
        question: "Hospital 26 kW, School 14 kW, Shop 12 kW. Total load (kW)?",
        answer: 52,
        explanation: "26 + 14 + 12 = 52 kW"
    },
    {
        question: "Load 75 kW. 10% increase. New total (kW)?",
        answer: 82.5,
        explanation: "75 × 1.10 = 82.5 kW"
    },
    {
        question: "Buildings draw: 10 kW, 16 kW, 21 kW. Total (kW)?",
        answer: 47,
        explanation: "10 + 16 + 21 = 47 kW"
    },
    {
        question: "Current load 160 kW. 10% increase. New load (kW)?",
        answer: 176,
        explanation: "160 × 1.10 = 176 kW"
    },
    {
        question: "Clinic 13 kW, School 18 kW, Shop 14 kW. Total load (kW)?",
        answer: 45,
        explanation: "13 + 18 + 14 = 45 kW"
    },
    {
        question: "Load 58 kW. 10% increase. New total (kW)?",
        answer: 63.8,
        explanation: "58 × 1.10 = 63.8 kW"
    },
    {
        question: "Hospital 20 kW, School 22 kW, Office 17 kW. Total (kW)?",
        answer: 59,
        explanation: "20 + 22 + 17 = 59 kW"
    },
    {
        question: "Load 102 kW. 10% increase. New load (kW)?",
        answer: 112.2,
        explanation: "102 × 1.10 = 112.2 kW"
    },
    {
        question: "Three facilities: 11 kW, 19 kW, 7 kW. Total load (kW)?",
        answer: 37,
        explanation: "11 + 19 + 7 = 37 kW"
    },
    {
        question: "Current 48 kW. 10% increase. New total (kW)?",
        answer: 52.8,
        explanation: "48 × 1.10 = 52.8 kW"
    }
];
// EXTREME – Renewable Planning & Efficiency (% renewable, efficiency %)
exports.extremeQuestions = [
    {
        question: "Solar produces 96 kWh/day. Town needs 144 kWh/day. What percentage of town's energy is renewable?",
        answer: 66.67,
        explanation: "96 ÷ 144 × 100 = 66.67%"
    },
    {
        question: "Wind turbine generates 36 kW at 80% efficiency. Actual output (kW)?",
        answer: 28.8,
        explanation: "36 × 0.80 = 28.8 kW"
    },
    {
        question: "Solar 72 kWh. Town needs 120 kWh. Percentage renewable?",
        answer: 60,
        explanation: "72 ÷ 120 × 100 = 60%"
    },
    {
        question: "Turbine 45 kW at 72% efficiency. Actual output (kW)?",
        answer: 32.4,
        explanation: "45 × 0.72 = 32.4 kW"
    },
    {
        question: "Solar 55 kWh/day. Need 110 kWh. % renewable?",
        answer: 50,
        explanation: "55 ÷ 110 × 100 = 50%"
    },
    {
        question: "Generator 30 kW at 65% efficiency. Actual output (kW)?",
        answer: 19.5,
        explanation: "30 × 0.65 = 19.5 kW"
    },
    {
        question: "Solar 108 kWh. Town needs 180 kWh. % from solar?",
        answer: 60,
        explanation: "108 ÷ 180 × 100 = 60%"
    },
    {
        question: "Wind 55 kW at 76% efficiency. Output (kW)?",
        answer: 41.8,
        explanation: "55 × 0.76 = 41.8 kW"
    },
    {
        question: "Solar 88 kWh. Need 110 kWh. Percentage renewable?",
        answer: 80,
        explanation: "88 ÷ 110 × 100 = 80%"
    },
    {
        question: "Turbine 64 kW at 88% efficiency. Actual output (kW)?",
        answer: 56.32,
        explanation: "64 × 0.88 = 56.32 kW"
    },
    {
        question: "Solar 45 kWh/day. Town needs 90 kWh. % renewable?",
        answer: 50,
        explanation: "45 ÷ 90 × 100 = 50%"
    },
    {
        question: "Generator 24 kW at 92% efficiency. Output (kW)?",
        answer: 22.08,
        explanation: "24 × 0.92 = 22.08 kW"
    },
    {
        question: "Solar 120 kWh. Need 240 kWh. % renewable?",
        answer: 50,
        explanation: "120 ÷ 240 × 100 = 50%"
    },
    {
        question: "Wind 52 kW at 68% efficiency. Actual output (kW)?",
        answer: 35.36,
        explanation: "52 × 0.68 = 35.36 kW"
    },
    {
        question: "Solar 78 kWh. Need 130 kWh. % from solar?",
        answer: 60,
        explanation: "78 ÷ 130 × 100 = 60%"
    },
    {
        question: "Turbine 38 kW at 74% efficiency. Output (kW)?",
        answer: 28.12,
        explanation: "38 × 0.74 = 28.12 kW"
    },
    {
        question: "Solar 90 kWh/day. Need 120 kWh. % renewable?",
        answer: 75,
        explanation: "90 ÷ 120 × 100 = 75%"
    },
    {
        question: "Generator 52 kW at 78% efficiency. Actual output (kW)?",
        answer: 40.56,
        explanation: "52 × 0.78 = 40.56 kW"
    },
    {
        question: "Solar 105 kWh. Town needs 175 kWh. % renewable?",
        answer: 60,
        explanation: "105 ÷ 175 × 100 = 60%"
    },
    {
        question: "Wind 60 kW at 82% efficiency. Actual output (kW)?",
        answer: 49.2,
        explanation: "60 × 0.82 = 49.2 kW"
    }
];
function getElectricalEngineerQuestion(difficulty) {
    let questions;
    switch (difficulty) {
        case 'easy':
            questions = exports.easyQuestions;
            break;
        case 'medium':
            questions = exports.mediumQuestions;
            break;
        case 'hard':
            questions = exports.hardQuestions;
            break;
        case 'extreme':
            questions = exports.extremeQuestions;
            break;
    }
    return questions[Math.floor(Math.random() * questions.length)];
}
//# sourceMappingURL=electrical-engineer-questions.js.map