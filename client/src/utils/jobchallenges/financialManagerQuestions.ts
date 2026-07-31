// Financial Manager – Town Finance Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface FinancialManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Payroll Tax & Net Salary
const easyQuestions: FinancialManagerQuestion[] = [
  { question: "Gross salary = R12,800. Tax rate = 10%. How much tax is deducted (R)?", answer: 1280, explanation: "12,800 × 0.10 = R1,280" },
  { question: "Gross salary R12,800. Tax 10%. What is net salary (R)?", answer: 11520, explanation: "12,800 − 1,280 = R11,520" },
  { question: "5 town clerks earn R3,100 each. Total payroll (R)?", answer: 15500, explanation: "5 × 3,100 = R15,500" },
  { question: "Gross salary R18,400. Tax 20%. Tax deducted (R)?", answer: 3680, explanation: "18,400 × 0.20 = R3,680" },
  { question: "Gross salary R18,400. Tax 20%. Net salary (R)?", answer: 14720, explanation: "18,400 − 3,680 = R14,720" },
  { question: "8 market inspectors earn R2,750 each. Total payroll (R)?", answer: 22000, explanation: "8 × 2,750 = R22,000" },
  { question: "Gross salary R10,500. Tax rate 12%. Tax (R)?", answer: 1260, explanation: "10,500 × 0.12 = R1,260" },
  { question: "Gross salary R10,500. Tax 12%. Net (R)?", answer: 9240, explanation: "10,500 − 1,260 = R9,240" },
  { question: "6 librarians earn R3,500 each. Total payroll (R)?", answer: 21000, explanation: "6 × 3,500 = R21,000" },
  { question: "Gross salary R15,200. Tax 25%. Tax deducted (R)?", answer: 3800, explanation: "15,200 × 0.25 = R3,800" },
  { question: "Gross salary R15,200. Tax 25%. Net salary (R)?", answer: 11400, explanation: "15,200 − 3,800 = R11,400" },
  { question: "10 gardeners earn R1,950 each. Total payroll (R)?", answer: 19500, explanation: "10 × 1,950 = R19,500" },
  { question: "Gross R24,000. Tax 10%. Tax (R)?", answer: 2400, explanation: "24,000 × 0.10 = R2,400" },
  { question: "Gross R24,000. Tax 10%. Net (R)?", answer: 21600, explanation: "24,000 − 2,400 = R21,600" },
  { question: "7 security guards earn R4,200 each. Total payroll (R)?", answer: 29400, explanation: "7 × 4,200 = R29,400" },
  { question: "Gross salary R8,600. Tax 5%. Tax deducted (R)?", answer: 430, explanation: "8,600 × 0.05 = R430" },
  { question: "Gross salary R8,600. Tax 5%. Net salary (R)?", answer: 8170, explanation: "8,600 − 430 = R8,170" },
  { question: "4 bus drivers earn R6,250 each. Total payroll (R)?", answer: 25000, explanation: "4 × 6,250 = R25,000" },
  { question: "Gross R21,000. Tax 14%. Tax (R)?", answer: 2940, explanation: "21,000 × 0.14 = R2,940" },
  { question: "Gross R21,000. Tax 14%. Net (R)?", answer: 18060, explanation: "21,000 − 2,940 = R18,060" },
];

