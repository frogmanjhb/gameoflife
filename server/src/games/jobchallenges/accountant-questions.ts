// Chartered Accountant – Financial Audit Challenges
// 20 questions per difficulty tier

export interface AccountantQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Income & Expenses (addition, subtraction, simple profit)
export const easyQuestions: AccountantQuestion[] = [
  { question: "A spaza shop earns R9,400. Rent and stock cost R6,100. What is the net profit?", answer: 3300, explanation: "9400 - 6100 = R3,300" },
  { question: "Town bakery revenue is R17,800. Ingredients and wages cost R11,200. Profit (R)?", answer: 6600, explanation: "17800 - 11200 = R6,600" },
  { question: "A tutor's income: R13,500. Transport and materials cost R7,900. Net amount (R)?", answer: 5600, explanation: "13500 - 7900 = R5,600" },
  { question: "Market stall revenue R23,600. Supplier bills R15,400. Profit (R)?", answer: 8200, explanation: "23600 - 15400 = R8,200" },
  { question: "Freelance designer earns R11,700. Software and internet cost R4,800. How much is left (R)?", answer: 6900, explanation: "11700 - 4800 = R6,900" },
  { question: "Car wash revenue R14,200. Water and soap costs R8,600. Net profit (R)?", answer: 5600, explanation: "14200 - 8600 = R5,600" },
  { question: "After-school programme fees: R16,400. Snacks and supplies cost R9,700. Savings (R)?", answer: 6700, explanation: "16400 - 9700 = R6,700" },
  { question: "Tuck shop sales R28,300. Stock purchases R19,500. Profit (R)?", answer: 8800, explanation: "28300 - 19500 = R8,800" },
  { question: "Garden service income R10,600. Tools and fuel cost R3,900. Net (R)?", answer: 6700, explanation: "10600 - 3900 = R6,700" },
  { question: "Craft market revenue R19,900. Material costs R12,300. Profit (R)?", answer: 7600, explanation: "19900 - 12300 = R7,600" },
  { question: "Music lessons income R15,300. Sheet music and travel cost R8,500. Amount left (R)?", answer: 6800, explanation: "15300 - 8500 = R6,800" },
  { question: "Laundry service revenue R26,700. Detergent and electricity cost R17,900. Net profit (R)?", answer: 8800, explanation: "26700 - 17900 = R8,800" },
  { question: "Pet-sitting fees R9,200. Pet food costs R4,600. Net (R)?", answer: 4600, explanation: "9200 - 4600 = R4,600" },
  { question: "Bicycle repair shop revenue R18,400. Parts cost R10,700. Profit (R)?", answer: 7700, explanation: "18400 - 10700 = R7,700" },
  { question: "Town mayor's stipend R14,600. Official travel costs R7,100. Left (R)?", answer: 7500, explanation: "14600 - 7100 = R7,500" },
  { question: "Photography gig revenue R22,100. Printing and editing cost R14,800. Net (R)?", answer: 7300, explanation: "22100 - 14800 = R7,300" },
  { question: "Hair braiding income R12,900. Hair products cost R5,400. Savings (R)?", answer: 7500, explanation: "12900 - 5400 = R7,500" },
  { question: "Event catering revenue R31,500. Food and staff cost R22,800. Profit (R)?", answer: 8700, explanation: "31500 - 22800 = R8,700" },
  { question: "Phone repair income R8,700. Spare parts cost R3,200. Net (R)?", answer: 5500, explanation: "8700 - 3200 = R5,500" },
  { question: "School newspaper ad revenue R20,500. Printing cost R12,800. Net profit (R)?", answer: 7700, explanation: "20500 - 12800 = R7,700" }
];

