// Financial Manager – Town Finance Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface FinancialManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: FinancialManagerQuestion[] = [
  { question: "Salary = R10,000. Tax rate = 10%. How much tax is deducted (R)?", answer: 1000, explanation: "10,000 × 0.10 = R1,000" },
  { question: "Salary = R10,000. Tax rate = 10%. What is net salary (R)?", answer: 9000, explanation: "10,000 − 1,000 = R9,000" },
  { question: "3 employees earn R2,000 each. Total payroll (R)?", answer: 6000, explanation: "3 × 2,000 = R6,000" },
  { question: "Salary R15,000. Tax 20%. Tax deducted (R)?", answer: 3000, explanation: "15,000 × 0.20 = R3,000" },
  { question: "Salary R15,000. Tax 20%. Net salary (R)?", answer: 12000, explanation: "15,000 − 3,000 = R12,000" },
  { question: "5 workers earn R3,000 each. Total payroll (R)?", answer: 15000, explanation: "5 × 3,000 = R15,000" },
  { question: "Gross salary R8,000. Tax rate 15%. Tax (R)?", answer: 1200, explanation: "8,000 × 0.15 = R1,200" },
  { question: "Gross salary R8,000. Tax rate 15%. Net (R)?", answer: 6800, explanation: "8,000 − 1,200 = R6,800" },
  { question: "4 employees at R2,500 each. Total payroll (R)?", answer: 10000, explanation: "4 × 2,500 = R10,000" },
  { question: "Salary R12,000. Tax 25%. Tax deducted (R)?", answer: 3000, explanation: "12,000 × 0.25 = R3,000" },
  { question: "Salary R12,000. Tax 25%. Net salary (R)?", answer: 9000, explanation: "12,000 − 3,000 = R9,000" },
  { question: "6 workers earn R1,500 each. Total payroll (R)?", answer: 9000, explanation: "6 × 1,500 = R9,000" },
  { question: "Gross R20,000. Tax 10%. Tax (R)?", answer: 2000, explanation: "20,000 × 0.10 = R2,000" },
  { question: "Gross R20,000. Tax 10%. Net (R)?", answer: 18000, explanation: "20,000 − 2,000 = R18,000" },
  { question: "8 employees at R4,000 each. Total payroll (R)?", answer: 32000, explanation: "8 × 4,000 = R32,000" },
  { question: "Salary R6,000. Tax 5%. Tax deducted (R)?", answer: 300, explanation: "6,000 × 0.05 = R300" },
  { question: "Salary R6,000. Tax 5%. Net salary (R)?", answer: 5700, explanation: "6,000 − 300 = R5,700" },
  { question: "2 workers earn R5,000 each. Total payroll (R)?", answer: 10000, explanation: "2 × 5,000 = R10,000" },
  { question: "Gross R18,000. Tax 15%. Tax (R)?", answer: 2700, explanation: "18,000 × 0.15 = R2,700" },
  { question: "Gross R18,000. Tax 15%. Net (R)?", answer: 15300, explanation: "18,000 − 2,700 = R15,300" }
];

