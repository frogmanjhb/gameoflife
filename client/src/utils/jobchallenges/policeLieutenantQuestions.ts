// Police Lieutenant – Enforcement Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface PoliceLieutenantQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Fines & Totals (multiplication, addition, basic %)
const easyQuestions: PoliceLieutenantQuestion[] = [
  { question: "6 students received a R175 fine each. Total fines collected (R)?", answer: 1050, explanation: "6 × 175 = R1,050" },
  { question: "Town has 36 students. 9 broke rules. What percentage broke rules?", answer: 25, explanation: "9 ÷ 36 × 100 = 25%" },
  { question: "7 students fined R220 each. Total fines (R)?", answer: 1540, explanation: "7 × 220 = R1,540" },
  { question: "48 students. 12 broke rules. Percentage who broke rules?", answer: 25, explanation: "12 ÷ 48 × 100 = 25%" },
  { question: "9 students received R125 fine each. Total (R)?", answer: 1125, explanation: "9 × 125 = R1,125" },
  { question: "Class of 32. 4 broke rules. What percentage?", answer: 12.5, explanation: "4 ÷ 32 × 100 = 12.5%" },
  { question: "4 students fined R375 each. Total fines collected (R)?", answer: 1500, explanation: "4 × 375 = R1,500" },
  { question: "45 students. 9 broke rules. Percentage?", answer: 20, explanation: "9 ÷ 45 × 100 = 20%" },
  { question: "11 students R280 each. Total fines (R)?", answer: 3080, explanation: "11 × 280 = R3,080" },
  { question: "55 students. 11 broke rules. What percentage broke rules?", answer: 20, explanation: "11 ÷ 55 × 100 = 20%" },
  { question: "3 students fined R420 each. Total (R)?", answer: 1260, explanation: "3 × 420 = R1,260" },
  { question: "Town has 27 students. 6 broke rules. Percentage?", answer: 22.22, explanation: "6 ÷ 27 × 100 ≈ 22.22%" },
  { question: "8 students R165 each. Total fines (R)?", answer: 1320, explanation: "8 × 165 = R1,320" },
  { question: "42 students. 7 broke rules. What percentage?", answer: 16.67, explanation: "7 ÷ 42 × 100 ≈ 16.67%" },
  { question: "12 students fined R95 each. Total (R)?", answer: 1140, explanation: "12 × 95 = R1,140" },
  { question: "Class of 38. 19 broke rules. Percentage?", answer: 50, explanation: "19 ÷ 38 × 100 = 50%" },
  { question: "5 students R340 each. Total fines collected (R)?", answer: 1700, explanation: "5 × 340 = R1,700" },
  { question: "64 students. 8 broke rules. What percentage?", answer: 12.5, explanation: "8 ÷ 64 × 100 = 12.5%" },
  { question: "10 students R210 each. Total fines (R)?", answer: 2100, explanation: "10 × 210 = R2,100" },
  { question: "Town has 33 students. 11 broke rules. Percentage?", answer: 33.33, explanation: "11 ÷ 33 × 100 ≈ 33.33%" }
];

