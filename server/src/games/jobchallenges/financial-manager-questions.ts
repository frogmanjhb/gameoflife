// Financial Manager – Town Finance Challenge (Payroll Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface FinancialManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Salary & Tax (percentages, gross vs net, multiplication)
export const easyQuestions: FinancialManagerQuestion[] = [
  { question: "Gross salary = R11,500. Tax rate = 12%. How much tax is deducted (R)?", answer: 1380, explanation: "11,500 × 0.12 = R1,380" },
  { question: "Gross salary R11,500. Tax 12%. What is net salary (R)?", answer: 10120, explanation: "11,500 − 1,380 = R10,120" },
  { question: "4 town clerks earn R2,750 each. Total payroll (R)?", answer: 11000, explanation: "4 × 2,750 = R11,000" },
  { question: "Gross salary R16,800. Tax 18%. Tax deducted (R)?", answer: 3024, explanation: "16,800 × 0.18 = R3,024" },
  { question: "Gross salary R16,800. Tax 18%. Net salary (R)?", answer: 13776, explanation: "16,800 − 3,024 = R13,776" },
  { question: "7 market inspectors earn R2,400 each. Total payroll (R)?", answer: 16800, explanation: "7 × 2,400 = R16,800" },
  { question: "Gross salary R9,200. Tax rate 15%. Tax (R)?", answer: 1380, explanation: "9,200 × 0.15 = R1,380" },
  { question: "Gross salary R9,200. Tax 15%. Net (R)?", answer: 7820, explanation: "9,200 − 1,380 = R7,820" },
  { question: "5 librarians earn R3,200 each. Total payroll (R)?", answer: 16000, explanation: "5 × 3,200 = R16,000" },
  { question: "Gross salary R13,600. Tax 22%. Tax deducted (R)?", answer: 2992, explanation: "13,600 × 0.22 = R2,992" },
  { question: "Gross salary R13,600. Tax 22%. Net salary (R)?", answer: 10608, explanation: "13,600 − 2,992 = R10,608" },
  { question: "9 gardeners earn R1,800 each. Total payroll (R)?", answer: 16200, explanation: "9 × 1,800 = R16,200" },
  { question: "Gross R22,400. Tax 10%. Tax (R)?", answer: 2240, explanation: "22,400 × 0.10 = R2,240" },
  { question: "Gross R22,400. Tax 10%. Net (R)?", answer: 20160, explanation: "22,400 − 2,240 = R20,160" },
  { question: "6 security guards earn R4,500 each. Total payroll (R)?", answer: 27000, explanation: "6 × 4,500 = R27,000" },
  { question: "Gross salary R7,400. Tax 8%. Tax deducted (R)?", answer: 592, explanation: "7,400 × 0.08 = R592" },
  { question: "Gross salary R7,400. Tax 8%. Net salary (R)?", answer: 6808, explanation: "7,400 − 592 = R6,808" },
  { question: "3 bus drivers earn R5,600 each. Total payroll (R)?", answer: 16800, explanation: "3 × 5,600 = R16,800" },
  { question: "Gross R19,500. Tax 16%. Tax (R)?", answer: 3120, explanation: "19,500 × 0.16 = R3,120" },
  { question: "Gross R19,500. Tax 16%. Net (R)?", answer: 16380, explanation: "19,500 − 3,120 = R16,380" }
];