// MEDIUM – Gross vs Net & Tax (percentage, tax, deductions)
export const mediumQuestions: AccountantQuestion[] = [
  { question: "Gross salary: R16,500. Tax: 14%. How much tax is paid (R)?", answer: 2310, explanation: "16500 × 0.14 = R2,310" },
  { question: "Gross salary R16,500. Tax 14%. What is the net salary (R)?", answer: 14190, explanation: "16500 - 2310 = R14,190" },
  { question: "Business loan R22,500. Interest 9%. Interest amount (R)?", answer: 2025, explanation: "22500 × 0.09 = R2,025" },
  { question: "Gross salary R27,500. Tax 19%. Net salary (R)?", answer: 22275, explanation: "27500 × 0.81 = R22,275" },
  { question: "Invoice amount R12,400. VAT 15%. VAT amount (R)?", answer: 1860, explanation: "12400 × 0.15 = R1,860" },
  { question: "Gross salary R19,800. Tax 17%. Tax paid (R)?", answer: 3366, explanation: "19800 × 0.17 = R3,366" },
  { question: "Loan R32,000. Interest 11%. Interest (R)?", answer: 3520, explanation: "32000 × 0.11 = R3,520" },
  { question: "Gross R34,000. Deduction 21%. Net (R)?", answer: 26860, explanation: "34000 × 0.79 = R26,860" },
  { question: "Equipment price R9,500. Trade discount 10%. Discount amount (R)?", answer: 950, explanation: "9500 × 0.10 = R950" },
  { question: "Gross salary R13,400. Tax 15%. Net salary (R)?", answer: 11390, explanation: "13400 × 0.85 = R11,390" },
  { question: "Principal R55,000. Interest 7%. Interest (R)?", answer: 3850, explanation: "55000 × 0.07 = R3,850" },
  { question: "Gross R31,200. Tax 23%. Tax amount (R)?", answer: 7176, explanation: "31200 × 0.23 = R7,176" },
  { question: "Amount R16,800. VAT 15%. Total including VAT (R)?", answer: 19320, explanation: "16800 × 1.15 = R19,320" },
  { question: "Gross salary R24,600. Tax 19%. Net (R)?", answer: 19926, explanation: "24600 × 0.81 = R19,926" },
  { question: "Loan R38,500. Interest 8%. Interest (R)?", answer: 3080, explanation: "38500 × 0.08 = R3,080" },
  { question: "Gross R17,500. Deduction 16%. Net (R)?", answer: 14700, explanation: "17500 × 0.84 = R14,700" },
  { question: "Service fee R13,200. VAT 15%. VAT amount (R)?", answer: 1980, explanation: "13200 × 0.15 = R1,980" },
  { question: "Gross salary R29,400. Tax 21%. Net salary (R)?", answer: 23226, explanation: "29400 × 0.79 = R23,226" },
  { question: "Principal R45,000. Rate 9%. Interest (R)?", answer: 4050, explanation: "45000 × 0.09 = R4,050" },
  { question: "Gross R36,800. Tax 26%. Tax paid (R)?", answer: 9568, explanation: "36800 × 0.26 = R9,568" }
];

// HARD – Budget Analysis & Multi-Step (multiple categories, percentage change, comparison)
export const hardQuestions: AccountantQuestion[] = [
  { question: "Town income: Property tax R32,000, Market fees R14,000. Expenses: Roads R22,000, Staff R16,000. Surplus or deficit (R)? (surplus positive, deficit negative)", answer: 8000, explanation: "Income 46000 - Expenses 38000 = R8,000 surplus" },
  { question: "Operating costs rose from R7,200 to R9,360. What is the percentage increase?", answer: 30, explanation: "(9360-7200)/7200 × 100 = 30%" },
  { question: "Total income R52,000. Total expenses R38,500. Surplus amount (R)?", answer: 13500, explanation: "52000 - 38500 = R13,500" },
  { question: "Market revenue was R14,400, now R18,720. Percentage increase?", answer: 30, explanation: "(18720-14400)/14400 × 100 = 30%" },
  { question: "Budget: Income R58,000. Spending R63,500. Deficit amount (R)? (positive number)", answer: 5500, explanation: "63500 - 58000 = R5,500 deficit" },
  { question: "Ticket sales dropped from R24,000 to R19,200. Percentage decrease?", answer: 20, explanation: "(24000-19200)/24000 × 100 = 20%" },
  { question: "Income R44,000. Costs R29,600. Surplus (R)?", answer: 14400, explanation: "44000 - 29600 = R14,400" },
  { question: "School fees R9,600 increased by 25%. New fee (R)?", answer: 12000, explanation: "9600 × 1.25 = R12,000" },
  { question: "Total income R49,500. Total expenses R41,800. Net (R)?", answer: 7700, explanation: "49500 - 41800 = R7,700" },
  { question: "Utilities R10,500 to R12,600. Percentage increase?", answer: 20, explanation: "(12600-10500)/10500 × 100 = 20%" },
  { question: "Income R67,000. Expenses R58,300. Surplus (R)?", answer: 8700, explanation: "67000 - 58300 = R8,700" },
  { question: "Donations R21,000 decreased by 15%. New donations (R)?", answer: 17850, explanation: "21000 × 0.85 = R17,850" },
  { question: "Income R46,000. Expenses R51,800. Deficit amount (R)? (positive number)", answer: 5800, explanation: "51800 - 46000 = R5,800 deficit" },
  { question: "Supply costs R8,400 to R10,080. Percentage increase?", answer: 20, explanation: "(10080-8400)/8400 × 100 = 20%" },
  { question: "Income R61,500. Expenses R53,700. Surplus (R)?", answer: 7800, explanation: "61500 - 53700 = R7,800" },
  { question: "Worker wage R16,500 increased by 10%. New wage (R)?", answer: 18150, explanation: "16500 × 1.10 = R18,150" },
  { question: "Income R41,200. Expenses R45,900. Deficit (R)? (positive)", answer: 4700, explanation: "45900 - 41200 = R4,700" },
  { question: "Fundraising R28,000 to R32,200. Percentage increase?", answer: 15, explanation: "(32200-28000)/28000 × 100 = 15%" },
  { question: "Income R53,400. Expenses R49,100. Surplus (R)?", answer: 4300, explanation: "53400 - 49100 = R4,300" },
  { question: "Maintenance R13,200 to R15,180. Percentage increase?", answer: 15, explanation: "(15180-13200)/13200 × 100 = 15%" }
];

