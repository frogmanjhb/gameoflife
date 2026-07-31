// Chartered Accountant – Financial Audit Challenges
// 20 questions per difficulty tier

export interface AccountantQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Income & Expenses (addition, subtraction, simple profit)
export const easyQuestions: AccountantQuestion[] = [
  { question: "A kota stand earns R8,750. Rent and ingredients cost R5,420. Net profit (R)?", answer: 3330, explanation: "8750 - 5420 = R3,330" },
  { question: "Town library book sale revenue R19,200. Printing and venue cost R12,850. Profit (R)?", answer: 6350, explanation: "19200 - 12850 = R6,350" },
  { question: "A maths tutor earns R14,600. Textbooks and transport cost R8,300. Net amount (R)?", answer: 6300, explanation: "14600 - 8300 = R6,300" },
  { question: "Weekend market stall revenue R21,800. Supplier bills R13,600. Profit (R)?", answer: 8200, explanation: "21800 - 13600 = R8,200" },
  { question: "Freelance coder earns R12,400. Software licences cost R5,900. How much is left (R)?", answer: 6500, explanation: "12400 - 5900 = R6,500" },
  { question: "Mobile car wash revenue R16,900. Water and soap cost R10,200. Net profit (R)?", answer: 6700, explanation: "16900 - 10200 = R6,700" },
  { question: "Holiday club fees: R24,500. Snacks and crafts cost R16,800. Savings (R)?", answer: 7700, explanation: "24500 - 16800 = R7,700" },
  { question: "School tuck shop sales R11,200. Stock purchases R4,750. Profit (R)?", answer: 4450, explanation: "11200 - 4750 = R4,450" },
  { question: "Landscaping service income R18,700. Tools and fuel cost R11,400. Net (R)?", answer: 7300, explanation: "18700 - 11400 = R7,300" },
  { question: "Craft fair revenue R27,600. Material costs R19,300. Profit (R)?", answer: 8200, explanation: "27600 - 19300 = R8,200" },
  { question: "Dog-walking fees R9,800. Treats and leashes cost R5,600. Net (R)?", answer: 4200, explanation: "9800 - 5600 = R4,200" },
  { question: "Laundry pickup revenue R22,400. Detergent and fuel cost R14,900. Net profit (R)?", answer: 7500, explanation: "22400 - 14900 = R7,500" },
  { question: "Piano lessons income R15,500. Sheet music and travel cost R9,200. Amount left (R)?", answer: 6300, explanation: "15500 - 9200 = R6,300" },
  { question: "Scooter repair shop revenue R13,100. Parts cost R7,800. Profit (R)?", answer: 5300, explanation: "13100 - 7800 = R5,300" },
  { question: "Town councillor stipend R30,200. Official travel costs R21,500. Left (R)?", answer: 8700, explanation: "30200 - 21500 = R8,700" },
  { question: "Video editing gig revenue R10,400. Software and storage cost R6,150. Net (R)?", answer: 4250, explanation: "10400 - 6150 = R4,250" },
  { question: "Hair salon income R25,800. Products and rent cost R17,600. Savings (R)?", answer: 8200, explanation: "25800 - 17600 = R8,200" },
  { question: "Phone screen repair income R7,600. Spare parts cost R3,400. Net (R)?", answer: 4200, explanation: "7600 - 3400 = R4,200" },
  { question: "Community newsletter ad revenue R20,300. Printing cost R12,700. Net profit (R)?", answer: 7600, explanation: "20300 - 12700 = R7,600" },
  { question: "Braai catering revenue R17,900. Food and staff cost R10,500. Profit (R)?", answer: 7900, explanation: "17900 - 10500 = R7,900" }
];

