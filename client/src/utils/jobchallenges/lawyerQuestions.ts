// Lawyer – Legal Reasoning Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface LawyerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Fair Distribution (division, simple %, equal sharing)
const easyQuestions: LawyerQuestion[] = [
  { question: "A township spaza earned R7,500. 5 owners share equally. How much each (R)?", answer: 1500, explanation: "7,500 ÷ 5 = R1,500" },
  { question: "A traffic fine of R650 is reduced by 10%. What is the new fine (R)?", answer: 585, explanation: "650 × 0.90 = R585" },
  { question: "R5,400 profit. 6 partners share equally. Each gets (R)?", answer: 900, explanation: "5,400 ÷ 6 = R900" },
  { question: "Fine R950 reduced by 20%. New fine (R)?", answer: 760, explanation: "950 × 0.80 = R760" },
  { question: "R10,800 to split between 4 heirs. How much each (R)?", answer: 2700, explanation: "10,800 ÷ 4 = R2,700" },
  { question: "Fine R1,250 reduced by 12%. New fine (R)?", answer: 1100, explanation: "1,250 × 0.88 = R1,100" },
  { question: "R4,200 shared by 7 equally. Each (R)?", answer: 600, explanation: "4,200 ÷ 7 = R600" },
  { question: "Fine R480 reduced by 25%. New fine (R)?", answer: 360, explanation: "480 × 0.75 = R360" },
  { question: "R14,400. 8 partners. How much each (R)?", answer: 1800, explanation: "14,400 ÷ 8 = R1,800" },
  { question: "Fine R320 reduced by 35%. New fine (R)?", answer: 208, explanation: "320 × 0.65 = R208" },
  { question: "R3,300 profit. 3 share equally. Each (R)?", answer: 1100, explanation: "3,300 ÷ 3 = R1,100" },
  { question: "Fine R880 reduced by 15%. New fine (R)?", answer: 748, explanation: "880 × 0.85 = R748" },
  { question: "R6,300. 9 people. How much each (R)?", answer: 700, explanation: "6,300 ÷ 9 = R700" },
  { question: "Fine R1,100 reduced by 18%. New fine (R)?", answer: 902, explanation: "1,100 × 0.82 = R902" },
  { question: "R11,000 shared by 5. Each gets (R)?", answer: 2200, explanation: "11,000 ÷ 5 = R2,200" },
  { question: "Fine R420 reduced by 5%. New fine (R)?", answer: 399, explanation: "420 × 0.95 = R399" },
  { question: "R9,600. 4 partners. How much each (R)?", answer: 2400, explanation: "9,600 ÷ 4 = R2,400" },
  { question: "Fine R1,450 reduced by 22%. New fine (R)?", answer: 1131, explanation: "1,450 × 0.78 = R1,131" },
  { question: "R2,700. 6 share equally. Each (R)?", answer: 450, explanation: "2,700 ÷ 6 = R450" },
  { question: "Fine R275 reduced by 40%. New fine (R)?", answer: 165, explanation: "275 × 0.60 = R165" }
];