// MEDIUM – Escalating Penalties (% increases, repeated offences)
const mediumQuestions: PoliceLieutenantQuestion[] = [
  { question: "First offence fine = R240. Second offence increases by 50%. What is second offence fine (R)?", answer: 360, explanation: "240 × 1.50 = R360" },
  { question: "A student was fined R450. If fine increases by 20% each repeat offence, what is next fine (R)?", answer: 540, explanation: "450 × 1.20 = R540" },
  { question: "First fine R320. Second offence +25%. Second fine (R)?", answer: 400, explanation: "320 × 1.25 = R400" },
  { question: "Fine R550. Repeat offence +15%. Next fine (R)?", answer: 632.5, explanation: "550 × 1.15 = R632.50" },
  { question: "First offence R210. Second +80%. Second fine (R)?", answer: 378, explanation: "210 × 1.80 = R378" },
  { question: "Fine R680. +12% for repeat. Next fine (R)?", answer: 761.6, explanation: "680 × 1.12 = R761.60" },
  { question: "First R275. Second +40%. Second fine (R)?", answer: 385, explanation: "275 × 1.40 = R385" },
  { question: "Fine R390. +35% repeat. Next fine (R)?", answer: 526.5, explanation: "390 × 1.35 = R526.50" },
  { question: "First offence R165. Second +60%. Second fine (R)?", answer: 264, explanation: "165 × 1.60 = R264" },
  { question: "Fine R720. +10% each repeat. Next fine (R)?", answer: 792, explanation: "720 × 1.10 = R792" },
  { question: "First R340. Second +30%. Second fine (R)?", answer: 442, explanation: "340 × 1.30 = R442" },
  { question: "Fine R480. +22% for repeat. Next fine (R)?", answer: 585.6, explanation: "480 × 1.22 = R585.60" },
  { question: "First offence R410. Second +70%. Second fine (R)?", answer: 697, explanation: "410 × 1.70 = R697" },
  { question: "Fine R590. +18% repeat. Next fine (R)?", answer: 696.2, explanation: "590 × 1.18 = R696.20" },
  { question: "First R295. Second +55%. Second fine (R)?", answer: 457.25, explanation: "295 × 1.55 = R457.25" },
  { question: "Fine R640. +28% for repeat. Next fine (R)?", answer: 819.2, explanation: "640 × 1.28 = R819.20" },
  { question: "First offence R225. Second +45%. Second fine (R)?", answer: 326.25, explanation: "225 × 1.45 = R326.25" },
  { question: "Fine R510. +16% repeat. Next fine (R)?", answer: 591.6, explanation: "510 × 1.16 = R591.60" },
  { question: "First R360. Second +33%. Second fine (R)?", answer: 478.8, explanation: "360 × 1.33 = R478.80" },
  { question: "Fine R780. +14% for repeat. Next fine (R)?", answer: 889.2, explanation: "780 × 1.14 = R889.20" }
];

// HARD – Compliance Analysis (compliance rate, trends, multi-step)
const hardQuestions: PoliceLieutenantQuestion[] = [
  { question: "Week 1: 7 fines. Week 2: 5 fines. Week 3: 9 fines. What is average fines per week?", answer: 7, explanation: "(7+5+9) ÷ 3 ≈ 7" },
  { question: "Compliance improved from 74% to 89%. What is the percentage point increase in compliance?", answer: 15, explanation: "89 − 74 = 15 percentage points" },
  { question: "Fines: 6, 9, 5, 8 per week. Average fines per week?", answer: 7, explanation: "(6+9+5+8) ÷ 4 = 7" },
  { question: "Compliance went from 68% to 84%. Percentage point increase?", answer: 16, explanation: "84 − 68 = 16" },
  { question: "Week 1: 11 fines, Week 2: 8, Week 3: 10. Average?", answer: 9.67, explanation: "(11+8+10) ÷ 3 ≈ 9.67" },
  { question: "Compliance 62% to 79%. Percentage point increase?", answer: 17, explanation: "79 − 62 = 17" },
  { question: "Fines per week: 4, 6, 7, 5, 8. Average?", answer: 6, explanation: "30 ÷ 5 = 6" },
  { question: "Compliance from 91% to 97%. Percentage point increase?", answer: 6, explanation: "97 − 91 = 6" },
  { question: "Weeks: 12, 9, 15 fines. Average fines per week?", answer: 12, explanation: "(12+9+15) ÷ 3 = 12" },
  { question: "Compliance 77% to 92%. Percentage point increase?", answer: 15, explanation: "92 − 77 = 15" },
  { question: "Fines: 3, 8, 6, 7. Average?", answer: 6, explanation: "(3+8+6+7) ÷ 4 = 6" },
  { question: "Compliance 86% to 95%. Percentage point increase?", answer: 9, explanation: "95 − 86 = 9" },
  { question: "Week 1: 14, Week 2: 10, Week 3: 13. Average fines?", answer: 12.33, explanation: "(14+10+13) ÷ 3 ≈ 12.33" },
  { question: "Compliance 71% to 86%. Percentage point increase?", answer: 15, explanation: "86 − 71 = 15" },
  { question: "Fines per week: 9, 6, 8, 11, 6. Average?", answer: 8, explanation: "40 ÷ 5 = 8" },
  { question: "Compliance 93% to 98%. Percentage point increase?", answer: 5, explanation: "98 − 93 = 5" },
  { question: "Weeks: 13, 11, 12 fines. Average?", answer: 12, explanation: "(13+11+12) ÷ 3 = 12" },
  { question: "Compliance 69% to 87%. Percentage point increase?", answer: 18, explanation: "87 − 69 = 18" },
  { question: "Fines: 5, 7, 6, 9, 8. Average per week?", answer: 7, explanation: "35 ÷ 5 = 7" },
  { question: "Compliance 83% to 96%. Percentage point increase?", answer: 13, explanation: "96 − 83 = 13" }
];

