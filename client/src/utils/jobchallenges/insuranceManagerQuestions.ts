// Insurance Manager – Risk Review Challenge – client, same as server
// 20 questions per difficulty tier. All numeric answers.

export interface InsuranceManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: InsuranceManagerQuestion[] = [
  { question: "Weekly salary R2,400. Health premium is 5% per week. Premium for 1 week (R)?", answer: 120, explanation: "2,400 × 0.05 = R120" },
  { question: "Weekly salary R3,800. Cyber premium 5% per week. Premium for 1 week (R)?", answer: 190, explanation: "3,800 × 0.05 = R190" },
  { question: "Salary R3,500/week. Health insurance for 2 weeks at 5% per week. Total premium (R)?", answer: 350, explanation: "3,500 × 0.05 × 2 = R350" },
  { question: "Salary R4,200/week. Property insurance 5% per week for 3 weeks. Total (R)?", answer: 630, explanation: "4,200 × 0.05 × 3 = R630" },
  { question: "Clinic cure fee R500. Broker earns R500 per approved claim. How many claims = R3,000?", answer: 6, explanation: "3,000 ÷ 500 = 6" },
  { question: "Salary R2,800/week. Health premium 5% for 4 weeks. Total (R)?", answer: 560, explanation: "2,800 × 0.05 × 4 = R560" },
  { question: "Salary R5,500/week. Cyber premium 5% for 1 week (R)?", answer: 275, explanation: "5,500 × 0.05 = R275" },
  { question: "Salary R7,500/week. Health premium 5% for 2 weeks (R)?", answer: 750, explanation: "7,500 × 0.05 × 2 = R750" },
  { question: "IT repair fee R5,000. Insurance covers full fee. How much does insurer pay (R)?", answer: 5000, explanation: "Full fee covered = R5,000" },
  { question: "Salary R9,500/week. Property premium 5% for 1 week (R)?", answer: 475, explanation: "9,500 × 0.05 = R475" },
  { question: "4 students buy health insurance: R110, R140, R180 each week. Total weekly premiums (R)?", answer: 430, explanation: "110 + 140 + 180 = R430" },
  { question: "Salary R3,600/week. All 3 types at 5% each for 1 week. Total if buying all three (R)?", answer: 540, explanation: "3,600 × 0.05 × 3 = R540" },
  { question: "Broker fee R500 × 5 approvals. Total broker earnings (R)?", answer: 2500, explanation: "500 × 5 = R2,500" },
  { question: "Salary R4,800/week. Health 5% for 3 weeks (R)?", answer: 720, explanation: "4,800 × 0.05 × 3 = R720" },
  { question: "Salary R6,400/week. Cyber 5% for 2 weeks (R)?", answer: 640, explanation: "6,400 × 0.05 × 2 = R640" },
  { question: "Clinic fees: R500, R750, R500. Total claims value (R)?", answer: 1750, explanation: "500 + 750 + 500 = R1,750" },
  { question: "Salary R2,200/week. Health premium 5% for 5 weeks (R)?", answer: 550, explanation: "2,200 × 0.05 × 5 = R550" },
  { question: "Salary R8,800/week. Property premium 5% for 2 weeks (R)?", answer: 880, explanation: "8,800 × 0.05 × 2 = R880" },
  { question: "7 approved purchase requests at R500 broker pay each. Total (R)?", answer: 3500, explanation: "7 × 500 = R3,500" },
  { question: "Salary R11,500/week. Cyber premium 5% for 1 week (R)?", answer: 575, explanation: "11,500 × 0.05 = R575" }
];

