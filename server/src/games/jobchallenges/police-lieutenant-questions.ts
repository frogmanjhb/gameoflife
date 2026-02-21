// Police Lieutenant – Enforcement Challenge (Compliance Review)
// 20 questions per difficulty tier. All numeric answers.

export interface PoliceLieutenantQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Fines & Totals (multiplication, addition, basic %)
export const easyQuestions: PoliceLieutenantQuestion[] = [
  { question: "5 students received a R200 fine each. Total fines collected (R)?", answer: 1000, explanation: "5 × 200 = R1,000" },
  { question: "Town has 25 students. 3 broke rules. What percentage broke rules?", answer: 12, explanation: "3 ÷ 25 × 100 = 12%" },
  { question: "4 students fined R150 each. Total fines (R)?", answer: 600, explanation: "4 × 150 = R600" },
  { question: "30 students. 6 broke rules. Percentage who broke rules?", answer: 20, explanation: "6 ÷ 30 × 100 = 20%" },
  { question: "8 students received R100 fine each. Total (R)?", answer: 800, explanation: "8 × 100 = R800" },
  { question: "Class of 20. 5 broke rules. What percentage?", answer: 25, explanation: "5 ÷ 20 × 100 = 25%" },
  { question: "3 students fined R250 each. Total fines collected (R)?", answer: 750, explanation: "3 × 250 = R750" },
  { question: "40 students. 8 broke rules. Percentage?", answer: 20, explanation: "8 ÷ 40 × 100 = 20%" },
  { question: "6 students R300 each. Total fines (R)?", answer: 1800, explanation: "6 × 300 = R1,800" },
  { question: "50 students. 10 broke rules. What percentage broke rules?", answer: 20, explanation: "10 ÷ 50 × 100 = 20%" },
  { question: "2 students fined R500 each. Total (R)?", answer: 1000, explanation: "2 × 500 = R1,000" },
  { question: "Town has 24 students. 4 broke rules. Percentage?", answer: 16.67, explanation: "4 ÷ 24 × 100 ≈ 16.67%" },
  { question: "7 students R120 each. Total fines (R)?", answer: 840, explanation: "7 × 120 = R840" },
  { question: "35 students. 7 broke rules. What percentage?", answer: 20, explanation: "7 ÷ 35 × 100 = 20%" },
  { question: "10 students fined R80 each. Total (R)?", answer: 800, explanation: "10 × 80 = R800" },
  { question: "Class of 28. 7 broke rules. Percentage?", answer: 25, explanation: "7 ÷ 28 × 100 = 25%" },
  { question: "9 students R400 each. Total fines collected (R)?", answer: 3600, explanation: "9 × 400 = R3,600" },
  { question: "60 students. 9 broke rules. What percentage?", answer: 15, explanation: "9 ÷ 60 × 100 = 15%" },
  { question: "5 students R180 each. Total fines (R)?", answer: 900, explanation: "5 × 180 = R900" },
  { question: "Town has 32 students. 8 broke rules. Percentage?", answer: 25, explanation: "8 ÷ 32 × 100 = 25%" }
];