// EXTREME – Financial Strategy & Optimisation (break-even, compound, comparing options)
export const extremeQuestions: AccountantQuestion[] = [
  { question: "Option A: Invest R60,000 at 4%. Option B: Invest R60,000 at 9% but pay 2.5% management fee. What is the profit from Option B after fee (R)?", answer: 3900, explanation: "9% of 60000 = 5400, minus 2.5% fee 1500 = R3,900" },
  { question: "Fixed costs R36,000. Contribution R180 per unit sold. Break-even units?", answer: 200, explanation: "36000 ÷ 180 = 200 units" },
  { question: "Fixed costs R54,000. Earn R270 per product. How many units to break even?", answer: 200, explanation: "54000 ÷ 270 = 200 units" },
  { question: "Invest R85,000 at 7%. Year 1 simple interest (R)?", answer: 5950, explanation: "85000 × 0.07 = R5,950" },
  { question: "Fixed costs R33,600. Price R140 per unit. Variable cost R48. Break-even units?", answer: 360, explanation: "33600 ÷ (140-48) = 360 units" },
  { question: "Option A: R50,000 at 5%. Option B: R50,000 at 8% with 1.5% fee. Net profit from Option B (R)?", answer: 3250, explanation: "8% of 50000 = 4000, minus 1.5% fee 750 = R3,250" },
  { question: "Fixed costs R72,000. Contribution per unit R360. Break-even?", answer: 200, explanation: "72000 ÷ 360 = 200 units" },
  { question: "Principal R92,000. Rate 6%. Simple interest for 1 year (R)?", answer: 5520, explanation: "92000 × 0.06 = R5,520" },
  { question: "Fixed R43,200. Sell R180. Variable R72. Break-even units?", answer: 360, explanation: "43200 ÷ (180-72) = 360 units" },
  { question: "Invest R65,000 at 8%. Management fee 2%. Net profit (R)?", answer: 3900, explanation: "5200 - 1300 = R3,900" },
  { question: "Fixed costs R56,000. Contribution R280. Break-even?", answer: 200, explanation: "56000 ÷ 280 = 200 units" },
  { question: "Option A: R80,000 at 4%. Option B: R80,000 at 7.5% with 2% fee. Net profit from Option B (R)?", answer: 4400, explanation: "7.5% of 80000 = 6000, minus 2% fee 1600 = R4,400" },
  { question: "Fixed R50,400. Price R168. Variable R56. Break-even?", answer: 360, explanation: "50400 ÷ (168-56) = 360 units" },
  { question: "Principal R78,000 at 7%. Interest (R)?", answer: 5460, explanation: "78000 × 0.07 = R5,460" },
  { question: "Fixed R64,800. Contribution R324. Break-even units?", answer: 200, explanation: "64800 ÷ 324 = 200 units" },
  { question: "Invest R48,000 at 9%. Fee 2.5%. Net profit (R)?", answer: 3120, explanation: "4320 - 1200 = R3,120" },
  { question: "Fixed R57,600. Sell R192. Variable R76. Break-even?", answer: 480, explanation: "57600 ÷ (192-76) = 480 units" },
  { question: "Fixed R79,200. Contribution R396. Break-even?", answer: 200, explanation: "79200 ÷ 396 = 200 units" },
  { question: "Principal R62,500 at 9%. Interest (R)?", answer: 5625, explanation: "62500 × 0.09 = R5,625" },
  { question: "Fixed R46,800. Price R156. Variable R62. Break-even units?", answer: 540, explanation: "46800 ÷ (156-62) = 540 units" }
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