// MEDIUM – Town Income & Expense Balance
const mediumQuestions: FinancialManagerQuestion[] = [
  { question: "Town income: Rates R20,500, Parking fines R2,800. Expenses: Salaries R16,000, Festival R5,500. Balance (R)? (surplus positive, deficit negative)", answer: 1800, explanation: "Income 23,300 − expenses 21,500 = R1,800 surplus" },
  { question: "Income: Rates R26,000, Permits R2,400. Expenses: Salaries R22,500, Repairs R6,200. Balance (R)?", answer: -300, explanation: "28,400 − 28,700 = R−300 deficit" },
  { question: "Revenue: Rates R32,000, Fines R4,000. Costs: Salaries R25,000, Sports day R8,000. Net (R)?", answer: 3000, explanation: "36,000 − 33,000 = R3,000 surplus" },
  { question: "Income: R38,000 rates, R2,600 permits. Expenses: R32,000 salaries, R5,800 supplies. Balance (R)?", answer: 2800, explanation: "40,600 − 37,800 = R2,800" },
  { question: "Rates R16,800, Fines R1,600. Salaries R14,200, Community event R4,200. Balance (R)?", answer: 0, explanation: "18,400 − 18,400 = R0" },
  { question: "Revenue R46,000. Expenses: Salaries R29,000, Rent R10,500, Utilities R4,500. Net (R)?", answer: 2000, explanation: "46,000 − 44,000 = R2,000" },
  { question: "Income R21,500. Expenses R24,800. Balance (R)? (deficit negative)", answer: -3300, explanation: "21,500 − 24,800 = R−3,300" },
  { question: "Rates R28,000, Fines R3,500. Salaries R26,000, Equipment R8,500. Balance (R)?", answer: -3000, explanation: "31,500 − 34,500 = R−3,000" },
  { question: "Revenue R41,500. Salaries R27,000, Catering R6,000, Venue R7,000. Net (R)?", answer: 1500, explanation: "41,500 − 40,000 = R1,500" },
  { question: "Income R18,200. Expenses R20,600. Balance (R)?", answer: -2400, explanation: "18,200 − 20,600 = R−2,400" },
  { question: "Rates R34,500, Fines R4,200. Salaries R29,000, Heritage day R6,200. Balance (R)?", answer: 3500, explanation: "38,700 − 35,200 = R3,500" },
  { question: "Revenue R58,000. Salaries R35,000, Rent R15,500, Other R7,000. Net (R)?", answer: 500, explanation: "58,000 − 57,500 = R500" },
  { question: "Income R19,800. Salaries R17,500, Market setup R5,800. Balance (R)?", answer: -3500, explanation: "19,800 − 23,300 = R−3,500" },
  { question: "Rates R24,000, Permits R2,400. Total expenses R27,800. Balance (R)?", answer: -1400, explanation: "26,400 − 27,800 = R−1,400" },
  { question: "Revenue R51,000. Salaries R33,000, Maintenance R12,500, Other R5,000. Net (R)?", answer: 500, explanation: "51,000 − 50,500 = R500" },
  { question: "Income R14,500. Expenses R17,800. Balance (R)?", answer: -3300, explanation: "14,500 − 17,800 = R−3,300" },
  { question: "Rates R40,000, Fines R3,200. Salaries R31,000, Youth programme R8,500. Balance (R)?", answer: 3700, explanation: "43,200 − 39,500 = R3,700" },
  { question: "Revenue R32,500. Salaries R21,000, Rent R7,000, Supplies R3,800. Net (R)?", answer: 700, explanation: "32,500 − 31,800 = R700" },
  { question: "Income R28,000. Salaries R24,500, Town hall event R6,800. Balance (R)?", answer: -3300, explanation: "28,000 − 31,300 = R−3,300" },
  { question: "Rates R22,400, Fines R2,600. Total expenses R21,500. Balance (R)?", answer: 3500, explanation: "25,000 − 21,500 = R3,500" },
];

// HARD – Tax Rate Changes & Payroll Cuts
const hardQuestions: FinancialManagerQuestion[] = [
  { question: "Town collected R24,750 in tax at 11% rate. What would revenue be (R) if tax increased to 15%?", answer: 33750, explanation: "Base 24,750÷0.11=225,000; 225,000×0.15=R33,750" },
  { question: "Payroll is R38,000 per month. Revenue is R31,500. How much (R) needs to be cut to balance?", answer: 6500, explanation: "38,000 − 31,500 = R6,500" },
  { question: "Tax revenue R20,400 at 12%. What revenue (R) at 18%?", answer: 30600, explanation: "Base 170,000; 170,000×0.18=R30,600" },
  { question: "Payroll R52,000. Revenue R44,000. How much (R) to cut to break even?", answer: 8000, explanation: "52,000 − 44,000 = R8,000" },
  { question: "Collected R31,200 at 13%. What would revenue (R) be at 17%?", answer: 40800, explanation: "Base 31,200÷0.13=240,000; 240,000×0.17=R40,800" },
  { question: "Salaries R48,000. Revenue R40,500. Cut needed (R)?", answer: 7500, explanation: "48,000 − 40,500 = R7,500" },
  { question: "Tax R19,800 at 9%. Revenue (R) at 12%?", answer: 26400, explanation: "Base 220,000; 220,000×0.12=R26,400" },
  { question: "Payroll R36,000. Revenue R30,000. How much (R) cut to balance?", answer: 6000, explanation: "36,000 − 30,000 = R6,000" },
  { question: "Collected R42,000 at 14%. Revenue (R) at 20%?", answer: 60000, explanation: "Base 300,000; 300,000×0.20=R60,000" },
  { question: "Salaries R62,000. Revenue R53,000. Cut (R)?", answer: 9000, explanation: "62,000 − 53,000 = R9,000" },
  { question: "Tax R16,200 at 15%. Revenue (R) at 22%?", answer: 23760, explanation: "Base 108,000; 108,000×0.22=R23,760" },
  { question: "Payroll R44,000. Revenue R38,000. Cut needed (R)?", answer: 6000, explanation: "44,000 − 38,000 = R6,000" },
  { question: "Collected R35,200 at 11%. Revenue (R) at 16%?", answer: 51200, explanation: "Base 35,200÷0.11=320,000; 320,000×0.16=R51,200" },
  { question: "Salaries R56,000. Revenue R49,000. How much (R) to cut?", answer: 7000, explanation: "56,000 − 49,000 = R7,000" },
  { question: "Tax R22,500 at 10%. Revenue (R) at 15%?", answer: 33750, explanation: "Base 225,000; 225,000×0.15=R33,750" },
  { question: "Payroll R42,000. Revenue R36,500. Cut (R)?", answer: 5500, explanation: "42,000 − 36,500 = R5,500" },
  { question: "Collected R27,300 at 13%. Revenue (R) at 21%?", answer: 44100, explanation: "Base 210,000; 210,000×0.21=R44,100" },
  { question: "Salaries R54,000. Revenue R48,500. Cut needed (R)?", answer: 5500, explanation: "54,000 − 48,500 = R5,500" },
  { question: "Tax R32,000 at 8%. Revenue (R) at 12%?", answer: 48000, explanation: "Base 400,000; 400,000×0.12=R48,000" },
  { question: "Payroll R47,000. Revenue R42,000. How much (R) cut?", answer: 5000, explanation: "47,000 − 42,000 = R5,000" },
];