// MEDIUM – Escalating Penalties (% increases, repeated offences)
export const mediumQuestions: PoliceLieutenantQuestion[] = [
  { question: "First offence fine = R300. Second offence increases by 50%. What is second offence fine (R)?", answer: 450, explanation: "300 × 1.50 = R450" },
  { question: "A student was fined R500. If fine increases by 10% each repeat offence, what is next fine (R)?", answer: 550, explanation: "500 × 1.10 = R550" },
  { question: "First fine R200. Second offence +25%. Second fine (R)?", answer: 250, explanation: "200 × 1.25 = R250" },
  { question: "Fine R400. Repeat offence +20%. Next fine (R)?", answer: 480, explanation: "400 × 1.20 = R480" },
  { question: "First offence R150. Second +100%. Second fine (R)?", answer: 300, explanation: "150 × 2 = R300" },
  { question: "Fine R600. +15% for repeat. Next fine (R)?", answer: 690, explanation: "600 × 1.15 = R690" },
  { question: "First R250. Second +40%. Second fine (R)?", answer: 350, explanation: "250 × 1.40 = R350" },
  { question: "Fine R350. +30% repeat. Next fine (R)?", answer: 455, explanation: "350 × 1.30 = R455" },
  { question: "First offence R180. Second +50%. Second fine (R)?", answer: 270, explanation: "180 × 1.50 = R270" },
  { question: "Fine R800. +10% each repeat. Next fine (R)?", answer: 880, explanation: "800 × 1.10 = R880" },
  { question: "First R220. Second +25%. Second fine (R)?", answer: 275, explanation: "220 × 1.25 = R275" },
  { question: "Fine R450. +20% for repeat. Next fine (R)?", answer: 540, explanation: "450 × 1.20 = R540" },
  { question: "First offence R320. Second +75%. Second fine (R)?", answer: 560, explanation: "320 × 1.75 = R560" },
  { question: "Fine R550. +12% repeat. Next fine (R)?", answer: 616, explanation: "550 × 1.12 = R616" },
  { question: "First R280. Second +60%. Second fine (R)?", answer: 448, explanation: "280 × 1.60 = R448" },
  { question: "Fine R700. +25% for repeat. Next fine (R)?", answer: 875, explanation: "700 × 1.25 = R875" },
  { question: "First offence R190. Second +45%. Second fine (R)?", answer: 275.5, explanation: "190 × 1.45 = R275.50" },
  { question: "Fine R380. +18% repeat. Next fine (R)?", answer: 448.4, explanation: "380 × 1.18 = R448.40" },
  { question: "First R260. Second +35%. Second fine (R)?", answer: 351, explanation: "260 × 1.35 = R351" },
  { question: "Fine R620. +15% for repeat. Next fine (R)?", answer: 713, explanation: "620 × 1.15 = R713" }
];

// HARD – Compliance Analysis (compliance rate, trends, multi-step)
export const hardQuestions: PoliceLieutenantQuestion[] = [
  { question: "Week 1: 4 fines. Week 2: 6 fines. Week 3: 3 fines. What is average fines per week?", answer: 4.33, explanation: "(4+6+3) ÷ 3 ≈ 4.33" },
  { question: "Compliance improved from 80% to 92%. What is the percentage point increase in compliance?", answer: 12, explanation: "92 − 80 = 12 percentage points" },
  { question: "Fines: 5, 7, 4, 6 per week. Average fines per week?", answer: 5.5, explanation: "(5+7+4+6) ÷ 4 = 5.5" },
  { question: "Compliance went from 70% to 85%. Percentage point increase?", answer: 15, explanation: "85 − 70 = 15" },
  { question: "Week 1: 8 fines, Week 2: 5, Week 3: 7. Average?", answer: 6.67, explanation: "(8+5+7) ÷ 3 ≈ 6.67" },
  { question: "Compliance 60% to 78%. Percentage point increase?", answer: 18, explanation: "78 − 60 = 18" },
  { question: "Fines per week: 3, 4, 5, 3, 5. Average?", answer: 4, explanation: "20 ÷ 5 = 4" },
  { question: "Compliance from 88% to 95%. Percentage point increase?", answer: 7, explanation: "95 − 88 = 7" },
  { question: "Weeks: 10, 8, 12 fines. Average fines per week?", answer: 10, explanation: "(10+8+12) ÷ 3 = 10" },
  { question: "Compliance 75% to 90%. Percentage point increase?", answer: 15, explanation: "90 − 75 = 15" },
  { question: "Fines: 2, 6, 4, 8. Average?", answer: 5, explanation: "(2+6+4+8) ÷ 4 = 5" },
  { question: "Compliance 82% to 94%. Percentage point increase?", answer: 12, explanation: "94 − 82 = 12" },
  { question: "Week 1: 9, Week 2: 6, Week 3: 9. Average fines?", answer: 8, explanation: "(9+6+9) ÷ 3 = 8" },
  { question: "Compliance 65% to 80%. Percentage point increase?", answer: 15, explanation: "80 − 65 = 15" },
  { question: "Fines per week: 7, 5, 6, 8, 4. Average?", answer: 6, explanation: "30 ÷ 5 = 6" },
  { question: "Compliance 90% to 96%. Percentage point increase?", answer: 6, explanation: "96 − 90 = 6" },
  { question: "Weeks: 11, 9, 10 fines. Average?", answer: 10, explanation: "(11+9+10) ÷ 3 = 10" },
  { question: "Compliance 72% to 88%. Percentage point increase?", answer: 16, explanation: "88 − 72 = 16" },
  { question: "Fines: 4, 5, 4, 6, 6. Average per week?", answer: 5, explanation: "25 ÷ 5 = 5" },
  { question: "Compliance 85% to 97%. Percentage point increase?", answer: 12, explanation: "97 − 85 = 12" }
];