// MEDIUM – Budget Balancing (multi-step, revenue vs expenses)
export const mediumQuestions: FinancialManagerQuestion[] = [
  { question: "Town income: Rates R18,500, Parking fines R2,500. Expenses: Salaries R14,000, Festival R4,500. Balance (R)? (surplus positive, deficit negative)", answer: 2500, explanation: "Income 21,000 − expenses 18,500 = R2,500 surplus" },
  { question: "Income: Rates R23,000, Permits R1,800. Expenses: Salaries R20,500, Repairs R5,200. Balance (R)?", answer: -900, explanation: "24,800 − 25,700 = R−900 deficit" },
  { question: "Revenue: Rates R28,500, Fines R3,500. Costs: Salaries R22,000, Sports day R6,000. Net (R)?", answer: 4000, explanation: "32,000 − 28,000 = R4,000 surplus" },
  { question: "Income: R34,000 rates, R2,200 permits. Expenses: R29,500 salaries, R4,800 supplies. Balance (R)?", answer: 1900, explanation: "36,200 − 34,300 = R1,900" },
  { question: "Rates R14,600, Fines R1,400. Salaries R12,800, Community event R3,200. Balance (R)?", answer: 0, explanation: "16,000 − 16,000 = R0" },
  { question: "Revenue R43,000. Expenses: Salaries R27,500, Rent R9,500, Utilities R4,000. Net (R)?", answer: 2000, explanation: "43,000 − 41,000 = R2,000" },
  { question: "Income R19,800. Expenses R22,400. Balance (R)? (deficit negative)", answer: -2600, explanation: "19,800 − 22,400 = R−2,600" },
  { question: "Rates R25,500, Fines R3,200. Salaries R23,000, Equipment R7,500. Balance (R)?", answer: -1800, explanation: "28,700 − 30,500 = R−1,800" },
  { question: "Revenue R38,500. Salaries R24,000, Catering R5,500, Venue R6,500. Net (R)?", answer: 2500, explanation: "38,500 − 36,000 = R2,500" },
  { question: "Income R15,600. Expenses R18,200. Balance (R)?", answer: -2600, explanation: "15,600 − 18,200 = R−2,600" },
  { question: "Rates R31,000, Fines R3,800. Salaries R26,500, Heritage day R5,800. Balance (R)?", answer: 2500, explanation: "34,800 − 32,300 = R2,500" },
  { question: "Revenue R55,000. Salaries R33,000, Rent R14,000, Other R6,500. Net (R)?", answer: 1500, explanation: "55,000 − 53,500 = R1,500" },
  { question: "Income R17,400. Salaries R15,200, Market setup R4,600. Balance (R)?", answer: -2400, explanation: "17,400 − 19,800 = R−2,400" },
  { question: "Rates R21,500, Permits R2,100. Total expenses R24,800. Balance (R)?", answer: -1200, explanation: "23,600 − 24,800 = R−1,200" },
  { question: "Revenue R48,000. Salaries R30,500, Maintenance R11,500, Other R4,500. Net (R)?", answer: 1500, explanation: "48,000 − 46,500 = R1,500" },
  { question: "Income R12,800. Expenses R15,900. Balance (R)?", answer: -3100, explanation: "12,800 − 15,900 = R−3,100" },
  { question: "Rates R36,500, Fines R2,700. Salaries R28,000, Youth programme R7,500. Balance (R)?", answer: 3700, explanation: "39,200 − 35,500 = R3,700" },
  { question: "Revenue R29,800. Salaries R19,500, Rent R6,300, Supplies R3,200. Net (R)?", answer: 800, explanation: "29,800 − 29,000 = R800" },
  { question: "Income R25,600. Salaries R22,400, Town hall event R5,200. Balance (R)?", answer: -2000, explanation: "25,600 − 27,600 = R−2,000" },
  { question: "Rates R19,200, Fines R2,300. Total expenses R18,900. Balance (R)?", answer: 2600, explanation: "21,500 − 18,900 = R2,600" }
];

// HARD – Forecasting & Adjustments (projections, adjusting rates)
export const hardQuestions: FinancialManagerQuestion[] = [
  { question: "Town collected R22,500 in tax at 9% rate. What would revenue be (R) if tax increased to 12%?", answer: 30000, explanation: "Base 22,500÷0.09=250,000; 250,000×0.12=R30,000" },
  { question: "Payroll is R34,000 per month. Revenue is R28,500. How much (R) needs to be cut to balance?", answer: 5500, explanation: "34,000 − 28,500 = R5,500" },
  { question: "Tax revenue R18,000 at 12%. What revenue (R) at 15%?", answer: 22500, explanation: "Base 150,000; 150,000×0.15=R22,500" },
  { question: "Payroll R46,000. Revenue R39,000. How much (R) to cut to break even?", answer: 7000, explanation: "46,000 − 39,000 = R7,000" },
  { question: "Collected R28,800 at 12%. What would revenue (R) be at 16%?", answer: 38400, explanation: "Base 28,800÷0.12=240,000; 240,000×0.16=R38,400" },
  { question: "Salaries R55,000. Revenue R47,000. Cut needed (R)?", answer: 8000, explanation: "55,000 − 47,000 = R8,000" },
  { question: "Tax R21,600 at 9%. Revenue (R) at 12%?", answer: 28800, explanation: "Base 240,000; 240,000×0.12=R28,800" },
  { question: "Payroll R32,000. Revenue R27,500. How much (R) cut to balance?", answer: 4500, explanation: "32,000 − 27,500 = R4,500" },
  { question: "Collected R36,000 at 15%. Revenue (R) at 20%?", answer: 48000, explanation: "Base 240,000; 240,000×0.20=R48,000" },
  { question: "Salaries R50,000. Revenue R42,500. Cut (R)?", answer: 7500, explanation: "50,000 − 42,500 = R7,500" },
  { question: "Tax R14,400 at 12%. Revenue (R) at 18%?", answer: 21600, explanation: "Base 120,000; 120,000×0.18=R21,600" },
  { question: "Payroll R38,500. Revenue R33,500. Cut needed (R)?", answer: 5000, explanation: "38,500 − 33,500 = R5,000" },
  { question: "Collected R33,000 at 11%. Revenue (R) at 14%?", answer: 42000, explanation: "Base 33,000÷0.11=300,000; 300,000×0.14=R42,000" },
  { question: "Salaries R58,000. Revenue R52,000. How much (R) to cut?", answer: 6000, explanation: "58,000 − 52,000 = R6,000" },
  { question: "Tax R19,200 at 8%. Revenue (R) at 10%?", answer: 24000, explanation: "Base 240,000; 240,000×0.10=R24,000" },
  { question: "Payroll R41,000. Revenue R35,500. Cut (R)?", answer: 5500, explanation: "41,000 − 35,500 = R5,500" },
  { question: "Collected R25,200 at 14%. Revenue (R) at 21%?", answer: 37800, explanation: "Base 180,000; 180,000×0.21=R37,800" },
  { question: "Salaries R52,500. Revenue R47,500. Cut needed (R)?", answer: 5000, explanation: "52,500 − 47,500 = R5,000" },
  { question: "Tax R28,000 at 10%. Revenue (R) at 14%?", answer: 39200, explanation: "Base 280,000; 280,000×0.14=R39,200" },
  { question: "Payroll R45,500. Revenue R41,000. How much (R) cut?", answer: 4500, explanation: "45,500 − 41,000 = R4,500" }
];

