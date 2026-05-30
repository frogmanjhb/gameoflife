// Insurance Manager – Risk Review Challenge
// 20 questions per difficulty tier. All numeric answers.

export interface InsuranceManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

export const easyQuestions: InsuranceManagerQuestion[] = [
  { question: "Weekly salary R2,000. Health premium is 5% per week. Premium for 1 week (R)?", answer: 100, explanation: "2,000 × 0.05 = R100" },
  { question: "Weekly salary R4,000. Cyber premium 5% per week. Premium for 1 week (R)?", answer: 200, explanation: "4,000 × 0.05 = R200" },
  { question: "Salary R3,000/week. Health insurance for 2 weeks at 5% per week. Total premium (R)?", answer: 300, explanation: "3,000 × 0.05 × 2 = R300" },
  { question: "Salary R5,000/week. Property insurance 5% per week for 3 weeks. Total (R)?", answer: 750, explanation: "5,000 × 0.05 × 3 = R750" },
  { question: "Clinic cure fee R500. Broker earns R500 per approved claim. How many claims = R2,500?", answer: 5, explanation: "2,500 ÷ 500 = 5" },
  { question: "Salary R2,500/week. Health premium 5% for 4 weeks. Total (R)?", answer: 500, explanation: "2,500 × 0.05 × 4 = R500" },
  { question: "Salary R6,000/week. Cyber premium 5% for 1 week (R)?", answer: 300, explanation: "6,000 × 0.05 = R300" },
  { question: "Salary R8,000/week. Health premium 5% for 2 weeks (R)?", answer: 800, explanation: "8,000 × 0.05 × 2 = R800" },
  { question: "IT repair fee R5,000. Insurance covers full fee. How much does insurer pay (R)?", answer: 5000, explanation: "Full fee covered = R5,000" },
  { question: "Salary R10,000/week. Property premium 5% for 1 week (R)?", answer: 500, explanation: "10,000 × 0.05 = R500" },
  { question: "3 students buy health insurance: R100, R150, R200 each week. Total weekly premiums (R)?", answer: 450, explanation: "100 + 150 + 200 = R450" },
  { question: "Salary R3,500/week. All 3 types at 5% each for 1 week. Total if buying all three (R)?", answer: 525, explanation: "3,500 × 0.05 × 3 = R525" },
  { question: "Broker fee R500 × 4 approvals. Total broker earnings (R)?", answer: 2000, explanation: "500 × 4 = R2,000" },
  { question: "Salary R4,500/week. Health 5% for 3 weeks (R)?", answer: 675, explanation: "4,500 × 0.05 × 3 = R675" },
  { question: "Salary R7,200/week. Cyber 5% for 2 weeks (R)?", answer: 720, explanation: "7,200 × 0.05 × 2 = R720" },
  { question: "Clinic fees: R500, R500, R750. Total claims value (R)?", answer: 1750, explanation: "500 + 500 + 750 = R1,750" },
  { question: "Salary R1,800/week. Health premium 5% for 5 weeks (R)?", answer: 450, explanation: "1,800 × 0.05 × 5 = R450" },
  { question: "Salary R9,000/week. Property premium 5% for 2 weeks (R)?", answer: 900, explanation: "9,000 × 0.05 × 2 = R900" },
  { question: "6 approved purchase requests at R500 broker pay each. Total (R)?", answer: 3000, explanation: "6 × 500 = R3,000" },
  { question: "Salary R12,000/week. Cyber premium 5% for 1 week (R)?", answer: 600, explanation: "12,000 × 0.05 = R600" },
];