// MEDIUM – Contract Terms (penalties, proportional reasoning)
const mediumQuestions: LawyerQuestion[] = [
  { question: "Contract: Late payment penalty = 8% of amount owed. Amount owed = R3,500. Penalty (R)?", answer: 280, explanation: "3,500 × 0.08 = R280" },
  { question: "Property contract requires 12% deposit on R18,000. Deposit amount (R)?", answer: 2160, explanation: "18,000 × 0.12 = R2,160" },
  { question: "Penalty 14% of R4,200 owed. Penalty (R)?", answer: 588, explanation: "4,200 × 0.14 = R588" },
  { question: "Contract: 18% deposit on R9,500. Deposit (R)?", answer: 1710, explanation: "9,500 × 0.18 = R1,710" },
  { question: "Late fee 6% of R6,800. Late fee (R)?", answer: 408, explanation: "6,800 × 0.06 = R408" },
  { question: "Deposit 20% on R16,500. Deposit (R)?", answer: 3300, explanation: "16,500 × 0.20 = R3,300" },
  { question: "Penalty 9% of R7,200. Penalty (R)?", answer: 648, explanation: "7,200 × 0.09 = R648" },
  { question: "Contract: 15% deposit on R4,800. Deposit (R)?", answer: 720, explanation: "4,800 × 0.15 = R720" },
  { question: "Late payment 11% of R2,800. Penalty (R)?", answer: 308, explanation: "2,800 × 0.11 = R308" },
  { question: "Deposit 24% on R13,500. Deposit (R)?", answer: 3240, explanation: "13,500 × 0.24 = R3,240" },
  { question: "Penalty 7% of R9,100. Penalty (R)?", answer: 637, explanation: "9,100 × 0.07 = R637" },
  { question: "Contract: 17% deposit on R22,000. Deposit (R)?", answer: 3740, explanation: "22,000 × 0.17 = R3,740" },
  { question: "Late fee 13% of R3,600. Late fee (R)?", answer: 468, explanation: "3,600 × 0.13 = R468" },
  { question: "Deposit 28% on R8,750. Deposit (R)?", answer: 2450, explanation: "8,750 × 0.28 = R2,450" },
  { question: "Penalty 10% of R5,600. Penalty (R)?", answer: 560, explanation: "5,600 × 0.10 = R560" },
  { question: "Contract: 19% deposit on R6,400. Deposit (R)?", answer: 1216, explanation: "6,400 × 0.19 = R1,216" },
  { question: "Late payment 16% of R1,875. Penalty (R)?", answer: 300, explanation: "1,875 × 0.16 = R300" },
  { question: "Deposit 21% on R19,000. Deposit (R)?", answer: 3990, explanation: "19,000 × 0.21 = R3,990" },
  { question: "Penalty 15% of R2,640. Penalty (R)?", answer: 396, explanation: "2,640 × 0.15 = R396" },
  { question: "Contract: 35% deposit on R4,200. Deposit (R)?", answer: 1470, explanation: "4,200 × 0.35 = R1,470" }
];

// HARD – Proportional Justice (comparing penalties, multi-step)
const hardQuestions: LawyerQuestion[] = [
  { question: "Student A caused R3,200 damage. Student B caused R6,400 damage. Penalty is 20% of damage. What does Student A pay (R)?", answer: 640, explanation: "3,200 × 0.20 = R640" },
  { question: "Student A R3,200 damage. Student B R6,400 damage. Penalty 20%. What does Student B pay (R)?", answer: 1280, explanation: "6,400 × 0.20 = R1,280" },
  { question: "Fine triples after third offence. First fine = R180. Third fine (R)?", answer: 540, explanation: "180 × 3 = R540" },
  { question: "Damage R4,500. Penalty 22%. What is paid (R)?", answer: 990, explanation: "4,500 × 0.22 = R990" },
  { question: "First fine R375. Second offence doubles. Second fine (R)?", answer: 750, explanation: "375 × 2 = R750" },
  { question: "Student A R2,100 damage, Student B R4,200. Penalty 35%. What does A pay (R)?", answer: 735, explanation: "2,100 × 0.35 = R735" },
  { question: "Student A R2,100 damage, Student B R4,200. Penalty 35%. What does B pay (R)?", answer: 1470, explanation: "4,200 × 0.35 = R1,470" },
  { question: "First fine R520. Second doubles. Second fine (R)?", answer: 1040, explanation: "520 × 2 = R1,040" },
  { question: "Damage R7,500. Penalty 12%. Amount paid (R)?", answer: 900, explanation: "7,500 × 0.12 = R900" },
  { question: "First fine R195. Second offence doubles. Second fine (R)?", answer: 390, explanation: "195 × 2 = R390" },
  { question: "A caused R1,200 damage, B caused R3,600. Penalty 30%. What does A pay (R)?", answer: 360, explanation: "1,200 × 0.30 = R360" },
  { question: "A caused R1,200 damage, B caused R3,600. Penalty 30%. What does B pay (R)?", answer: 1080, explanation: "3,600 × 0.30 = R1,080" },
  { question: "First fine R425. Second doubles. Second fine (R)?", answer: 850, explanation: "425 × 2 = R850" },
  { question: "Damage R8,200. Penalty 17%. Paid (R)?", answer: 1394, explanation: "8,200 × 0.17 = R1,394" },
  { question: "First fine R310. Second offence doubles. Second fine (R)?", answer: 620, explanation: "310 × 2 = R620" },
  { question: "A R3,750 damage, B R7,500. Penalty 24%. What does A pay (R)?", answer: 900, explanation: "3,750 × 0.24 = R900" },
  { question: "A R3,750 damage, B R7,500. Penalty 24%. What does B pay (R)?", answer: 1800, explanation: "7,500 × 0.24 = R1,800" },
  { question: "First fine R240. Second doubles. Second fine (R)?", answer: 480, explanation: "240 × 2 = R480" },
  { question: "Damage R5,600. Penalty 19%. Amount (R)?", answer: 1064, explanation: "5,600 × 0.19 = R1,064" },
  { question: "First fine R290. Second offence doubles. Second fine (R)?", answer: 580, explanation: "290 × 2 = R580" }
];

