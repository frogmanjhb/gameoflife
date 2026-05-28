"use strict";
// Civil Engineer – Infrastructure Design Challenge (Infrastructure Project)
// 20 questions per difficulty tier. All numeric answers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extremeQuestions = exports.hardQuestions = exports.mediumQuestions = exports.easyQuestions = void 0;
exports.getCivilEngineerQuestion = getCivilEngineerQuestion;
// EASY – Measurement & Area (area, perimeter, scale)
exports.easyQuestions = [
    {
        question: "A road is 120 m long and 6 m wide. What is the surface area (m²)?",
        answer: 720,
        explanation: "120 × 6 = 720 m²"
    },
    {
        question: "Scale drawing 1:100. Building length on paper = 11 cm. Real length in metres?",
        answer: 11,
        explanation: "11 cm × 100 = 1100 cm = 11 m"
    },
    {
        question: "A rectangular site is 24 m × 12 m. Area (m²)?",
        answer: 288,
        explanation: "24 × 12 = 288 m²"
    },
    {
        question: "Scale 1:50. Length on paper = 6 cm. Real length (m)?",
        answer: 3,
        explanation: "6 × 50 = 300 cm = 3 m"
    },
    {
        question: "Rectangle 35 m × 18 m. Perimeter (m)?",
        answer: 106,
        explanation: "2×(35+18) = 106 m"
    },
    {
        question: "Scale 1:200. 4 cm on paper. Real length (m)?",
        answer: 8,
        explanation: "4 × 200 = 800 cm = 8 m"
    },
    {
        question: "Road 90 m long, 7 m wide. Surface area (m²)?",
        answer: 630,
        explanation: "90 × 7 = 630 m²"
    },
    {
        question: "Scale 1:100. 15 cm on paper. Real length (m)?",
        answer: 15,
        explanation: "15 × 100 = 1500 cm = 15 m"
    },
    {
        question: "Plot 28 m × 9 m. Area (m²)?",
        answer: 252,
        explanation: "28 × 9 = 252 m²"
    },
    {
        question: "Scale 1:50. 8 cm on paper. Real length (m)?",
        answer: 4,
        explanation: "8 × 50 = 400 cm = 4 m"
    },
    {
        question: "Rectangle 45 m × 22 m. Perimeter (m)?",
        answer: 134,
        explanation: "2×(45+22) = 134 m"
    },
    {
        question: "Road 75 m × 5 m. Surface area (m²)?",
        answer: 375,
        explanation: "75 × 5 = 375 m²"
    },
    {
        question: "Scale 1:100. 9 cm on paper. Real length (m)?",
        answer: 9,
        explanation: "9 × 100 = 900 cm = 9 m"
    },
    {
        question: "Site 22 m × 14 m. Area (m²)?",
        answer: 308,
        explanation: "22 × 14 = 308 m²"
    },
    {
        question: "Scale 1:200. 2.5 cm on paper. Real length (m)?",
        answer: 5,
        explanation: "2.5 × 200 = 500 cm = 5 m"
    },
    {
        question: "Rectangle 55 m × 28 m. Perimeter (m)?",
        answer: 166,
        explanation: "2×(55+28) = 166 m"
    },
    {
        question: "Road 150 m long, 6 m wide. Surface area (m²)?",
        answer: 900,
        explanation: "150 × 6 = 900 m²"
    },
    {
        question: "Scale 1:50. 14 cm on paper. Real length (m)?",
        answer: 7,
        explanation: "14 × 50 = 700 cm = 7 m"
    },
    {
        question: "Plot 21 m × 11 m. Area (m²)?",
        answer: 231,
        explanation: "21 × 11 = 231 m²"
    },
    {
        question: "Scale 1:100. 13 cm on paper. Real length (m)?",
        answer: 13,
        explanation: "13 × 100 = 1300 cm = 13 m"
    }
];
// MEDIUM – Cost per Metre (unit rates, beams × cost)
exports.mediumQuestions = [
    {
        question: "Road costs R480 per metre. Road length = 135 m. Total cost (R)?",
        answer: 64800,
        explanation: "480 × 135 = R64,800"
    },
    {
        question: "Bridge requires 32 support beams. Each costs R750. Total material cost (R)?",
        answer: 24000,
        explanation: "32 × 750 = R24,000"
    },
    {
        question: "R420 per metre. Road 95 m. Total cost (R)?",
        answer: 39900,
        explanation: "420 × 95 = R39,900"
    },
    {
        question: "28 beams at R680 each. Total cost (R)?",
        answer: 19040,
        explanation: "28 × 680 = R19,040"
    },
    {
        question: "Road R560 per m. Length 105 m. Total cost (R)?",
        answer: 58800,
        explanation: "560 × 105 = R58,800"
    },
    {
        question: "42 beams at R820 each. Total (R)?",
        answer: 34440,
        explanation: "42 × 820 = R34,440"
    },
    {
        question: "R390 per m. Road 88 m. Total cost (R)?",
        answer: 34320,
        explanation: "390 × 88 = R34,320"
    },
    {
        question: "24 beams at R950 each. Total (R)?",
        answer: 22800,
        explanation: "24 × 950 = R22,800"
    },
    {
        question: "Road R610 per m. 82 m. Total cost (R)?",
        answer: 50020,
        explanation: "610 × 82 = R50,020"
    },
    {
        question: "36 beams at R710 each. Total (R)?",
        answer: 25560,
        explanation: "36 × 710 = R25,560"
    },
    {
        question: "R370 per m. Road 145 m. Total cost (R)?",
        answer: 53650,
        explanation: "370 × 145 = R53,650"
    },
    {
        question: "48 beams at R540 each. Total (R)?",
        answer: 25920,
        explanation: "48 × 540 = R25,920"
    },
    {
        question: "Road R495 per m. 92 m. Total cost (R)?",
        answer: 45540,
        explanation: "495 × 92 = R45,540"
    },
    {
        question: "30 beams at R780 each. Total (R)?",
        answer: 23400,
        explanation: "30 × 780 = R23,400"
    },
    {
        question: "R530 per m. Road 115 m. Total cost (R)?",
        answer: 60950,
        explanation: "530 × 115 = R60,950"
    },
    {
        question: "40 beams at R860 each. Total (R)?",
        answer: 34400,
        explanation: "40 × 860 = R34,400"
    },
    {
        question: "Road R410 per m. 125 m. Total cost (R)?",
        answer: 51250,
        explanation: "410 × 125 = R51,250"
    },
    {
        question: "26 beams at R920 each. Total (R)?",
        answer: 23920,
        explanation: "26 × 920 = R23,920"
    },
    {
        question: "R445 per m. Road 78 m. Total cost (R)?",
        answer: 34710,
        explanation: "445 × 78 = R34,710"
    },
    {
        question: "34 beams at R690 each. Total (R)?",
        answer: 23460,
        explanation: "34 × 690 = R23,460"
    }
];
// HARD – Load & Volume (volume L×W×D, capacity ÷ load)
exports.hardQuestions = [
    {
        question: "Concrete slab: length 11 m, width 6 m, depth 0.2 m. Volume of concrete required (m³)?",
        answer: 13.2,
        explanation: "11 × 6 × 0.2 = 13.2 m³"
    },
    {
        question: "Bridge supports 12,000 kg. Truck weighs 3,000 kg. How many trucks safely at once?",
        answer: 4,
        explanation: "12,000 ÷ 3,000 = 4"
    },
    {
        question: "Slab 9 m × 5 m × 0.18 m. Volume (m³)?",
        answer: 8.1,
        explanation: "9 × 5 × 0.18 = 8.1 m³"
    },
    {
        question: "Capacity 9,600 kg. Truck 2,400 kg. How many trucks at once?",
        answer: 4,
        explanation: "9,600 ÷ 2,400 = 4"
    },
    {
        question: "Slab 14 m × 7 m × 0.22 m. Volume (m³)?",
        answer: 21.56,
        explanation: "14 × 7 × 0.22 = 21.56 m³"
    },
    {
        question: "Bridge 18,000 kg. Truck 3,600 kg. Trucks at once?",
        answer: 5,
        explanation: "18,000 ÷ 3,600 = 5"
    },
    {
        question: "Slab 6 m × 4 m × 0.25 m. Volume (m³)?",
        answer: 6,
        explanation: "6 × 4 × 0.25 = 6 m³"
    },
    {
        question: "Capacity 15,000 kg. Vehicle 5,000 kg. Vehicles at once?",
        answer: 3,
        explanation: "15,000 ÷ 5,000 = 3"
    },
    {
        question: "Slab 16 m × 9 m × 0.28 m. Volume (m³)?",
        answer: 40.32,
        explanation: "16 × 9 × 0.28 = 40.32 m³"
    },
    {
        question: "Bridge 22,000 kg. Truck 5,500 kg. Trucks at once?",
        answer: 4,
        explanation: "22,000 ÷ 5,500 = 4"
    },
    {
        question: "Slab 8 m × 3.5 m × 0.2 m. Volume (m³)?",
        answer: 5.6,
        explanation: "8 × 3.5 × 0.2 = 5.6 m³"
    },
    {
        question: "Capacity 10,800 kg. Truck 2,700 kg. Trucks at once?",
        answer: 4,
        explanation: "10,800 ÷ 2,700 = 4"
    },
    {
        question: "Slab 18 m × 10 m × 0.24 m. Volume (m³)?",
        answer: 43.2,
        explanation: "18 × 10 × 0.24 = 43.2 m³"
    },
    {
        question: "Bridge 28,000 kg. Truck 7,000 kg. Trucks at once?",
        answer: 4,
        explanation: "28,000 ÷ 7,000 = 4"
    },
    {
        question: "Slab 7.5 m × 4.5 m × 0.16 m. Volume (m³)?",
        answer: 5.4,
        explanation: "7.5 × 4.5 × 0.16 = 5.4 m³"
    },
    {
        question: "Capacity 7,200 kg. Truck 1,800 kg. Trucks at once?",
        answer: 4,
        explanation: "7,200 ÷ 1,800 = 4"
    },
    {
        question: "Slab 10 m × 6 m × 0.19 m. Volume (m³)?",
        answer: 11.4,
        explanation: "10 × 6 × 0.19 = 11.4 m³"
    },
    {
        question: "Bridge 16,500 kg. Truck 4,125 kg. Trucks at once?",
        answer: 4,
        explanation: "16,500 ÷ 4,125 = 4"
    },
    {
        question: "Slab 13 m × 8 m × 0.26 m. Volume (m³)?",
        answer: 27.04,
        explanation: "13 × 8 × 0.26 = 27.04 m³"
    },
    {
        question: "Capacity 13,500 kg. Truck 3,375 kg. Trucks at once?",
        answer: 4,
        explanation: "13,500 ÷ 3,375 = 4"
    }
];
// EXTREME – Terrain & Biome Adaptation (overflow, slope)
exports.extremeQuestions = [
    {
        question: "Rainfall in Coastal biome = 240 mm/week. Drainage removes 175 mm/week. Overflow (mm)?",
        answer: 65,
        explanation: "240 - 175 = 65 mm"
    },
    {
        question: "Slope ratio 1:12. Vertical rise = 2.5 m. Horizontal distance (m)?",
        answer: 30,
        explanation: "2.5 × 12 = 30 m"
    },
    {
        question: "Rainfall 320 mm/week. Drainage 235 mm/week. Overflow (mm)?",
        answer: 85,
        explanation: "320 - 235 = 85 mm"
    },
    {
        question: "Slope 1:18. Rise 2 m. Horizontal distance (m)?",
        answer: 36,
        explanation: "2 × 18 = 36 m"
    },
    {
        question: "Rainfall 175 mm. Drainage 105 mm. Overflow (mm)?",
        answer: 70,
        explanation: "175 - 105 = 70 mm"
    },
    {
        question: "Slope 1:22. Rise 1.5 m. Horizontal distance (m)?",
        answer: 33,
        explanation: "1.5 × 22 = 33 m"
    },
    {
        question: "Rainfall 265 mm/week. Drainage 190 mm. Overflow (mm)?",
        answer: 75,
        explanation: "265 - 190 = 75 mm"
    },
    {
        question: "Slope 1:10. Rise 3.5 m. Horizontal distance (m)?",
        answer: 35,
        explanation: "3.5 × 10 = 35 m"
    },
    {
        question: "Rainfall 195 mm. Drainage 130 mm. Overflow (mm)?",
        answer: 65,
        explanation: "195 - 130 = 65 mm"
    },
    {
        question: "Slope 1:14. Rise 3 m. Horizontal distance (m)?",
        answer: 42,
        explanation: "3 × 14 = 42 m"
    },
    {
        question: "Rainfall 420 mm/week. Drainage 360 mm. Overflow (mm)?",
        answer: 60,
        explanation: "420 - 360 = 60 mm"
    },
    {
        question: "Slope 1:9. Rise 2.2 m. Horizontal distance (m)?",
        answer: 19.8,
        explanation: "2.2 × 9 = 19.8 m"
    },
    {
        question: "Rainfall 140 mm. Drainage 95 mm. Overflow (mm)?",
        answer: 45,
        explanation: "140 - 95 = 45 mm"
    },
    {
        question: "Slope 1:28. Rise 2 m. Horizontal distance (m)?",
        answer: 56,
        explanation: "2 × 28 = 56 m"
    },
    {
        question: "Rainfall 310 mm. Drainage 225 mm. Overflow (mm)?",
        answer: 85,
        explanation: "310 - 225 = 85 mm"
    },
    {
        question: "Slope 1:10. Rise 4.5 m. Horizontal distance (m)?",
        answer: 45,
        explanation: "4.5 × 10 = 45 m"
    },
    {
        question: "Rainfall 380 mm. Drainage 305 mm. Overflow (mm)?",
        answer: 75,
        explanation: "380 - 305 = 75 mm"
    },
    {
        question: "Slope 1:16. Rise 3.75 m. Horizontal distance (m)?",
        answer: 60,
        explanation: "3.75 × 16 = 60 m"
    },
    {
        question: "Rainfall 230 mm. Drainage 160 mm. Overflow (mm)?",
        answer: 70,
        explanation: "230 - 160 = 70 mm"
    },
    {
        question: "Slope 1:6. Rise 2.5 m. Horizontal distance (m)?",
        answer: 15,
        explanation: "2.5 × 6 = 15 m"
    }
];
function getCivilEngineerQuestion(difficulty) {
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
//# sourceMappingURL=civil-engineer-questions.js.map