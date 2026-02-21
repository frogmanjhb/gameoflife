// Lawyer – Legal Reasoning Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface LawyerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: LawyerQuestion[] = [
  { question: "A business earned R6,000. 3 partners share equally. How much each (R)?", answer: 2000, explanation: "6,000 ÷ 3 = R2,000" },
  { question: "A fine of R500 is reduced by 20%. What is the new fine (R)?", answer: 400, explanation: "500 × 0.80 = R400" },
  { question: "R4,500 profit. 5 partners share equally. Each gets (R)?", answer: 900, explanation: "4,500 ÷ 5 = R900" },
  { question: "Fine R800 reduced by 25%. New fine (R)?", answer: 600, explanation: "800 × 0.75 = R600" },
  { question: "R9,000 to split between 4 people. How much each (R)?", answer: 2250, explanation: "9,000 ÷ 4 = R2,250" },
  { question: "Fine R1,000 reduced by 10%. New fine (R)?", answer: 900, explanation: "1,000 × 0.90 = R900" },
  { question: "R3,600 shared by 6 equally. Each (R)?", answer: 600, explanation: "3,600 ÷ 6 = R600" },
  { question: "Fine R600 reduced by 15%. New fine (R)?", answer: 510, explanation: "600 × 0.85 = R510" },
  { question: "R12,000. 4 partners. How much each (R)?", answer: 3000, explanation: "12,000 ÷ 4 = R3,000" },
  { question: "Fine R400 reduced by 30%. New fine (R)?", answer: 280, explanation: "400 × 0.70 = R280" },
  { question: "R2,400 profit. 3 share equally. Each (R)?", answer: 800, explanation: "2,400 ÷ 3 = R800" },
  { question: "Fine R750 reduced by 20%. New fine (R)?", answer: 600, explanation: "750 × 0.80 = R600" },
  { question: "R7,200. 8 people. How much each (R)?", answer: 900, explanation: "7,200 ÷ 8 = R900" },
  { question: "Fine R900 reduced by 25%. New fine (R)?", answer: 675, explanation: "900 × 0.75 = R675" },
  { question: "R5,000 shared by 5. Each gets (R)?", answer: 1000, explanation: "5,000 ÷ 5 = R1,000" },
  { question: "Fine R350 reduced by 10%. New fine (R)?", answer: 315, explanation: "350 × 0.90 = R315" },
  { question: "R8,400. 6 partners. How much each (R)?", answer: 1400, explanation: "8,400 ÷ 6 = R1,400" },
  { question: "Fine R1,200 reduced by 15%. New fine (R)?", answer: 1020, explanation: "1,200 × 0.85 = R1,020" },
  { question: "R1,800. 3 share equally. Each (R)?", answer: 600, explanation: "1,800 ÷ 3 = R600" },
  { question: "Fine R250 reduced by 40%. New fine (R)?", answer: 150, explanation: "250 × 0.60 = R150" }
];