const mediumQuestions: FinancialManagerQuestion[] = [
  { question: "Town income: Taxes R15,000, Fines R2,000. Expenses: Salaries R12,000, Event R3,000. Surplus or deficit? By how much (R)? (surplus = positive, deficit = negative)", answer: 2000, explanation: "Income 17,000 − expenses 15,000 = R2,000 surplus" },
  { question: "Income: Taxes R20,000, Fines R1,500. Expenses: Salaries R18,000, Maintenance R4,000. Balance (R)? (surplus positive, deficit negative)", answer: -500, explanation: "21,500 − 22,000 = R−500 deficit" },
  { question: "Revenue: Taxes R25,000, Fines R3,000. Costs: Salaries R20,000, Events R5,000. Net (R)?", answer: 3000, explanation: "28,000 − 25,000 = R3,000 surplus" },
  { question: "Income: R30,000 taxes, R2,000 fines. Expenses: R28,000 salaries, R3,000 other. Balance (R)?", answer: 1000, explanation: "32,000 − 31,000 = R1,000" },
  { question: "Taxes R12,000, Fines R1,000. Salaries R10,000, Event R2,500. Balance (R)?", answer: 500, explanation: "13,000 − 12,500 = R500" },
  { question: "Revenue R40,000. Expenses: Salaries R25,000, Rent R8,000, Supplies R5,000. Net (R)?", answer: 2000, explanation: "40,000 − 38,000 = R2,000" },
  { question: "Income R18,000. Expenses R19,500. Balance (R)? (deficit negative)", answer: -1500, explanation: "18,000 − 19,500 = R−1,500" },
  { question: "Taxes R22,000, Fines R2,500. Salaries R20,000, Equipment R6,000. Balance (R)?", answer: -1500, explanation: "24,500 − 26,000 = R−1,500" },
  { question: "Revenue R35,000. Salaries R22,000, Catering R4,000, Venue R7,000. Net (R)?", answer: 2000, explanation: "35,000 − 33,000 = R2,000" },
  { question: "Income R14,000. Expenses R16,000. Balance (R)?", answer: -2000, explanation: "14,000 − 16,000 = R−2,000" },
  { question: "Taxes R28,000, Fines R3,000. Salaries R24,000, Events R4,500. Balance (R)?", answer: 2500, explanation: "31,000 − 28,500 = R2,500" },
  { question: "Revenue R50,000. Salaries R30,000, Rent R12,000, Other R5,000. Net (R)?", answer: 3000, explanation: "50,000 − 47,000 = R3,000" },
  { question: "Income R16,000. Salaries R14,000, Event R3,500. Balance (R)?", answer: -1500, explanation: "16,000 − 17,500 = R−1,500" },
  { question: "Taxes R19,000, Fines R1,500. Expenses R21,000. Balance (R)?", answer: -500, explanation: "20,500 − 21,000 = R−500" },
  { question: "Revenue R45,000. Salaries R28,000, Maintenance R10,000, Other R4,000. Net (R)?", answer: 3000, explanation: "45,000 − 42,000 = R3,000" },
  { question: "Income R11,000. Expenses R13,200. Balance (R)?", answer: -2200, explanation: "11,000 − 13,200 = R−2,200" },
  { question: "Taxes R33,000, Fines R2,000. Salaries R26,000, Events R6,000. Balance (R)?", answer: 3000, explanation: "35,000 − 32,000 = R3,000" },
  { question: "Revenue R27,000. Salaries R18,000, Rent R5,000, Supplies R2,500. Net (R)?", answer: 1500, explanation: "27,000 − 25,500 = R1,500" },
  { question: "Income R23,000. Salaries R20,000, Event R4,000. Balance (R)?", answer: -1000, explanation: "23,000 − 24,000 = R−1,000" },
  { question: "Taxes R17,000, Fines R2,000. Expenses R16,500. Balance (R)?", answer: 2500, explanation: "19,000 − 16,500 = R2,500" }
];

const hardQuestions: FinancialManagerQuestion[] = [
  { question: "Town collected R20,000 in tax at 10% rate. What would revenue be (R) if tax increased to 12%?", answer: 24000, explanation: "Base 20,000÷0.10=200,000; 200,000×0.12=R24,000" },
  { question: "Payroll is R30,000 per month. Revenue is R25,000. How much (R) needs to be cut to balance?", answer: 5000, explanation: "30,000 − 25,000 = R5,000" },
  { question: "Tax revenue R15,000 at 10%. What revenue (R) at 15%?", answer: 22500, explanation: "Base 150,000; 150,000×0.15=R22,500" },
  { question: "Payroll R40,000. Revenue R35,000. How much (R) to cut to break even?", answer: 5000, explanation: "40,000 − 35,000 = R5,000" },
  { question: "Collected R24,000 at 12%. What would revenue (R) be at 15%?", answer: 30000, explanation: "Base 24,000÷0.12=200,000; 200,000×0.15=R30,000" },
  { question: "Salaries R50,000. Revenue R42,000. Cut needed (R)?", answer: 8000, explanation: "50,000 − 42,000 = R8,000" },
  { question: "Tax R18,000 at 9%. Revenue (R) at 12%?", answer: 24000, explanation: "Base 200,000; 200,000×0.12=R24,000" },
  { question: "Payroll R28,000. Revenue R25,000. How much (R) cut to balance?", answer: 3000, explanation: "28,000 − 25,000 = R3,000" },
  { question: "Collected R30,000 at 15%. Revenue (R) at 20%?", answer: 40000, explanation: "Base 200,000; 200,000×0.20=R40,000" },
  { question: "Salaries R45,000. Revenue R38,000. Cut (R)?", answer: 7000, explanation: "45,000 − 38,000 = R7,000" },
  { question: "Tax R12,000 at 10%. Revenue (R) at 15%?", answer: 18000, explanation: "Base 120,000; 120,000×0.15=R18,000" },
  { question: "Payroll R35,000. Revenue R31,000. Cut needed (R)?", answer: 4000, explanation: "35,000 − 31,000 = R4,000" },
  { question: "Collected R27,000 at 9%. Revenue (R) at 12%?", answer: 36000, explanation: "Base 300,000; 300,000×0.12=R36,000" },
  { question: "Salaries R52,000. Revenue R48,000. How much (R) to cut?", answer: 4000, explanation: "52,000 − 48,000 = R4,000" },
  { question: "Tax R16,000 at 8%. Revenue (R) at 10%?", answer: 20000, explanation: "Base 200,000; 200,000×0.10=R20,000" },
  { question: "Payroll R38,000. Revenue R33,000. Cut (R)?", answer: 5000, explanation: "38,000 − 33,000 = R5,000" },
  { question: "Collected R21,000 at 14%. Revenue (R) at 21%?", answer: 31500, explanation: "Base 150,000; 150,000×0.21=R31,500" },
  { question: "Salaries R48,000. Revenue R44,000. Cut needed (R)?", answer: 4000, explanation: "48,000 − 44,000 = R4,000" },
  { question: "Tax R25,000 at 10%. Revenue (R) at 14%?", answer: 35000, explanation: "Base 250,000; 250,000×0.14=R35,000" },
  { question: "Payroll R42,000. Revenue R39,000. How much (R) cut?", answer: 3000, explanation: "42,000 − 39,000 = R3,000" }
];

