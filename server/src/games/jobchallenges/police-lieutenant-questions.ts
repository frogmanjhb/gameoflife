// Police Lieutenant – Enforcement Challenge (Compliance Review)
// 20 questions per difficulty tier. All numeric answers.

export interface PoliceLieutenantQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Fines & Totals (multiplication, addition, basic %)
export const easyQuestions: PoliceLieutenantQuestion[] = [
  { question: "8 students received a R195 fine each. Total fines collected (R)?", answer: 1560, explanation: "8 × 195 = R1,560" },
  { question: "Town has 40 students. 10 broke rules. What percentage broke rules?", answer: 25, explanation: "10 ÷ 40 × 100 = 25%" },
  { question: "5 students fined R380 each. Total fines (R)?", answer: 1900, explanation: "5 × 380 = R1,900" },
  { question: "56 students. 14 broke rules. Percentage who broke rules?", answer: 25, explanation: "14 ÷ 56 × 100 = 25%" },
  { question: "12 students received R145 fine each. Total (R)?", answer: 1740, explanation: "12 × 145 = R1,740" },
  { question: "Class of 36. 6 broke rules. What percentage?", answer: 16.67, explanation: "6 ÷ 36 × 100 ≈ 16.67%" },
  { question: "6 students fined R425 each. Total fines collected (R)?", answer: 2550, explanation: "6 × 425 = R2,550" },
  { question: "50 students. 10 broke rules. Percentage?", answer: 20, explanation: "10 ÷ 50 × 100 = 20%" },
  { question: "9 students R310 each. Total fines (R)?", answer: 2790, explanation: "9 × 310 = R2,790" },
  { question: "44 students. 11 broke rules. What percentage broke rules?", answer: 25, explanation: "11 ÷ 44 × 100 = 25%" },
  { question: "4 students fined R520 each. Total (R)?", answer: 2080, explanation: "4 × 520 = R2,080" },
  { question: "Town has 30 students. 5 broke rules. Percentage?", answer: 16.67, explanation: "5 ÷ 30 × 100 ≈ 16.67%" },
  { question: "7 students R240 each. Total fines (R)?", answer: 1680, explanation: "7 × 240 = R1,680" },
  { question: "54 students. 9 broke rules. What percentage?", answer: 16.67, explanation: "9 ÷ 54 × 100 ≈ 16.67%" },
  { question: "11 students fined R180 each. Total (R)?", answer: 1980, explanation: "11 × 180 = R1,980" },
  { question: "Class of 48. 24 broke rules. Percentage?", answer: 50, explanation: "24 ÷ 48 × 100 = 50%" },
  { question: "3 students R650 each. Total fines collected (R)?", answer: 1950, explanation: "3 × 650 = R1,950" },
  { question: "72 students. 9 broke rules. What percentage?", answer: 12.5, explanation: "9 ÷ 72 × 100 = 12.5%" },
  { question: "10 students R275 each. Total fines (R)?", answer: 2750, explanation: "10 × 275 = R2,750" },
  { question: "Town has 39 students. 13 broke rules. Percentage?", answer: 33.33, explanation: "13 ÷ 39 × 100 ≈ 33.33%" }
];