const mediumQuestions: LawyerQuestion[] = [
  { question: "Contract: Late payment penalty = 10% of amount owed. Amount owed = R2,000. Penalty (R)?", answer: 200, explanation: "2,000 × 0.10 = R200" },
  { question: "Land contract requires 15% deposit on R10,000. Deposit amount (R)?", answer: 1500, explanation: "10,000 × 0.15 = R1,500" },
  { question: "Penalty 12% of R3,000 owed. Penalty (R)?", answer: 360, explanation: "3,000 × 0.12 = R360" },
  { question: "Contract: 20% deposit on R8,000. Deposit (R)?", answer: 1600, explanation: "8,000 × 0.20 = R1,600" },
  { question: "Late fee 5% of R4,000. Late fee (R)?", answer: 200, explanation: "4,000 × 0.05 = R200" },
  { question: "Deposit 25% on R12,000. Deposit (R)?", answer: 3000, explanation: "12,000 × 0.25 = R3,000" },
  { question: "Penalty 8% of R5,000. Penalty (R)?", answer: 400, explanation: "5,000 × 0.08 = R400" },
  { question: "Contract: 10% deposit on R6,000. Deposit (R)?", answer: 600, explanation: "6,000 × 0.10 = R600" },
  { question: "Late payment 15% of R1,500. Penalty (R)?", answer: 225, explanation: "1,500 × 0.15 = R225" },
  { question: "Deposit 18% on R9,000. Deposit (R)?", answer: 1620, explanation: "9,000 × 0.18 = R1,620" },
  { question: "Penalty 6% of R7,000. Penalty (R)?", answer: 420, explanation: "7,000 × 0.06 = R420" },
  { question: "Contract: 12% deposit on R15,000. Deposit (R)?", answer: 1800, explanation: "15,000 × 0.12 = R1,800" },
  { question: "Late fee 9% of R2,500. Late fee (R)?", answer: 225, explanation: "2,500 × 0.09 = R225" },
  { question: "Deposit 22% on R11,000. Deposit (R)?", answer: 2420, explanation: "11,000 × 0.22 = R2,420" },
  { question: "Penalty 11% of R4,500. Penalty (R)?", answer: 495, explanation: "4,500 × 0.11 = R495" },
  { question: "Contract: 16% deposit on R7,500. Deposit (R)?", answer: 1200, explanation: "7,500 × 0.16 = R1,200" },
  { question: "Late payment 7% of R6,500. Penalty (R)?", answer: 455, explanation: "6,500 × 0.07 = R455" },
  { question: "Deposit 14% on R14,000. Deposit (R)?", answer: 1960, explanation: "14,000 × 0.14 = R1,960" },
  { question: "Penalty 13% of R3,200. Penalty (R)?", answer: 416, explanation: "3,200 × 0.13 = R416" },
  { question: "Contract: 30% deposit on R5,500. Deposit (R)?", answer: 1650, explanation: "5,500 × 0.30 = R1,650" }
];

const hardQuestions: LawyerQuestion[] = [
  { question: "Student A caused R2,000 damage. Student B caused R4,000 damage. Penalty is 25% of damage. What does Student A pay (R)?", answer: 500, explanation: "2,000 × 0.25 = R500" },
  { question: "Student A R2,000 damage. Student B R4,000 damage. Penalty 25%. What does Student B pay (R)?", answer: 1000, explanation: "4,000 × 0.25 = R1,000" },
  { question: "Fine doubles after second offence. First fine = R300. Second fine (R)?", answer: 600, explanation: "300 × 2 = R600" },
  { question: "Damage R3,000. Penalty 20%. What is paid (R)?", answer: 600, explanation: "3,000 × 0.20 = R600" },
  { question: "First fine R250. Second offence doubles. Second fine (R)?", answer: 500, explanation: "250 × 2 = R500" },
  { question: "Student A R1,500 damage, Student B R3,000. Penalty 30%. What does A pay (R)?", answer: 450, explanation: "1,500 × 0.30 = R450" },
  { question: "Student A R1,500 damage, Student B R3,000. Penalty 30%. What does B pay (R)?", answer: 900, explanation: "3,000 × 0.30 = R900" },
  { question: "First fine R400. Second doubles. Second fine (R)?", answer: 800, explanation: "400 × 2 = R800" },
  { question: "Damage R5,000. Penalty 15%. Amount paid (R)?", answer: 750, explanation: "5,000 × 0.15 = R750" },
  { question: "First fine R180. Second offence doubles. Second fine (R)?", answer: 360, explanation: "180 × 2 = R360" },
  { question: "A caused R800 damage, B caused R2,400. Penalty 25%. What does A pay (R)?", answer: 200, explanation: "800 × 0.25 = R200" },
  { question: "A caused R800 damage, B caused R2,400. Penalty 25%. What does B pay (R)?", answer: 600, explanation: "2,400 × 0.25 = R600" },
  { question: "First fine R500. Second doubles. Second fine (R)?", answer: 1000, explanation: "500 × 2 = R1,000" },
  { question: "Damage R6,000. Penalty 10%. Paid (R)?", answer: 600, explanation: "6,000 × 0.10 = R600" },
  { question: "First fine R350. Second offence doubles. Second fine (R)?", answer: 700, explanation: "350 × 2 = R700" },
  { question: "A R2,500 damage, B R5,000. Penalty 20%. What does A pay (R)?", answer: 500, explanation: "2,500 × 0.20 = R500" },
  { question: "A R2,500 damage, B R5,000. Penalty 20%. What does B pay (R)?", answer: 1000, explanation: "5,000 × 0.20 = R1,000" },
  { question: "First fine R220. Second doubles. Second fine (R)?", answer: 440, explanation: "220 × 2 = R440" },
  { question: "Damage R4,500. Penalty 18%. Amount (R)?", answer: 810, explanation: "4,500 × 0.18 = R810" },
  { question: "First fine R275. Second offence doubles. Second fine (R)?", answer: 550, explanation: "275 × 2 = R550" }
];