// MEDIUM – Gross vs Net & Tax (percentage, tax, deductions)
export const mediumQuestions: AccountantQuestion[] = [
  { question: "Gross salary: R18,200. Tax: 13%. How much tax is paid (R)?", answer: 2366, explanation: "18200 × 0.13 = R2,366" },
  { question: "Gross salary R18,200. Tax 13%. What is the net salary (R)?", answer: 15834, explanation: "18200 - 2366 = R15,834" },
  { question: "Business loan R28,000. Interest 8%. Interest amount (R)?", answer: 2240, explanation: "28000 × 0.08 = R2,240" },
  { question: "Gross salary R22,400. Tax 18%. Net salary (R)?", answer: 18368, explanation: "22400 × 0.82 = R18,368" },
  { question: "Invoice amount R15,600. VAT 15%. VAT amount (R)?", answer: 2340, explanation: "15600 × 0.15 = R2,340" },
  { question: "Gross salary R21,300. Tax 16%. Tax paid (R)?", answer: 3408, explanation: "21300 × 0.16 = R3,408" },
  { question: "Loan R41,000. Interest 10%. Interest (R)?", answer: 4100, explanation: "41000 × 0.10 = R4,100" },
  { question: "Gross R38,500. Deduction 20%. Net (R)?", answer: 30800, explanation: "38500 × 0.80 = R30,800" },
  { question: "Equipment price R11,200. Trade discount 12%. Discount amount (R)?", answer: 1344, explanation: "11200 × 0.12 = R1,344" },
  { question: "Gross salary R15,700. Tax 14%. Net salary (R)?", answer: 13502, explanation: "15700 × 0.86 = R13,502" },
  { question: "Principal R62,000. Interest 6%. Interest (R)?", answer: 3720, explanation: "62000 × 0.06 = R3,720" },
  { question: "Gross R33,500. Tax 22%. Tax amount (R)?", answer: 7370, explanation: "33500 × 0.22 = R7,370" },
  { question: "Amount R19,400. VAT 15%. Total including VAT (R)?", answer: 22310, explanation: "19400 × 1.15 = R22,310" },
  { question: "Gross salary R26,800. Tax 18%. Net (R)?", answer: 21976, explanation: "26800 × 0.82 = R21,976" },
  { question: "Loan R47,500. Interest 7%. Interest (R)?", answer: 3325, explanation: "47500 × 0.07 = R3,325" },
  { question: "Gross R20,600. Deduction 18%. Net (R)?", answer: 16892, explanation: "20600 × 0.82 = R16,892" },
  { question: "Service fee R14,800. VAT 15%. VAT amount (R)?", answer: 2220, explanation: "14800 × 0.15 = R2,220" },
  { question: "Gross salary R32,100. Tax 24%. Net salary (R)?", answer: 24396, explanation: "32100 × 0.76 = R24,396" },
  { question: "Principal R58,000. Rate 8%. Interest (R)?", answer: 4640, explanation: "58000 × 0.08 = R4,640" },
  { question: "Gross R42,500. Tax 25%. Tax paid (R)?", answer: 10625, explanation: "42500 × 0.25 = R10,625" }
];

// HARD – Budget Analysis & Multi-Step (multiple categories, percentage change, comparison)
export const hardQuestions: AccountantQuestion[] = [
  { question: "Town income: Property tax R35,500, Market fees R18,200. Expenses: Roads R24,000, Staff R19,500. Surplus or deficit (R)? (surplus positive, deficit negative)", answer: 10000, explanation: "Income 53700 - Expenses 43500 = R10,000 surplus" },
  { question: "Operating costs rose from R8,500 to R10,625. What is the percentage increase?", answer: 25, explanation: "(10625-8500)/8500 × 100 = 25%" },
  { question: "Total income R48,000. Total expenses R34,200. Surplus amount (R)?", answer: 13800, explanation: "48000 - 34200 = R13,800" },
  { question: "Market revenue was R16,200, now R19,440. Percentage increase?", answer: 20, explanation: "(19440-16200)/16200 × 100 = 20%" },
  { question: "Budget: Income R62,000. Spending R68,400. Deficit amount (R)? (positive number)", answer: 6400, explanation: "68400 - 62000 = R6,400 deficit" },
  { question: "Ticket sales dropped from R28,500 to R22,800. Percentage decrease?", answer: 20, explanation: "(28500-22800)/28500 × 100 = 20%" },
  { question: "Income R51,000. Costs R36,800. Surplus (R)?", answer: 14200, explanation: "51000 - 36800 = R14,200" },
  { question: "School fees R11,200 increased by 20%. New fee (R)?", answer: 13440, explanation: "11200 × 1.20 = R13,440" },
  { question: "Total income R55,800. Total expenses R47,900. Net (R)?", answer: 7900, explanation: "55800 - 47900 = R7,900" },
  { question: "Utilities R9,800 to R11,760. Percentage increase?", answer: 20, explanation: "(11760-9800)/9800 × 100 = 20%" },
  { question: "Income R72,500. Expenses R63,800. Surplus (R)?", answer: 8700, explanation: "72500 - 63800 = R8,700" },
  { question: "Donations R24,000 decreased by 20%. New donations (R)?", answer: 19200, explanation: "24000 × 0.80 = R19,200" },
  { question: "Income R43,500. Expenses R49,200. Deficit amount (R)? (positive number)", answer: 5800, explanation: "49200 - 43500 = R5,800 deficit" },
  { question: "Supply costs R9,600 to R11,040. Percentage increase?", answer: 15, explanation: "(11040-9600)/9600 × 100 = 15%" },
  { question: "Income R58,400. Expenses R51,200. Surplus (R)?", answer: 7200, explanation: "58400 - 51200 = R7,200" },
  { question: "Worker wage R18,400 increased by 12%. New wage (R)?", answer: 20608, explanation: "18400 × 1.12 = R20,608" },
  { question: "Income R39,800. Expenses R44,500. Deficit (R)? (positive)", answer: 4700, explanation: "44500 - 39800 = R4,700" },
  { question: "Fundraising R32,000 to R36,800. Percentage increase?", answer: 15, explanation: "(36800-32000)/32000 × 100 = 15%" },
  { question: "Income R64,200. Expenses R59,700. Surplus (R)?", answer: 4500, explanation: "64200 - 59700 = R4,500" },
  { question: "Maintenance R14,400 to R16,560. Percentage increase?", answer: 15, explanation: "(16560-14400)/14400 × 100 = 15%" }
];