// EXTREME – Payroll Tax Income & Recovery Time
const extremeQuestions: FinancialManagerQuestion[] = [
  { question: "Town has 48 workers, average salary R7,500. Tax = 12%. Total monthly tax income (R)?", answer: 43200, explanation: "48×7,500=360,000; 360,000×0.12=R43,200" },
  { question: "Flood repairs cost R86,400. Monthly tax income R43,200. How many months of tax to recover?", answer: 2, explanation: "86,400 ÷ 43,200 = 2 months" },
  { question: "52 workers, avg salary R6,500. Tax 15%. Monthly tax income (R)?", answer: 50700, explanation: "52×6,500=338,000; 338,000×0.15=R50,700" },
  { question: "Emergency fund needed R101,400. Monthly tax R50,700. Months to recover?", answer: 2, explanation: "101,400 ÷ 50,700 = 2 months" },
  { question: "60 workers at R5,800 avg. Tax 14%. Total monthly tax (R)?", answer: 48720, explanation: "60×5,800=348,000; 348,000×0.14=R48,720" },
  { question: "Storm damage R146,160. Monthly tax R48,720. Months to cover?", answer: 3, explanation: "146,160 ÷ 48,720 = 3 months" },
  { question: "40 workers, avg R9,800. Tax 11%. Monthly tax income (R)?", answer: 43120, explanation: "40×9,800=392,000; 392,000×0.11=R43,120" },
  { question: "Bridge repair R129,360. Tax income R43,120/month. Months to recover?", answer: 3, explanation: "129,360 ÷ 43,120 = 3" },
  { question: "70 workers at R5,200. Tax 16%. Monthly tax (R)?", answer: 58240, explanation: "70×5,200=364,000; 364,000×0.16=R58,240" },
  { question: "Reserve needed R116,480. Monthly tax R58,240. How many months?", answer: 2, explanation: "116,480 ÷ 58,240 = 2" },
  { question: "32 workers, avg R10,800. Tax 13%. Monthly tax (R)?", answer: 44928, explanation: "32×10,800=345,600; 345,600×0.13=R44,928" },
  { question: "Water crisis costs R134,784. Tax R44,928/month. Months?", answer: 3, explanation: "134,784 ÷ 44,928 = 3" },
  { question: "58 workers at R7,200. Tax 12%. Monthly tax income (R)?", answer: 50112, explanation: "58×7,200=417,600; 417,600×0.12=R50,112" },
  { question: "Road collapse repair R100,224. Monthly tax R50,112. Months to recover?", answer: 2, explanation: "100,224 ÷ 50,112 = 2" },
  { question: "44 workers, avg R8,500. Tax 14%. Monthly tax (R)?", answer: 52360, explanation: "44×8,500=374,000; 374,000×0.14=R52,360" },
  { question: "Fire damage fund R104,720. Tax R52,360/month. Months?", answer: 2, explanation: "104,720 ÷ 52,360 = 2" },
  { question: "55 workers at R6,400. Tax 10%. Monthly tax (R)?", answer: 35200, explanation: "55×6,400=352,000; 352,000×0.10=R35,200" },
  { question: "Drought relief R70,400. Tax R35,200/month. Months?", answer: 2, explanation: "70,400 ÷ 35,200 = 2" },
  { question: "36 workers, avg R11,200. Tax 15%. Monthly tax (R)?", answer: 60480, explanation: "36×11,200=403,200; 403,200×0.15=R60,480" },
  { question: "Hospital upgrade reserve R181,440. Tax R60,480/month. How many months?", answer: 3, explanation: "181,440 ÷ 60,480 = 3" },
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