const mediumQuestions: InsuranceManagerQuestion[] = [
  { question: "Salary R5,500/week. Health + cyber (5% each) for 2 weeks. Total premium (R)?", answer: 1100, explanation: "5,500 × 0.10 × 2 = R1,100" },
  { question: "Town has 10 health policies at R130/week each. Weekly premium income (R)?", answer: 1300, explanation: "10 × 130 = R1,300" },
  { question: "Salary R7,000/week. All 3 insurance types (5% each) for 4 weeks. Total (R)?", answer: 4200, explanation: "7,000 × 0.15 × 4 = R4,200" },
  { question: "Claims: R500, R750, R5,000 cyber repair. Total payout if all approved (R)?", answer: 6250, explanation: "500 + 750 + 5,000 = R6,250" },
  { question: "Salary R4,500. Health 5% for 6 weeks + R250 admin fee. Total cost (R)?", answer: 1600, explanation: "4,500 × 0.05 × 6 + 250 = R1,600" },
  { question: "14 students at R90/week health premium. Monthly (4 weeks) income (R)?", answer: 5040, explanation: "14 × 90 × 4 = R5,040" },
  { question: "Salary R12,000/week. Property 5% for 3 weeks (R)?", answer: 1800, explanation: "12,000 × 0.05 × 3 = R1,800" },
  { question: "Broker earned R500 × 8 + R500 × 4 claims. Total earnings (R)?", answer: 6000, explanation: "(8 + 4) × 500 = R6,000" },
  { question: "Salary R8,000/week. Health + property (5% each) for 2 weeks (R)?", answer: 1600, explanation: "8,000 × 0.10 × 2 = R1,600" },
  { question: "6 cyber policies at R220/week for 2 weeks. Total collected (R)?", answer: 2640, explanation: "6 × 220 × 2 = R2,640" },
  { question: "Salary R9,200/week. All types 5% each for 1 week (R)?", answer: 1380, explanation: "9,200 × 0.15 = R1,380" },
  { question: "Claims pending: 5 × R500 clinic + 3 × R5,000 cyber. Max payout (R)?", answer: 17500, explanation: "2,500 + 15,000 = R17,500" },
  { question: "Salary R3,600/week. Health 5% for 8 weeks (R)?", answer: 1440, explanation: "3,600 × 0.05 × 8 = R1,440" },
  { question: "Treasury R22,000. Pays R500 broker fee per approval. Max approvals affordable?", answer: 44, explanation: "22,000 ÷ 500 = 44" },
  { question: "Salary R10,200/week. Cyber 5% for 4 weeks (R)?", answer: 2040, explanation: "10,200 × 0.05 × 4 = R2,040" },
  { question: "11 health + 7 cyber policies. R110 and R210 weekly each type. Total weekly (R)?", answer: 2680, explanation: "1,210 + 1,470 = R2,680" },
  { question: "Salary R16,000/week. Property 5% for 2 weeks + health 5% for 2 weeks (R)?", answer: 3200, explanation: "16,000 × 0.10 × 2 = R3,200" },
  { question: "Denied purchase refunds R520 + R680 + R350. Total refunded (R)?", answer: 1550, explanation: "520 + 680 + 350 = R1,550" },
  { question: "Salary R6,200/week. All 3 types 5% for 3 weeks (R)?", answer: 2790, explanation: "6,200 × 0.15 × 3 = R2,790" },
  { question: "Broker: 10 purchase approvals + 5 claim approvals at R500 each. Total (R)?", answer: 7500, explanation: "15 × 500 = R7,500" }
];

const hardQuestions: InsuranceManagerQuestion[] = [
  { question: "Class salary total R52,000/week. If 30% buy health at 5%, weekly health premium pool (R)?", answer: 780, explanation: "52,000 × 0.30 × 0.05 = R780" },
  { question: "Salary R6,800. Health 5% × 4 wks + cyber 5% × 3 wks + R200 processing. Total (R)?", answer: 1590, explanation: "1,360 + 1,020 + 200 = R1,590" },
  { question: "Treasury R9,500. Pays 1 cyber claim R5,000 then clinic R500 each. Max extra clinic claims?", answer: 9, explanation: "(9,500 − 5,000) ÷ 500 = 9" },
  { question: "22 students, avg salary R4,200. All buy health 5% for 3 weeks. Total premiums (R)?", answer: 13860, explanation: "22 × 4,200 × 0.05 × 3 = R13,860" },
  { question: "Premiums in R2,800. Claims out R500×3 + R5,000. Net after claims (R)?", answer: -3700, explanation: "2,800 − 6,500 = −R3,700" },
  { question: "Salary R11,000. Buy all 3 types 5% for 6 weeks. Total cost (R)?", answer: 9900, explanation: "11,000 × 0.15 × 6 = R9,900" },
  { question: "Broker earnings R500 × 18. Treasury started R12,000. Balance after payouts (R)?", answer: 3000, explanation: "12,000 − 9,000 = R3,000" },
  { question: "9 health (R110/wk) + 6 cyber (R220/wk) for 5 weeks. Total collected (R)?", answer: 11550, explanation: "(990 + 1,320) × 5 = R11,550" },
  { question: "Salary R8,200/week. Health 5% for 10 weeks (R)?", answer: 4100, explanation: "8,200 × 0.05 × 10 = R4,100" },
  { question: "Claims ratio: R14,400 paid on R24,000 premiums. Claims ratio (%)?", answer: 60, explanation: "14,400 ÷ 24,000 × 100 = 60%" },
  { question: "Salary R5,600. Health + cyber + property (5% each) for 5 weeks (R)?", answer: 4200, explanation: "5,600 × 0.15 × 5 = R4,200" },
  { question: "Town: 18 policies avg R200/week for 4 weeks. Income (R)?", answer: 14400, explanation: "18 × 200 × 4 = R14,400" },
  { question: "Treasury R28,000. Pays 2 cyber (R5,000) + 6 clinic (R500). Remaining (R)?", answer: 15000, explanation: "28,000 − 10,000 − 3,000 = R15,000" },
  { question: "Salary R15,000/week. Cyber 5% for 3 weeks + health 5% for 2 weeks (R)?", answer: 3750, explanation: "2,250 + 1,500 = R3,750" },
  { question: "Premiums R4,200/week for 8 weeks. Claims R19,600 total. Surplus (R)?", answer: 14000, explanation: "33,600 − 19,600 = R14,000" },
  { question: "24 students buy health: 14 at R110, 10 at R160 weekly. Total weekly (R)?", answer: 3140, explanation: "1,540 + 1,600 = R3,140" },
  { question: "Salary R9,800. All 3 types 5% for 4 weeks + R500 admin (R)?", answer: 6380, explanation: "5,880 + 500 = R6,380" },
  { question: "Broker: 7 purchases + 9 clinic + 3 cyber at R500 each. Total earnings (R)?", answer: 9500, explanation: "19 × 500 = R9,500" },
  { question: "Salary R7,400/week. Property 5% for 12 weeks (R)?", answer: 4440, explanation: "7,400 × 0.05 × 12 = R4,440" },
  { question: "Loss ratio target 50%. Premiums R18,000. Max claims allowed (R)?", answer: 9000, explanation: "18,000 × 0.50 = R9,000" }
];