export const mediumQuestions: InsuranceManagerQuestion[] = [
  { question: "Salary R5,000/week. Health + cyber (5% each) for 2 weeks. Total premium (R)?", answer: 1000, explanation: "5,000 × 0.10 × 2 = R1,000" },
  { question: "Town has 8 health policies at R120/week each. Weekly premium income (R)?", answer: 960, explanation: "8 × 120 = R960" },
  { question: "Salary R6,500/week. All 3 insurance types (5% each) for 4 weeks. Total (R)?", answer: 3900, explanation: "6,500 × 0.15 × 4 = R3,900" },
  { question: "Claims: R500, R500, R5,000 cyber repair. Total payout if all approved (R)?", answer: 6000, explanation: "500 + 500 + 5,000 = R6,000" },
  { question: "Salary R4,000. Health 5% for 6 weeks + R200 admin fee. Total cost (R)?", answer: 1400, explanation: "4,000 × 0.05 × 6 + 200 = R1,400" },
  { question: "12 students at R80/week health premium. Monthly (4 weeks) income (R)?", answer: 3840, explanation: "12 × 80 × 4 = R3,840" },
  { question: "Salary R11,000/week. Property 5% for 3 weeks (R)?", answer: 1650, explanation: "11,000 × 0.05 × 3 = R1,650" },
  { question: "Broker earned R500 × 7 + R500 × 3 claims. Total earnings (R)?", answer: 5000, explanation: "(7 + 3) × 500 = R5,000" },
  { question: "Salary R7,500/week. Health + property (5% each) for 2 weeks (R)?", answer: 1500, explanation: "7,500 × 0.10 × 2 = R1,500" },
  { question: "5 cyber policies at R250/week for 2 weeks. Total collected (R)?", answer: 2500, explanation: "5 × 250 × 2 = R2,500" },
  { question: "Salary R8,400/week. All types 5% each for 1 week (R)?", answer: 1260, explanation: "8,400 × 0.15 = R1,260" },
  { question: "Claims pending: 4 × R500 clinic + 2 × R5,000 cyber. Max payout (R)?", answer: 12000, explanation: "2,000 + 10,000 = R12,000" },
  { question: "Salary R3,200/week. Health 5% for 8 weeks (R)?", answer: 1280, explanation: "3,200 × 0.05 × 8 = R1,280" },
  { question: "Treasury R20,000. Pays R500 broker fee per approval. Max approvals affordable?", answer: 40, explanation: "20,000 ÷ 500 = 40" },
  { question: "Salary R9,500/week. Cyber 5% for 4 weeks (R)?", answer: 1900, explanation: "9,500 × 0.05 × 4 = R1,900" },
  { question: "10 health + 6 cyber policies. R100 and R200 weekly each type. Total weekly (R)?", answer: 2200, explanation: "1,000 + 1,200 = R2,200" },
  { question: "Salary R15,000/week. Property 5% for 2 weeks + health 5% for 2 weeks (R)?", answer: 3000, explanation: "15,000 × 0.10 × 2 = R3,000" },
  { question: "Denied purchase refunds R450 + R600 + R300. Total refunded (R)?", answer: 1350, explanation: "450 + 600 + 300 = R1,350" },
  { question: "Salary R5,500/week. All 3 types 5% for 3 weeks (R)?", answer: 2475, explanation: "5,500 × 0.15 × 3 = R2,475" },
  { question: "Broker: 9 purchase approvals + 4 claim approvals at R500 each. Total (R)?", answer: 6500, explanation: "13 × 500 = R6,500" },
];

export const hardQuestions: InsuranceManagerQuestion[] = [
  { question: "Class salary total R48,000/week. If 25% buy health at 5%, weekly health premium pool (R)?", answer: 600, explanation: "48,000 × 0.25 × 0.05 = R600" },
  { question: "Salary R6,000. Health 5% × 4 wks + cyber 5% × 2 wks + R150 processing. Total (R)?", answer: 1350, explanation: "1,200 + 600 + 150 = R1,350" },
  { question: "Treasury R8,000. Pays 1 cyber claim R5,000 then clinic R500 each. Max extra clinic claims?", answer: 6, explanation: "(8,000 − 5,000) ÷ 500 = 6" },
  { question: "20 students, avg salary R4,500. All buy health 5% for 3 weeks. Total premiums (R)?", answer: 13500, explanation: "20 × 4,500 × 0.05 × 3 = R13,500" },
  { question: "Premiums in R2,400. Claims out R500×2 + R5,000. Net after claims (R)?", answer: -3600, explanation: "2,400 − 6,000 = −R3,600" },
  { question: "Salary R10,000. Buy all 3 types 5% for 6 weeks. Total cost (R)?", answer: 9000, explanation: "10,000 × 0.15 × 6 = R9,000" },
  { question: "Broker earnings R500 × 15. Treasury started R10,000. Balance after payouts (R)?", answer: 2500, explanation: "10,000 − 7,500 = R2,500" },
  { question: "8 health (R100/wk) + 5 cyber (R200/wk) for 5 weeks. Total collected (R)?", answer: 9000, explanation: "(800 + 1,000) × 5 = R9,000" },
  { question: "Salary R7,800/week. Health 5% for 10 weeks (R)?", answer: 3900, explanation: "7,800 × 0.05 × 10 = R3,900" },
  { question: "Claims ratio: R12,000 paid on R20,000 premiums. Claims ratio (%)?", answer: 60, explanation: "12,000 ÷ 20,000 × 100 = 60%" },
  { question: "Salary R5,200. Health + cyber + property (5% each) for 5 weeks (R)?", answer: 3900, explanation: "5,200 × 0.15 × 5 = R3,900" },
  { question: "Town: 15 policies avg R180/week for 4 weeks. Income (R)?", answer: 10800, explanation: "15 × 180 × 4 = R10,800" },
  { question: "Treasury R25,000. Pays 3 cyber (R5,000) + 4 clinic (R500). Remaining (R)?", answer: 8000, explanation: "25,000 − 15,000 − 2,000 = R8,000" },
  { question: "Salary R14,000/week. Cyber 5% for 3 weeks + health 5% for 2 weeks (R)?", answer: 3500, explanation: "2,100 + 1,400 = R3,500" },
  { question: "Premiums R3,600/week for 8 weeks. Claims R18,000 total. Surplus (R)?", answer: 10800, explanation: "28,800 − 18,000 = R10,800" },
  { question: "22 students buy health: 12 at R100, 10 at R150 weekly. Total weekly (R)?", answer: 2700, explanation: "1,200 + 1,500 = R2,700" },
  { question: "Salary R9,200. All 3 types 5% for 4 weeks + R400 admin (R)?", answer: 5920, explanation: "5,520 + 400 = R5,920" },
  { question: "Broker: 6 purchases + 8 clinic + 2 cyber at R500 each. Total earnings (R)?", answer: 8000, explanation: "16 × 500 = R8,000" },
  { question: "Salary R6,800/week. Property 5% for 12 weeks (R)?", answer: 4080, explanation: "6,800 × 0.05 × 12 = R4,080" },
  { question: "Loss ratio target 50%. Premiums R16,000. Max claims allowed (R)?", answer: 8000, explanation: "16,000 × 0.50 = R8,000" },
];