// EXTREME – Policy Impact Modelling (modelling outcomes, proportional enforcement)
export const extremeQuestions: PoliceLieutenantQuestion[] = [
  { question: "Town has 40 workers. 10 break a rule. If fines reduce rule-breaking by 30% next week, how many break rules?", answer: 7, explanation: "10 × (1 − 0.30) = 7" },
  { question: "Fines collected total R10,000. 20% goes to disaster fund. How much is allocated (R)?", answer: 2000, explanation: "10,000 × 0.20 = R2,000" },
  { question: "50 workers. 15 broke rules. Fines reduce by 20%. How many break rules next week?", answer: 12, explanation: "15 × 0.80 = 12" },
  { question: "R15,000 fines. 25% to disaster fund. Allocation (R)?", answer: 3750, explanation: "15,000 × 0.25 = R3,750" },
  { question: "30 workers. 9 break rules. 40% reduction. How many break rules?", answer: 5.4, explanation: "9 × 0.60 = 5.4 → 5 (whole people) or answer 5.4 for exact" },
  { question: "R8,000 collected. 15% to fund. How much (R)?", answer: 1200, explanation: "8,000 × 0.15 = R1,200" },
  { question: "60 workers. 18 broke rules. Fines reduce by 25%. How many next week?", answer: 13.5, explanation: "18 × 0.75 = 13.5" },
  { question: "Fines R12,000. 30% to disaster fund. Allocation (R)?", answer: 3600, explanation: "12,000 × 0.30 = R3,600" },
  { question: "Town 45 workers. 12 break rule. 35% reduction. How many break rules?", answer: 7.8, explanation: "12 × 0.65 = 7.8" },
  { question: "R20,000 fines. 10% to fund. How much (R)?", answer: 2000, explanation: "20,000 × 0.10 = R2,000" },
  { question: "40 workers. 8 break rules. 50% reduction. How many next week?", answer: 4, explanation: "8 × 0.50 = 4" },
  { question: "R5,000 collected. 40% to disaster fund. Allocation (R)?", answer: 2000, explanation: "5,000 × 0.40 = R2,000" },
  { question: "35 workers. 14 broke rules. 25% reduction. How many?", answer: 10.5, explanation: "14 × 0.75 = 10.5" },
  { question: "Fines R18,000. 22% to fund. How much (R)?", answer: 3960, explanation: "18,000 × 0.22 = R3,960" },
  { question: "Town 55 workers. 11 break rule. 45% reduction. How many?", answer: 6.05, explanation: "11 × 0.55 = 6.05" },
  { question: "R9,000 fines. 18% to disaster fund. Allocation (R)?", answer: 1620, explanation: "9,000 × 0.18 = R1,620" },
  { question: "48 workers. 16 broke rules. 30% reduction. How many next week?", answer: 11.2, explanation: "16 × 0.70 = 11.2" },
  { question: "R14,000 collected. 28% to fund. How much (R)?", answer: 3920, explanation: "14,000 × 0.28 = R3,920" },
  { question: "25 workers. 5 break rules. 60% reduction. How many?", answer: 2, explanation: "5 × 0.40 = 2" },
  { question: "Fines R6,000. 12% to disaster fund. Allocation (R)?", answer: 720, explanation: "6,000 × 0.12 = R720" }
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