const extremeQuestions: FinancialManagerQuestion[] = [
  { question: "Town has 50 workers, average salary R8,000. Tax = 10%. Total monthly tax income (R)?", answer: 40000, explanation: "50×8,000=400,000; 400,000×0.10=R40,000" },
  { question: "Disaster costs R40,000. Monthly tax income R40,000. How many months of tax needed to recover?", answer: 1, explanation: "40,000 ÷ 40,000 = 1 month" },
  { question: "40 workers, avg salary R6,000. Tax 15%. Monthly tax income (R)?", answer: 36000, explanation: "40×6,000=240,000; 240,000×0.15=R36,000" },
  { question: "Recovery fund needed R72,000. Monthly tax R36,000. Months to recover?", answer: 2, explanation: "72,000 ÷ 36,000 = 2 months" },
  { question: "60 workers at R5,000 avg. Tax 12%. Total monthly tax (R)?", answer: 36000, explanation: "60×5,000=300,000; 300,000×0.12=R36,000" },
  { question: "Disaster R108,000. Monthly tax R36,000. Months to cover?", answer: 3, explanation: "108,000 ÷ 36,000 = 3 months" },
  { question: "30 workers, avg R10,000. Tax 10%. Monthly tax income (R)?", answer: 30000, explanation: "30×10,000=300,000; 300,000×0.10=R30,000" },
  { question: "Crisis cost R90,000. Tax income R30,000/month. Months to recover?", answer: 3, explanation: "90,000 ÷ 30,000 = 3" },
  { question: "80 workers at R4,000. Tax 20%. Monthly tax (R)?", answer: 64000, explanation: "80×4,000=320,000; 320,000×0.20=R64,000" },
  { question: "Reserve needed R128,000. Monthly tax R64,000. How many months?", answer: 2, explanation: "128,000 ÷ 64,000 = 2" },
  { question: "25 workers, avg R12,000. Tax 15%. Monthly tax (R)?", answer: 45000, explanation: "25×12,000=300,000; 300,000×0.15=R45,000" },
  { question: "Emergency R135,000. Tax R45,000/month. Months?", answer: 3, explanation: "135,000 ÷ 45,000 = 3" },
  { question: "70 workers at R7,000. Tax 10%. Monthly tax income (R)?", answer: 49000, explanation: "70×7,000=490,000; 490,000×0.10=R49,000" },
  { question: "Disaster R98,000. Monthly tax R49,000. Months to recover?", answer: 2, explanation: "98,000 ÷ 49,000 = 2" },
  { question: "45 workers, avg R9,000. Tax 12%. Monthly tax (R)?", answer: 48600, explanation: "45×9,000=405,000; 405,000×0.12=R48,600" },
  { question: "Recovery R97,200. Tax R48,600/month. Months?", answer: 2, explanation: "97,200 ÷ 48,600 = 2" },
  { question: "55 workers at R6,500. Tax 10%. Monthly tax (R)?", answer: 35750, explanation: "55×6,500=357,500; 357,500×0.10=R35,750" },
  { question: "Crisis R71,500. Tax R35,750/month. Months?", answer: 2, explanation: "71,500 ÷ 35,750 = 2" },
  { question: "35 workers, avg R11,000. Tax 15%. Monthly tax (R)?", answer: 57750, explanation: "35×11,000=385,000; 385,000×0.15=R57,750" },
  { question: "Reserve R115,500. Tax R57,750/month. How many months?", answer: 2, explanation: "115,500 ÷ 57,750 = 2" }
];

export function getFinancialManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): FinancialManagerQuestion {
  let questions: FinancialManagerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