// EXTREME – Economic Strategy (modelling, break-even, multi-variable)
export const extremeQuestions: FinancialManagerQuestion[] = [
  { question: "Town has 55 workers, average salary R7,200. Tax = 11%. Total monthly tax income (R)?", answer: 43560, explanation: "55×7,200=396,000; 396,000×0.11=R43,560" },
  { question: "Flood repairs cost R43,560. Monthly tax income R43,560. How many months of tax to recover?", answer: 1, explanation: "43,560 ÷ 43,560 = 1 month" },
  { question: "45 workers, avg salary R6,800. Tax 14%. Monthly tax income (R)?", answer: 42840, explanation: "45×6,800=306,000; 306,000×0.14=R42,840" },
  { question: "Emergency fund needed R85,680. Monthly tax R42,840. Months to recover?", answer: 2, explanation: "85,680 ÷ 42,840 = 2 months" },
  { question: "65 workers at R5,500 avg. Tax 13%. Total monthly tax (R)?", answer: 46475, explanation: "65×5,500=357,500; 357,500×0.13=R46,475" },
  { question: "Storm damage R139,425. Monthly tax R46,475. Months to cover?", answer: 3, explanation: "139,425 ÷ 46,475 = 3 months" },
  { question: "35 workers, avg R9,500. Tax 12%. Monthly tax income (R)?", answer: 39900, explanation: "35×9,500=332,500; 332,500×0.12=R39,900" },
  { question: "Bridge repair R119,700. Tax income R39,900/month. Months to recover?", answer: 3, explanation: "119,700 ÷ 39,900 = 3" },
  { question: "75 workers at R4,800. Tax 18%. Monthly tax (R)?", answer: 64800, explanation: "75×4,800=360,000; 360,000×0.18=R64,800" },
  { question: "Reserve needed R129,600. Monthly tax R64,800. How many months?", answer: 2, explanation: "129,600 ÷ 64,800 = 2" },
  { question: "28 workers, avg R11,500. Tax 16%. Monthly tax (R)?", answer: 51520, explanation: "28×11,500=322,000; 322,000×0.16=R51,520" },
  { question: "Water crisis costs R154,560. Tax R51,520/month. Months?", answer: 3, explanation: "154,560 ÷ 51,520 = 3" },
  { question: "62 workers at R6,900. Tax 11%. Monthly tax income (R)?", answer: 47058, explanation: "62×6,900=427,800; 427,800×0.11=R47,058" },
  { question: "Road collapse repair R94,116. Monthly tax R47,058. Months to recover?", answer: 2, explanation: "94,116 ÷ 47,058 = 2" },
  { question: "48 workers, avg R8,750. Tax 13%. Monthly tax (R)?", answer: 54600, explanation: "48×8,750=420,000; 420,000×0.13=R54,600" },
  { question: "Fire damage fund R109,200. Tax R54,600/month. Months?", answer: 2, explanation: "109,200 ÷ 54,600 = 2" },
  { question: "52 workers at R6,250. Tax 10%. Monthly tax (R)?", answer: 32500, explanation: "52×6,250=325,000; 325,000×0.10=R32,500" },
  { question: "Drought relief R65,000. Tax R32,500/month. Months?", answer: 2, explanation: "65,000 ÷ 32,500 = 2" },
  { question: "38 workers, avg R10,200. Tax 15%. Monthly tax (R)?", answer: 58140, explanation: "38×10,200=387,600; 387,600×0.15=R58,140" },
  { question: "Hospital upgrade reserve R174,420. Tax R58,140/month. How many months?", answer: 3, explanation: "174,420 ÷ 58,140 = 3" }
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