// MEDIUM – Escalating Penalties (% increases, repeated offences)
export const mediumQuestions: PoliceLieutenantQuestion[] = [
  { question: "First offence fine = R260. Second offence increases by 50%. What is second offence fine (R)?", answer: 390, explanation: "260 × 1.50 = R390" },
  { question: "A student was fined R500. If fine increases by 25% each repeat offence, what is next fine (R)?", answer: 625, explanation: "500 × 1.25 = R625" },
  { question: "First fine R350. Second offence +20%. Second fine (R)?", answer: 420, explanation: "350 × 1.20 = R420" },
  { question: "Fine R600. Repeat offence +15%. Next fine (R)?", answer: 690, explanation: "600 × 1.15 = R690" },
  { question: "First offence R180. Second +100%. Second fine (R)?", answer: 360, explanation: "180 × 2.00 = R360" },
  { question: "Fine R750. +10% for repeat. Next fine (R)?", answer: 825, explanation: "750 × 1.10 = R825" },
  { question: "First R420. Second +25%. Second fine (R)?", answer: 525, explanation: "420 × 1.25 = R525" },
  { question: "Fine R480. +20% repeat. Next fine (R)?", answer: 576, explanation: "480 × 1.20 = R576" },
  { question: "First offence R190. Second +50%. Second fine (R)?", answer: 285, explanation: "190 × 1.50 = R285" },
  { question: "Fine R820. +12% each repeat. Next fine (R)?", answer: 918.4, explanation: "820 × 1.12 = R918.40" },
  { question: "First R310. Second +40%. Second fine (R)?", answer: 434, explanation: "310 × 1.40 = R434" },
  { question: "Fine R560. +18% for repeat. Next fine (R)?", answer: 660.8, explanation: "560 × 1.18 = R660.80" },
  { question: "First offence R440. Second +50%. Second fine (R)?", answer: 660, explanation: "440 × 1.50 = R660" },
  { question: "Fine R670. +15% repeat. Next fine (R)?", answer: 770.5, explanation: "670 × 1.15 = R770.50" },
  { question: "First R200. Second +75%. Second fine (R)?", answer: 350, explanation: "200 × 1.75 = R350" },
  { question: "Fine R890. +10% for repeat. Next fine (R)?", answer: 979, explanation: "890 × 1.10 = R979" },
  { question: "First offence R380. Second +20%. Second fine (R)?", answer: 456, explanation: "380 × 1.20 = R456" },
  { question: "Fine R520. +25% repeat. Next fine (R)?", answer: 650, explanation: "520 × 1.25 = R650" },
  { question: "First R290. Second +50%. Second fine (R)?", answer: 435, explanation: "290 × 1.50 = R435" },
  { question: "Fine R740. +20% for repeat. Next fine (R)?", answer: 888, explanation: "740 × 1.20 = R888" }
];

// HARD – Compliance Analysis (compliance rate, trends, multi-step)
export const hardQuestions: PoliceLieutenantQuestion[] = [
  { question: "Week 1: 8 fines. Week 2: 6 fines. Week 3: 10 fines. What is average fines per week?", answer: 8, explanation: "(8+6+10) ÷ 3 ≈ 8" },
  { question: "Compliance improved from 72% to 88%. What is the percentage point increase in compliance?", answer: 16, explanation: "88 − 72 = 16 percentage points" },
  { question: "Fines: 5, 8, 6, 9 per week. Average fines per week?", answer: 7, explanation: "(5+8+6+9) ÷ 4 = 7" },
  { question: "Compliance went from 65% to 80%. Percentage point increase?", answer: 15, explanation: "80 − 65 = 15" },
  { question: "Week 1: 12 fines, Week 2: 9, Week 3: 15. Average?", answer: 12, explanation: "(12+9+15) ÷ 3 = 12" },
  { question: "Compliance 78% to 90%. Percentage point increase?", answer: 12, explanation: "90 − 78 = 12" },
  { question: "Fines per week: 4, 7, 5, 6, 8. Average?", answer: 6, explanation: "30 ÷ 5 = 6" },
  { question: "Compliance from 88% to 94%. Percentage point increase?", answer: 6, explanation: "94 − 88 = 6" },
  { question: "Weeks: 10, 14, 11 fines. Average fines per week?", answer: 11.67, explanation: "(10+14+11) ÷ 3 ≈ 11.67" },
  { question: "Compliance 70% to 85%. Percentage point increase?", answer: 15, explanation: "85 − 70 = 15" },
  { question: "Fines: 6, 8, 7, 9. Average?", answer: 7.5, explanation: "(6+8+7+9) ÷ 4 = 7.5" },
  { question: "Compliance 82% to 91%. Percentage point increase?", answer: 9, explanation: "91 − 82 = 9" },
  { question: "Week 1: 15, Week 2: 11, Week 3: 13. Average fines?", answer: 13, explanation: "(15+11+13) ÷ 3 = 13" },
  { question: "Compliance 75% to 90%. Percentage point increase?", answer: 15, explanation: "90 − 75 = 15" },
  { question: "Fines per week: 7, 5, 9, 6, 8. Average?", answer: 7, explanation: "35 ÷ 5 = 7" },
  { question: "Compliance 90% to 96%. Percentage point increase?", answer: 6, explanation: "96 − 90 = 6" },
  { question: "Weeks: 16, 12, 14 fines. Average?", answer: 14, explanation: "(16+12+14) ÷ 3 = 14" },
  { question: "Compliance 67% to 85%. Percentage point increase?", answer: 18, explanation: "85 − 67 = 18" },
  { question: "Fines: 4, 9, 6, 7, 8. Average per week?", answer: 6.8, explanation: "34 ÷ 5 = 6.8" },
  { question: "Compliance 84% to 97%. Percentage point increase?", answer: 13, explanation: "97 − 84 = 13" }
];

