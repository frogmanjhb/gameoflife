// Chartered Accountant – Financial Audit Challenges (client, same as server)
// 20 questions per difficulty tier

export interface AccountantQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: AccountantQuestion[] = [
  { question: "A teacher earns R8,000. Expenses are R5,200. What is the net amount left?", answer: 2800, explanation: "8000 - 5200 = R2,800" },
  { question: "A shop made R12,500 revenue and spent R9,000. What is the profit?", answer: 3500, explanation: "12500 - 9000 = R3,500" },
  { question: "Income: R15,000. Expenses: R7,400. Net amount?", answer: 7600, explanation: "15000 - 7400 = R7,600" },
  { question: "Revenue R22,000. Costs R14,500. Profit?", answer: 7500, explanation: "22000 - 14500 = R7,500" },
  { question: "Salary R9,500. Spending R6,200. How much is left?", answer: 3300, explanation: "9500 - 6200 = R3,300" },
  { question: "Sales R18,000. Expenses R11,300. Net profit?", answer: 6700, explanation: "18000 - 11300 = R6,700" },
  { question: "Earnings R14,000. Bills R8,700. Savings?", answer: 5300, explanation: "14000 - 8700 = R5,300" },
  { question: "Revenue R25,000. Expenses R16,400. Profit?", answer: 8600, explanation: "25000 - 16400 = R8,600" },
  { question: "Income R11,200. Expenses R4,900. Net?", answer: 6300, explanation: "11200 - 4900 = R6,300" },
  { question: "Sales R19,500. Costs R12,100. Profit?", answer: 7400, explanation: "19500 - 12100 = R7,400" },
  { question: "Earnings R13,600. Spending R7,800. Amount left?", answer: 5800, explanation: "13600 - 7800 = R5,800" },
  { question: "Revenue R27,000. Expenses R18,200. Net profit?", answer: 8800, explanation: "27000 - 18200 = R8,800" },
  { question: "Income R10,400. Expenses R5,600. Net?", answer: 4800, explanation: "10400 - 5600 = R4,800" },
  { question: "Shop revenue R16,200. Costs R9,400. Profit?", answer: 6800, explanation: "16200 - 9400 = R6,800" },
  { question: "Salary R12,800. Bills R6,500. Left?", answer: 6300, explanation: "12800 - 6500 = R6,300" },
  { question: "Revenue R21,400. Expenses R13,700. Net?", answer: 7700, explanation: "21400 - 13700 = R7,700" },
  { question: "Income R17,000. Spending R10,200. Savings?", answer: 6800, explanation: "17000 - 10200 = R6,800" },
  { question: "Sales R24,600. Costs R15,900. Profit?", answer: 8700, explanation: "24600 - 15900 = R8,700" },
  { question: "Earnings R9,800. Expenses R4,100. Net?", answer: 5700, explanation: "9800 - 4100 = R5,700" },
  { question: "Revenue R20,000. Expenses R12,300. Net profit?", answer: 7700, explanation: "20000 - 12300 = R7,700" }
];