// EXTREME – Legal Modelling (impact of rule changes, multi-variable)
const extremeQuestions: LawyerQuestion[] = [
  { question: "Town reduces fine rates from 12% to 9%. Average fine collected weekly is R24,000 at 12%. Projected collection at 9% (R)?", answer: 18000, explanation: "24,000 × (9÷12) = R18,000" },
  { question: "Contract breach: 18% compensation plus R650 legal fee. Damage = R5,500. Total owed (R)?", answer: 1640, explanation: "5,500×0.18 + 650 = 990 + 650 = R1,640" },
  { question: "Fine rate 15% gives R30,000 weekly. Projected at 10% (R)?", answer: 20000, explanation: "30,000 × (10÷15) = R20,000" },
  { question: "Breach: 22% of damage + R420 fee. Damage R6,500. Total (R)?", answer: 1850, explanation: "6,500×0.22 + 420 = 1,430 + 420 = R1,850" },
  { question: "Rate 18% collects R36,000. At 12% projected (R)?", answer: 24000, explanation: "36,000 × (12÷18) = R24,000" },
  { question: "Compensation 14% + R550 fee. Damage R7,200. Total owed (R)?", answer: 1558, explanation: "7,200×0.14 + 550 = 1,008 + 550 = R1,558" },
  { question: "Fine rate 10% gives R25,000. At 7% projected (R)?", answer: 17500, explanation: "25,000 × (7÷10) = R17,500" },
  { question: "Breach: 28% + R320 fee. Damage R4,000. Total (R)?", answer: 1440, explanation: "4,000×0.28 + 320 = 1,120 + 320 = R1,440" },
  { question: "Rate 16% collects R32,000. At 11% projected (R)?", answer: 22000, explanation: "32,000 × (11÷16) = R22,000" },
  { question: "Compensation 20% + R480 fee. Damage R5,800. Total (R)?", answer: 1640, explanation: "5,800×0.20 + 480 = 1,160 + 480 = R1,640" },
  { question: "Fine rate 6% gives R12,000. At 5% projected (R)?", answer: 10000, explanation: "12,000 × (5÷6) = R10,000" },
  { question: "Breach: 17% + R290 fee. Damage R9,000. Total owed (R)?", answer: 1820, explanation: "9,000×0.17 + 290 = 1,530 + 290 = R1,820" },
  { question: "Rate 13% collects R26,000. At 9% projected (R)?", answer: 18000, explanation: "26,000 × (9÷13) = R18,000" },
  { question: "Compensation 25% + R175 fee. Damage R3,400. Total (R)?", answer: 1025, explanation: "3,400×0.25 + 175 = 850 + 175 = R1,025" },
  { question: "Fine rate 14% gives R28,000. At 10% projected (R)?", answer: 20000, explanation: "28,000 × (10÷14) = R20,000" },
  { question: "Breach: 32% + R210 fee. Damage R2,750. Total (R)?", answer: 1090, explanation: "2,750×0.32 + 210 = 880 + 210 = R1,090" },
  { question: "Rate 19% collects R38,000. At 14% projected (R)?", answer: 28000, explanation: "38,000 × (14÷19) = R28,000" },
  { question: "Compensation 11% + R520 fee. Damage R10,500. Total owed (R)?", answer: 1675, explanation: "10,500×0.11 + 520 = 1,155 + 520 = R1,675" },
  { question: "Fine rate 8% gives R20,000. At 6% projected (R)?", answer: 15000, explanation: "20,000 × (6÷8) = R15,000" },
  { question: "Breach: 21% + R410 fee. Damage R6,800. Total (R)?", answer: 1838, explanation: "6,800×0.21 + 410 = 1,428 + 410 = R1,838" }
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