// EXTREME – Policy Impact Modelling (modelling outcomes, proportional enforcement)
export const extremeQuestions: PoliceLieutenantQuestion[] = [
  { question: "Town has 48 workers. 16 break a rule. If fines reduce rule-breaking by 35% next week, how many break rules?", answer: 10.4, explanation: "16 × (1 − 0.35) = 10.4" },
  { question: "Fines collected total R15,000. 22% goes to disaster fund. How much is allocated (R)?", answer: 3300, explanation: "15,000 × 0.22 = R3,300" },
  { question: "42 workers. 14 broke rules. Fines reduce by 30%. How many break rules next week?", answer: 9.8, explanation: "14 × 0.70 = 9.8" },
  { question: "R19,500 fines. 18% to disaster fund. Allocation (R)?", answer: 3510, explanation: "19,500 × 0.18 = R3,510" },
  { question: "35 workers. 10 break rules. 40% reduction. How many break rules?", answer: 6, explanation: "10 × 0.60 = 6" },
  { question: "R8,200 collected. 15% to fund. How much (R)?", answer: 1230, explanation: "8,200 × 0.15 = R1,230" },
  { question: "55 workers. 22 broke rules. Fines reduce by 25%. How many next week?", answer: 16.5, explanation: "22 × 0.75 = 16.5" },
  { question: "Fines R24,000. 28% to disaster fund. Allocation (R)?", answer: 6720, explanation: "24,000 × 0.28 = R6,720" },
  { question: "Town 40 workers. 12 break rule. 50% reduction. How many break rules?", answer: 6, explanation: "12 × 0.50 = 6" },
  { question: "R14,500 fines. 20% to fund. How much (R)?", answer: 2900, explanation: "14,500 × 0.20 = R2,900" },
  { question: "33 workers. 9 break rules. 45% reduction. How many next week?", answer: 4.95, explanation: "9 × 0.55 = 4.95" },
  { question: "R10,800 collected. 30% to disaster fund. Allocation (R)?", answer: 3240, explanation: "10,800 × 0.30 = R3,240" },
  { question: "62 workers. 25 broke rules. 32% reduction. How many?", answer: 17, explanation: "25 × 0.68 = 17" },
  { question: "Fines R17,600. 25% to fund. How much (R)?", answer: 4400, explanation: "17,600 × 0.25 = R4,400" },
  { question: "Town 50 workers. 20 break rule. 35% reduction. How many?", answer: 13, explanation: "20 × 0.65 = 13" },
  { question: "R12,400 fines. 17% to disaster fund. Allocation (R)?", answer: 2108, explanation: "12,400 × 0.17 = R2,108" },
  { question: "37 workers. 13 broke rules. 42% reduction. How many next week?", answer: 7.54, explanation: "13 × 0.58 = 7.54" },
  { question: "R20,500 collected. 21% to fund. How much (R)?", answer: 4305, explanation: "20,500 × 0.21 = R4,305" },
  { question: "29 workers. 8 break rules. 55% reduction. How many?", answer: 3.6, explanation: "8 × 0.45 = 3.6" },
  { question: "Fines R9,500. 24% to disaster fund. Allocation (R)?", answer: 2280, explanation: "9,500 × 0.24 = R2,280" }
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