const mediumQuestions: AccountantQuestion[] = [
  { question: "Salary: R15,000. Tax: 15%. How much tax is paid?", answer: 2250, explanation: "15000 × 0.15 = R2,250" },
  { question: "Salary R15,000. Tax 15%. What is the net salary?", answer: 12750, explanation: "15000 - 2250 = R12,750" },
  { question: "Loan R20,000. Interest 8%. Interest amount?", answer: 1600, explanation: "20000 × 0.08 = R1,600" },
  { question: "Gross salary R24,000. Tax 20%. Net salary?", answer: 19200, explanation: "24000 × 0.80 = R19,200" },
  { question: "Amount R10,000. VAT 15%. VAT amount?", answer: 1500, explanation: "10000 × 0.15 = R1,500" },
  { question: "Salary R18,000. Tax 18%. Tax paid?", answer: 3240, explanation: "18000 × 0.18 = R3,240" },
  { question: "Loan R25,000. Interest 10%. Interest?", answer: 2500, explanation: "25000 × 0.10 = R2,500" },
  { question: "Gross R30,000. Deduction 22%. Net?", answer: 23400, explanation: "30000 × 0.78 = R23,400" },
  { question: "Price R8,000. Discount 12%. Discount amount?", answer: 960, explanation: "8000 × 0.12 = R960" },
  { question: "Salary R12,000. Tax 16%. Net salary?", answer: 10080, explanation: "12000 × 0.84 = R10,080" },
  { question: "Principal R50,000. Interest 6%. Interest?", answer: 3000, explanation: "50000 × 0.06 = R3,000" },
  { question: "Gross R28,000. Tax 25%. Tax amount?", answer: 7000, explanation: "28000 × 0.25 = R7,000" },
  { question: "Amount R14,000. VAT 15%. Total including VAT?", answer: 16100, explanation: "14000 × 1.15 = R16,100" },
  { question: "Salary R22,000. Tax 18%. Net?", answer: 18040, explanation: "22000 × 0.82 = R18,040" },
  { question: "Loan R35,000. Interest 9%. Interest?", answer: 3150, explanation: "35000 × 0.09 = R3,150" },
  { question: "Gross R16,000. Deduction 15%. Net?", answer: 13600, explanation: "16000 × 0.85 = R13,600" },
  { question: "Price R11,000. Tax 15%. Tax amount?", answer: 1650, explanation: "11000 × 0.15 = R1,650" },
  { question: "Salary R26,000. Tax 20%. Net salary?", answer: 20800, explanation: "26000 × 0.80 = R20,800" },
  { question: "Principal R40,000. Rate 7%. Interest?", answer: 2800, explanation: "40000 × 0.07 = R2,800" },
  { question: "Gross R32,000. Tax 24%. Tax paid?", answer: 7680, explanation: "32000 × 0.24 = R7,680" }
];

const hardQuestions: AccountantQuestion[] = [
  { question: "Town income: Tax R25,000, Business fees R10,000. Town expenses: Infrastructure R18,000, Salaries R12,000. Surplus or deficit? (surplus=positive, deficit=negative)", answer: 5000, explanation: "Income 35000 - Expenses 30000 = R5,000 surplus" },
  { question: "Expenses increased from R5,000 to R6,500. What is the percentage increase?", answer: 30, explanation: "(6500-5000)/5000 × 100 = 30%" },
  { question: "Income: R40,000. Expenses: R28,000. Surplus amount?", answer: 12000, explanation: "40000 - 28000 = R12,000" },
  { question: "Revenue was R12,000, now R15,600. Percentage increase?", answer: 30, explanation: "(15600-12000)/12000 × 100 = 30%" },
  { question: "Budget: Income R50,000. Spending R54,000. Deficit amount? (positive number)", answer: 4000, explanation: "54000 - 50000 = R4,000 deficit" },
  { question: "Sales dropped from R20,000 to R17,000. Percentage decrease?", answer: 15, explanation: "(20000-17000)/20000 × 100 = 15%" },
  { question: "Income R35,000. Costs R22,000. Surplus?", answer: 13000, explanation: "35000 - 22000 = R13,000" },
  { question: "Price R8,000 increased by 25%. New price?", answer: 10000, explanation: "8000 × 1.25 = R10,000" },
  { question: "Total income R45,000. Total expenses R38,500. Net?", answer: 6500, explanation: "45000 - 38500 = R6,500" },
  { question: "Expenses R9,000 to R10,800. Percentage increase?", answer: 20, explanation: "(10800-9000)/9000 × 100 = 20%" },
  { question: "Income R60,000. Expenses R52,000. Surplus?", answer: 8000, explanation: "60000 - 52000 = R8,000" },
  { question: "Revenue R18,000 decreased by 15%. New revenue?", answer: 15300, explanation: "18000 × 0.85 = R15,300" },
  { question: "Income R42,000. Expenses R47,000. Deficit amount? (positive number)", answer: 5000, explanation: "47000 - 42000 = R5,000 deficit" },
  { question: "Costs R6,000 to R7,200. Percentage increase?", answer: 20, explanation: "(7200-6000)/6000 × 100 = 20%" },
  { question: "Income R55,000. Expenses R48,200. Surplus?", answer: 6800, explanation: "55000 - 48200 = R6,800" },
  { question: "Salary R14,000 increased by 10%. New salary?", answer: 15400, explanation: "14000 × 1.10 = R15,400" },
  { question: "Income R38,000. Expenses R41,500. Deficit? (positive)", answer: 3500, explanation: "41500 - 38000 = R3,500" },
  { question: "Revenue R24,000 to R27,600. Percentage increase?", answer: 15, explanation: "(27600-24000)/24000 × 100 = 15%" },
  { question: "Income R48,000. Expenses R44,600. Surplus?", answer: 3400, explanation: "48000 - 44600 = R3,400" },
  { question: "Expenses R11,000 to R12,650. Percentage increase?", answer: 15, explanation: "(12650-11000)/11000 × 100 = 15%" }
];