const extremeQuestions: LawyerQuestion[] = [
  { question: "Town reduces fine rates from 10% to 8%. Average fine collected weekly is R20,000 at 10%. Projected collection at 8% (R)?", answer: 16000, explanation: "20,000 × (8÷10) = R16,000" },
  { question: "Contract breach: 15% compensation plus R500 legal fee. Damage = R4,000. Total owed (R)?", answer: 1100, explanation: "4,000×0.15 + 500 = 600 + 500 = R1,100" },
  { question: "Fine rate 12% gives R24,000 weekly. Projected at 9% (R)?", answer: 18000, explanation: "24,000 × (9÷12) = R18,000" },
  { question: "Breach: 20% of damage + R300 fee. Damage R5,000. Total (R)?", answer: 1300, explanation: "5,000×0.20 + 300 = R1,300" },
  { question: "Rate 15% collects R30,000. At 10% projected (R)?", answer: 20000, explanation: "30,000 × (10÷15) = R20,000" },
  { question: "Compensation 10% + R400 fee. Damage R6,000. Total owed (R)?", answer: 1000, explanation: "6,000×0.10 + 400 = R1,000" },
  { question: "Fine rate 8% gives R16,000. At 6% projected (R)?", answer: 12000, explanation: "16,000 × (6÷8) = R12,000" },
  { question: "Breach: 25% + R250 fee. Damage R3,000. Total (R)?", answer: 1000, explanation: "3,000×0.25 + 250 = R1,000" },
  { question: "Rate 20% collects R40,000. At 15% projected (R)?", answer: 30000, explanation: "40,000 × (15÷20) = R30,000" },
  { question: "Compensation 18% + R600 fee. Damage R4,500. Total (R)?", answer: 1410, explanation: "4,500×0.18 + 600 = 810 + 600 = R1,410" },
  { question: "Fine rate 5% gives R10,000. At 4% projected (R)?", answer: 8000, explanation: "10,000 × (4÷5) = R8,000" },
  { question: "Breach: 12% + R350 fee. Damage R7,000. Total owed (R)?", answer: 1190, explanation: "7,000×0.12 + 350 = R1,190" },
  { question: "Rate 9% collects R18,000. At 6% projected (R)?", answer: 12000, explanation: "18,000 × (6÷9) = R12,000" },
  { question: "Compensation 22% + R200 fee. Damage R2,500. Total (R)?", answer: 750, explanation: "2,500×0.22 + 200 = 550 + 200 = R750" },
  { question: "Fine rate 11% gives R22,000. At 8% projected (R)?", answer: 16000, explanation: "22,000 × (8÷11) ≈ R16,000" },
  { question: "Breach: 30% + R150 fee. Damage R2,000. Total (R)?", answer: 750, explanation: "2,000×0.30 + 150 = R750" },
  { question: "Rate 14% collects R28,000. At 10% projected (R)?", answer: 20000, explanation: "28,000 × (10÷14) = R20,000" },
  { question: "Compensation 8% + R450 fee. Damage R8,000. Total owed (R)?", answer: 1090, explanation: "8,000×0.08 + 450 = 640 + 450 = R1,090" },
  { question: "Fine rate 7% gives R14,000. At 5% projected (R)?", answer: 10000, explanation: "14,000 × (5÷7) = R10,000" },
  { question: "Breach: 16% + R380 fee. Damage R5,500. Total (R)?", answer: 1260, explanation: "5,500×0.16 + 380 = 880 + 380 = R1,260" }
];

export function getLawyerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): LawyerQuestion {
  let questions: LawyerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