export const extremeQuestions: InsuranceManagerQuestion[] = [
  { question: "Payroll R120,000/wk. 30% health (5%), 20% cyber (5%), 10% property (5%) for 1 week. Total premiums (R)?", answer: 3000, explanation: "1,800 + 1,200 + 600 = R3,000" },
  { question: "Treasury R50,000. Broker fees R500×20 + cyber claims R5,000×4. Remaining (R)?", answer: 20000, explanation: "50,000 − 10,000 − 20,000 = R20,000" },
  { question: "Salary R8,000. All 3 types 5% each for 8 weeks. Total premiums (R)?", answer: 9600, explanation: "8,000 × 0.15 × 8 = R9,600" },
  { question: "Town: 40 policies avg R225/wk for 6 weeks. Premium income (R)?", answer: 54000, explanation: "40 × 225 × 6 = R54,000" },
  { question: "Claims R500×10 + R5,000×5. Total payout (R)?", answer: 30000, explanation: "5,000 + 25,000 = R30,000" },
  { question: "Salary R18,000/wk. Health+cyber+property 5% each for 4 weeks (R)?", answer: 10800, explanation: "18,000 × 0.15 × 4 = R10,800" },
  { question: "Premiums R6,000/wk × 12 wks. Claims R40,000. Net surplus (R)?", answer: 32000, explanation: "72,000 − 40,000 = R32,000" },
  { question: "Broker R500 × (25 purchases + 15 claims). Total paid from treasury (R)?", answer: 20000, explanation: "40 × 500 = R20,000" },
  { question: "60% of R200,000 weekly payroll buys health at 5% for 2 weeks. Premiums (R)?", answer: 12000, explanation: "200,000 × 0.60 × 0.05 × 2 = R12,000" },
  { question: "Treasury R100,000. Reserve 30% for emergencies. Available for claims (R)?", answer: 70000, explanation: "100,000 × 0.70 = R70,000" },
  { question: "Salary R22,000/wk. Cyber 5% for 6 weeks (R)?", answer: 6600, explanation: "22,000 × 0.05 × 6 = R6,600" },
  { question: "Combined weekly premiums R4,500 × 10 weeks. Claims 55% of income. Claims total (R)?", answer: 24750, explanation: "45,000 × 0.55 = R24,750" },
  { question: "Salary R13,500/wk. All 3 types 5% for 5 weeks + R1,000 audit fee (R)?", answer: 11125, explanation: "10,125 + 1,000 = R11,125" },
  { question: "50 policies: 30 health R90, 20 cyber R180 weekly for 4 weeks. Total (R)?", answer: 21600, explanation: "(2,700 + 3,600) × 4 = R21,600" },
  { question: "Loss ratio 75% on R80,000 premiums. Claims paid (R)?", answer: 60000, explanation: "80,000 × 0.75 = R60,000" },
  { question: "Salary R16,000/wk. Property 5% for 8 weeks + health 5% for 4 weeks (R)?", answer: 9600, explanation: "6,400 + 3,200 = R9,600" },
  { question: "Treasury R60,000. Broker R500×30. Max R5,000 cyber claims after broker fees?", answer: 9, explanation: "(60,000 − 15,000) ÷ 5,000 = 9" },
  { question: "Premium pool R5,200/wk grows 10% weekly for 3 weeks. Week 3 pool (R)?", answer: 6292, explanation: "5,200 × 1.1 × 1.1 × 1.1 ≈ R6,292" },
  { question: "Salary R25,000/wk. All 3 types 5% for 2 weeks (R)?", answer: 7500, explanation: "25,000 × 0.15 × 2 = R7,500" },
  { question: "Claims R500×24 + R5,000×8. Total payout (R)?", answer: 52000, explanation: "12,000 + 40,000 = R52,000" },
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