const extremeQuestions: AccountantQuestion[] = [
  { question: "Option A: Invest R50,000 at 5%. Option B: Invest R50,000 at 8% but pay 2% management fee. What is the profit from Option B (after fee)?", answer: 3000, explanation: "8% of 50000 = 4000, minus 2% fee 1000 = R3,000" },
  { question: "Fixed costs R30,000. Earn R150 per product. How many units to break even?", answer: 200, explanation: "30000 / 150 = 200 units" },
  { question: "Fixed costs R45,000. Contribution R225 per unit. Break-even units?", answer: 200, explanation: "45000 / 225 = 200 units" },
  { question: "Invest R100,000 at 6%. Year 1 interest?", answer: 6000, explanation: "100000 × 0.06 = R6,000" },
  { question: "Fixed costs R24,000. Price R120 per unit. Variable cost R40. Break-even units?", answer: 300, explanation: "24000/(120-40) = 300 units" },
  { question: "Option A: R40,000 at 4%. Option B: R40,000 at 6% with 1.5% fee. What is the net profit from Option B (after fee)?", answer: 1800, explanation: "6% of 40000 = 2400, minus 1.5% fee 600 = R1,800" },
  { question: "Fixed costs R60,000. Contribution per unit R300. Break-even?", answer: 200, explanation: "60000 / 300 = 200 units" },
  { question: "Principal R80,000. Rate 5%. Simple interest for 1 year?", answer: 4000, explanation: "80000 × 0.05 = R4,000" },
  { question: "Fixed R36,000. Sell R180. Variable R60. Break-even units?", answer: 300, explanation: "36000/(180-60) = 300 units" },
  { question: "Invest R60,000 at 7%. Management fee 2%. Net profit?", answer: 3000, explanation: "4200 - 1200 = R3,000" },
  { question: "Fixed costs R50,000. Contribution R250. Break-even?", answer: 200, explanation: "50000 / 250 = 200 units" },
  { question: "Option A: R70,000 at 5%. Option B: R70,000 at 7% with 2% fee. What is the net profit from Option B (after fee)?", answer: 3500, explanation: "7% of 70000 = 4900, minus 2% fee 1400 = R3,500" },
  { question: "Fixed R42,000. Price R210. Variable R70. Break-even?", answer: 300, explanation: "42000/(210-70) = 300 units" },
  { question: "Principal R90,000 at 6%. Interest?", answer: 5400, explanation: "90000 × 0.06 = R5,400" },
  { question: "Fixed R54,000. Contribution R270. Break-even units?", answer: 200, explanation: "54000 / 270 = 200 units" },
  { question: "Invest R55,000 at 8%. Fee 2.5%. Net profit?", answer: 3025, explanation: "4400 - 1375 = R3,025" },
  { question: "Fixed R48,000. Sell R160. Variable R64. Break-even?", answer: 500, explanation: "48000/(160-64) = 500 units" },
  { question: "Fixed R66,000. Contribution R330. Break-even?", answer: 200, explanation: "66000 / 330 = 200 units" },
  { question: "Principal R75,000 at 8%. Interest?", answer: 6000, explanation: "75000 × 0.08 = R6,000" },
  { question: "Fixed R39,000. Price R130. Variable R52. Break-even units?", answer: 500, explanation: "39000/(130-52) = 500 units" }
];

export function getAccountantQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): AccountantQuestion {
  let questions: AccountantQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