// EXTREME – Policy Impact Modelling (modelling outcomes, proportional enforcement)
const extremeQuestions: PoliceLieutenantQuestion[] = [
  { question: "Town has 50 workers. 15 break a rule. If fines reduce rule-breaking by 40% next week, how many break rules?", answer: 9, explanation: "15 × (1 − 0.40) = 9" },
  { question: "Fines collected total R12,500. 24% goes to disaster fund. How much is allocated (R)?", answer: 3000, explanation: "12,500 × 0.24 = R3,000" },
  { question: "45 workers. 18 broke rules. Fines reduce by 25%. How many break rules next week?", answer: 13.5, explanation: "18 × 0.75 = 13.5" },
  { question: "R18,000 fines. 20% to disaster fund. Allocation (R)?", answer: 3600, explanation: "18,000 × 0.20 = R3,600" },
  { question: "38 workers. 12 break rules. 35% reduction. How many break rules?", answer: 7.8, explanation: "12 × 0.65 = 7.8" },
  { question: "R7,500 collected. 16% to fund. How much (R)?", answer: 1200, explanation: "7,500 × 0.16 = R1,200" },
  { question: "52 workers. 20 broke rules. Fines reduce by 30%. How many next week?", answer: 14, explanation: "20 × 0.70 = 14" },
  { question: "Fines R22,000. 32% to disaster fund. Allocation (R)?", answer: 7040, explanation: "22,000 × 0.32 = R7,040" },
  { question: "Town 44 workers. 11 break rule. 45% reduction. How many break rules?", answer: 6.05, explanation: "11 × 0.55 = 6.05" },
  { question: "R16,000 fines. 12% to fund. How much (R)?", answer: 1920, explanation: "16,000 × 0.12 = R1,920" },
  { question: "36 workers. 9 break rules. 55% reduction. How many next week?", answer: 4.05, explanation: "9 × 0.45 = 4.05" },
  { question: "R9,600 collected. 35% to disaster fund. Allocation (R)?", answer: 3360, explanation: "9,600 × 0.35 = R3,360" },
  { question: "58 workers. 22 broke rules. 28% reduction. How many?", answer: 15.84, explanation: "22 × 0.72 = 15.84" },
  { question: "Fines R21,500. 26% to fund. How much (R)?", answer: 5590, explanation: "21,500 × 0.26 = R5,590" },
  { question: "Town 47 workers. 14 break rule. 50% reduction. How many?", answer: 7, explanation: "14 × 0.50 = 7" },
  { question: "R11,200 fines. 19% to disaster fund. Allocation (R)?", answer: 2128, explanation: "11,200 × 0.19 = R2,128" },
  { question: "41 workers. 16 broke rules. 38% reduction. How many next week?", answer: 9.92, explanation: "16 × 0.62 = 9.92" },
  { question: "R13,800 collected. 23% to fund. How much (R)?", answer: 3174, explanation: "13,800 × 0.23 = R3,174" },
  { question: "28 workers. 7 break rules. 65% reduction. How many?", answer: 2.45, explanation: "7 × 0.35 = 2.45" },
  { question: "Fines R8,400. 14% to disaster fund. Allocation (R)?", answer: 1176, explanation: "8,400 × 0.14 = R1,176" }
];

export function getPoliceLieutenantQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): PoliceLieutenantQuestion {
  let questions: PoliceLieutenantQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