const extremeQuestions: InsuranceManagerQuestion[] = [
  { question: "Payroll R135,000/wk. 35% health (5%), 22% cyber (5%), 12% property (5%) for 1 week. Total premiums (R)?", answer: 4657.5, explanation: "2,362.5 + 1,485 + 810 = R4,657.50" },
  { question: "Treasury R55,000. Broker fees R500×22 + cyber claims R5,000×3. Remaining (R)?", answer: 24000, explanation: "55,000 − 11,000 − 15,000 = R24,000" },
  { question: "Salary R9,200. All 3 types 5% each for 8 weeks. Total premiums (R)?", answer: 11040, explanation: "9,200 × 0.15 × 8 = R11,040" },
  { question: "Town: 45 policies avg R240/wk for 5 weeks. Premium income (R)?", answer: 54000, explanation: "45 × 240 × 5 = R54,000" },
  { question: "Claims R500×12 + R5,000×4. Total payout (R)?", answer: 26000, explanation: "6,000 + 20,000 = R26,000" },
  { question: "Salary R19,500/wk. Health+cyber+property 5% each for 4 weeks (R)?", answer: 11700, explanation: "19,500 × 0.15 × 4 = R11,700" },
  { question: "Premiums R6,500/wk × 10 wks. Claims R38,000. Net surplus (R)?", answer: 27000, explanation: "65,000 − 38,000 = R27,000" },
  { question: "Broker R500 × (28 purchases + 12 claims). Total paid from treasury (R)?", answer: 20000, explanation: "40 × 500 = R20,000" },
  { question: "55% of R180,000 weekly payroll buys health at 5% for 2 weeks. Premiums (R)?", answer: 9900, explanation: "180,000 × 0.55 × 0.05 × 2 = R9,900" },
  { question: "Treasury R110,000. Reserve 25% for emergencies. Available for claims (R)?", answer: 82500, explanation: "110,000 × 0.75 = R82,500" },
  { question: "Salary R23,500/wk. Cyber 5% for 5 weeks (R)?", answer: 5875, explanation: "23,500 × 0.05 × 5 = R5,875" },
  { question: "Combined weekly premiums R5,200 × 8 weeks. Claims 60% of income. Claims total (R)?", answer: 24960, explanation: "41,600 × 0.60 = R24,960" },
  { question: "Salary R14,200/wk. All 3 types 5% for 5 weeks + R1,200 audit fee (R)?", answer: 11770, explanation: "10,650 + 1,200 = R11,770" },
  { question: "55 policies: 32 health R95, 23 cyber R190 weekly for 4 weeks. Total (R)?", answer: 29840, explanation: "(3,040 + 4,370) × 4 = R29,840" },
  { question: "Loss ratio 70% on R90,000 premiums. Claims paid (R)?", answer: 63000, explanation: "90,000 × 0.70 = R63,000" },
  { question: "Salary R17,500/wk. Property 5% for 6 weeks + health 5% for 4 weeks (R)?", answer: 8750, explanation: "5,250 + 3,500 = R8,750" },
  { question: "Treasury R65,000. Broker R500×28. Max R5,000 cyber claims after broker fees?", answer: 9, explanation: "(65,000 − 14,000) ÷ 5,000 = 10.2 → 10" },
  { question: "Premium pool R4,800/wk grows 10% weekly for 3 weeks. Week 3 pool (R)?", answer: 5812.8, explanation: "4,800 × 1.1³ ≈ R5,812.80" },
  { question: "Salary R27,000/wk. All 3 types 5% for 2 weeks (R)?", answer: 8100, explanation: "27,000 × 0.15 × 2 = R8,100" },
  { question: "Claims R500×28 + R5,000×6. Total payout (R)?", answer: 44000, explanation: "14,000 + 30,000 = R44,000" }
];

export function getInsuranceManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): InsuranceManagerQuestion {
  let questions: InsuranceManagerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