// EXTREME – Financial Strategy & Optimisation (break-even, compound, comparing options)
export const extremeQuestions: AccountantQuestion[] = [
  { question: "Option A: Invest R75,000 at 3%. Option B: Invest R75,000 at 11% but pay 2.5% management fee. What is the profit from Option B after fee (R)?", answer: 6375, explanation: "11% of 75000 = 8250, minus 2.5% fee 1875 = R6,375" },
  { question: "Fixed costs R44,000. Contribution R220 per unit sold. Break-even units?", answer: 200, explanation: "44000 ÷ 220 = 200 units" },
  { question: "Fixed costs R66,000. Earn R330 per product. How many units to break even?", answer: 200, explanation: "66000 ÷ 330 = 200 units" },
  { question: "Invest R88,000 at 8%. Year 1 simple interest (R)?", answer: 7040, explanation: "88000 × 0.08 = R7,040" },
  { question: "Fixed costs R54,000. Price R180 per unit. Variable cost R60. Break-even units?", answer: 450, explanation: "54000 ÷ (180-60) = 450 units" },
  { question: "Option A: R55,000 at 4%. Option B: R55,000 at 9% with 2% fee. Net profit from Option B (R)?", answer: 3850, explanation: "9% of 55000 = 4950, minus 2% fee 1100 = R3,850" },
  { question: "Fixed costs R81,000. Contribution per unit R405. Break-even?", answer: 200, explanation: "81000 ÷ 405 = 200 units" },
  { question: "Principal R96,000. Rate 5%. Simple interest for 1 year (R)?", answer: 4800, explanation: "96000 × 0.05 = R4,800" },
  { question: "Fixed R57,600. Sell R192. Variable R76. Break-even units?", answer: 480, explanation: "57600 ÷ (192-76) = 480 units" },
  { question: "Invest R72,000 at 7.5%. Management fee 3%. Net profit (R)?", answer: 3240, explanation: "5400 - 2160 = R3,240" },
  { question: "Fixed costs R58,400. Contribution R292. Break-even?", answer: 200, explanation: "58400 ÷ 292 = 200 units" },
  { question: "Option A: R90,000 at 3%. Option B: R90,000 at 8% with 1.5% fee. Net profit from Option B (R)?", answer: 5850, explanation: "8% of 90000 = 7200, minus 1.5% fee 1350 = R5,850" },
  { question: "Fixed R60,480. Price R168. Variable R56. Break-even?", answer: 540, explanation: "60480 ÷ (168-56) = 540 units" },
  { question: "Principal R74,000 at 9%. Interest (R)?", answer: 6660, explanation: "74000 × 0.09 = R6,660" },
  { question: "Fixed R70,200. Contribution R351. Break-even units?", answer: 200, explanation: "70200 ÷ 351 = 200 units" },
  { question: "Invest R52,000 at 10%. Fee 2%. Net profit (R)?", answer: 4160, explanation: "5200 - 1040 = R4,160" },
  { question: "Fixed R62,400. Sell R208. Variable R78. Break-even?", answer: 480, explanation: "62400 ÷ (208-78) = 480 units" },
  { question: "Fixed R75,600. Contribution R378. Break-even?", answer: 200, explanation: "75600 ÷ 378 = 200 units" },
  { question: "Principal R68,000 at 11%. Interest (R)?", answer: 7480, explanation: "68000 × 0.11 = R7,480" },
  { question: "Fixed R50,400. Price R144. Variable R54. Break-even units?", answer: 560, explanation: "50400 ÷ (144-54) = 560 units" }
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
