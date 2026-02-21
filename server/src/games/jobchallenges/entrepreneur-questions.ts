// Entrepreneur – Business Builder Challenge (Business Scenario)
// 20 questions per difficulty tier. All numeric answers. SA context (Rands).

export interface EntrepreneurQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Profit Basics (revenue, simple profit)
export const easyQuestions: EntrepreneurQuestion[] = [
  { question: "Cost per item = R20. Selling price = R35. Units sold = 40. What is total profit (R)?", answer: 600, explanation: "(35 - 20) × 40 = R600" },
  { question: "You earn R2 000 revenue. Costs are R1 200. Profit (R)?", answer: 800, explanation: "2000 - 1200 = R800" },
  { question: "Cost per item = R15. Selling price = R28. Units sold = 50. Total profit (R)?", answer: 650, explanation: "(28 - 15) × 50 = R650" },
  { question: "Revenue = R3 500. Costs = R2 100. Profit (R)?", answer: 1400, explanation: "3500 - 2100 = R1400" },
  { question: "Cost per item = R30. Selling price = R45. Units sold = 25. Total profit (R)?", answer: 375, explanation: "(45 - 30) × 25 = R375" },
  { question: "You earn R1 800 revenue. Costs are R950. Profit (R)?", answer: 850, explanation: "1800 - 950 = R850" },
  { question: "Cost per item = R12. Selling price = R22. Units sold = 60. Total profit (R)?", answer: 600, explanation: "(22 - 12) × 60 = R600" },
  { question: "Revenue = R4 200. Costs = R2 800. Profit (R)?", answer: 1400, explanation: "4200 - 2800 = R1400" },
  { question: "Cost per item = R8. Selling price = R18. Units sold = 100. Total profit (R)?", answer: 1000, explanation: "(18 - 8) × 100 = R1000" },
  { question: "You earn R5 000 revenue. Costs are R3 200. Profit (R)?", answer: 1800, explanation: "5000 - 3200 = R1800" },
  { question: "Cost per item = R25. Selling price = R40. Units sold = 30. Total profit (R)?", answer: 450, explanation: "(40 - 25) × 30 = R450" },
  { question: "Revenue = R2 400. Costs = R1 500. Profit (R)?", answer: 900, explanation: "2400 - 1500 = R900" },
  { question: "Cost per item = R40. Selling price = R65. Units sold = 20. Total profit (R)?", answer: 500, explanation: "(65 - 40) × 20 = R500" },
  { question: "You earn R1 500 revenue. Costs are R900. Profit (R)?", answer: 600, explanation: "1500 - 900 = R600" },
  { question: "Cost per item = R18. Selling price = R32. Units sold = 45. Total profit (R)?", answer: 630, explanation: "(32 - 18) × 45 = R630" },
  { question: "Revenue = R6 000. Costs = R4 100. Profit (R)?", answer: 1900, explanation: "6000 - 4100 = R1900" },
  { question: "Cost per item = R10. Selling price = R24. Units sold = 80. Total profit (R)?", answer: 1120, explanation: "(24 - 10) × 80 = R1120" },
  { question: "You earn R3 800 revenue. Costs are R2 400. Profit (R)?", answer: 1400, explanation: "3800 - 2400 = R1400" },
  { question: "Cost per item = R35. Selling price = R52. Units sold = 22. Total profit (R)?", answer: 374, explanation: "(52 - 35) × 22 = R374" },
  { question: "Revenue = R2 800. Costs = R1 600. Profit (R)?", answer: 1200, explanation: "2800 - 1600 = R1200" }
];

// MEDIUM – Break-even Thinking (startup recovery, units required)
export const mediumQuestions: EntrepreneurQuestion[] = [
  { question: "Startup cost = R5 000. Profit per unit = R25. How many units must you sell to break even?", answer: 200, explanation: "5000 ÷ 25 = 200 units" },
  { question: "Weekly profit = R800. How many weeks to recover R4 000 startup cost?", answer: 5, explanation: "4000 ÷ 800 = 5 weeks" },
  { question: "Startup cost = R8 000. Profit per unit = R40. How many units to break even?", answer: 200, explanation: "8000 ÷ 40 = 200 units" },
  { question: "Weekly profit = R500. How many weeks to recover R2 500 startup cost?", answer: 5, explanation: "2500 ÷ 500 = 5 weeks" },
  { question: "Startup cost = R3 000. Profit per unit = R15. How many units to break even?", answer: 200, explanation: "3000 ÷ 15 = 200 units" },
  { question: "Weekly profit = R1 200. How many weeks to recover R6 000 startup cost?", answer: 5, explanation: "6000 ÷ 1200 = 5 weeks" },
  { question: "Startup cost = R12 000. Profit per unit = R60. How many units to break even?", answer: 200, explanation: "12000 ÷ 60 = 200 units" },
  { question: "Weekly profit = R600. How many weeks to recover R3 600 startup cost?", answer: 6, explanation: "3600 ÷ 600 = 6 weeks" },
  { question: "Startup cost = R6 500. Profit per unit = R26. How many units to break even?", answer: 250, explanation: "6500 ÷ 26 = 250 units" },
  { question: "Weekly profit = R450. How many weeks to recover R2 250 startup cost?", answer: 5, explanation: "2250 ÷ 450 = 5 weeks" },
  { question: "Startup cost = R10 000. Profit per unit = R50. How many units to break even?", answer: 200, explanation: "10000 ÷ 50 = 200 units" },
  { question: "Weekly profit = R1 000. How many weeks to recover R7 000 startup cost?", answer: 7, explanation: "7000 ÷ 1000 = 7 weeks" },
  { question: "Startup cost = R4 200. Profit per unit = R21. How many units to break even?", answer: 200, explanation: "4200 ÷ 21 = 200 units" },
  { question: "Weekly profit = R350. How many weeks to recover R1 750 startup cost?", answer: 5, explanation: "1750 ÷ 350 = 5 weeks" },
  { question: "Startup cost = R7 500. Profit per unit = R30. How many units to break even?", answer: 250, explanation: "7500 ÷ 30 = 250 units" },
  { question: "Weekly profit = R900. How many weeks to recover R5 400 startup cost?", answer: 6, explanation: "5400 ÷ 900 = 6 weeks" },
  { question: "Startup cost = R2 800. Profit per unit = R14. How many units to break even?", answer: 200, explanation: "2800 ÷ 14 = 200 units" },
  { question: "Weekly profit = R750. How many weeks to recover R3 750 startup cost?", answer: 5, explanation: "3750 ÷ 750 = 5 weeks" },
  { question: "Startup cost = R9 000. Profit per unit = R45. How many units to break even?", answer: 200, explanation: "9000 ÷ 45 = 200 units" },
  { question: "Weekly profit = R550. How many weeks to recover R4 400 startup cost?", answer: 8, explanation: "4400 ÷ 550 = 8 weeks" }
];

// HARD – Growth & Percentage (growth modelling, margin calculation)
export const hardQuestions: EntrepreneurQuestion[] = [
  { question: "Revenue last week = R10 000. This week increases by 20%. New revenue (R)?", answer: 12000, explanation: "10000 × 1.20 = R12000" },
  { question: "Profit = R3 000. Revenue = R12 000. What is profit margin (%)?", answer: 25, explanation: "3000 ÷ 12000 × 100 = 25%" },
  { question: "Revenue last week = R8 000. This week increases by 15%. New revenue (R)?", answer: 9200, explanation: "8000 × 1.15 = R9200" },
  { question: "Profit = R2 400. Revenue = R9 600. Profit margin (%)?", answer: 25, explanation: "2400 ÷ 9600 × 100 = 25%" },
  { question: "Revenue last week = R15 000. This week increases by 25%. New revenue (R)?", answer: 18750, explanation: "15000 × 1.25 = R18750" },
  { question: "Profit = R1 500. Revenue = R6 000. Profit margin (%)?", answer: 25, explanation: "1500 ÷ 6000 × 100 = 25%" },
  { question: "Revenue last week = R6 000. This week increases by 30%. New revenue (R)?", answer: 7800, explanation: "6000 × 1.30 = R7800" },
  { question: "Profit = R4 500. Revenue = R18 000. Profit margin (%)?", answer: 25, explanation: "4500 ÷ 18000 × 100 = 25%" },
  { question: "Revenue last week = R12 500. This week increases by 10%. New revenue (R)?", answer: 13750, explanation: "12500 × 1.10 = R13750" },
  { question: "Profit = R800. Revenue = R4 000. Profit margin (%)?", answer: 20, explanation: "800 ÷ 4000 × 100 = 20%" },
  { question: "Revenue last week = R20 000. This week increases by 18%. New revenue (R)?", answer: 23600, explanation: "20000 × 1.18 = R23600" },
  { question: "Profit = R2 000. Revenue = R8 000. Profit margin (%)?", answer: 25, explanation: "2000 ÷ 8000 × 100 = 25%" },
  { question: "Revenue last week = R7 500. This week increases by 12%. New revenue (R)?", answer: 8400, explanation: "7500 × 1.12 = R8400" },
  { question: "Profit = R3 600. Revenue = R12 000. Profit margin (%)?", answer: 30, explanation: "3600 ÷ 12000 × 100 = 30%" },
  { question: "Revenue last week = R9 000. This week increases by 22%. New revenue (R)?", answer: 10980, explanation: "9000 × 1.22 = R10980" },
  { question: "Profit = R1 200. Revenue = R6 000. Profit margin (%)?", answer: 20, explanation: "1200 ÷ 6000 × 100 = 20%" },
  { question: "Revenue last week = R11 000. This week increases by 8%. New revenue (R)?", answer: 11880, explanation: "11000 × 1.08 = R11880" },
  { question: "Profit = R5 000. Revenue = R20 000. Profit margin (%)?", answer: 25, explanation: "5000 ÷ 20000 × 100 = 25%" },
  { question: "Revenue last week = R14 000. This week increases by 16%. New revenue (R)?", answer: 16240, explanation: "14000 × 1.16 = R16240" },
  { question: "Profit = R900. Revenue = R4 500. Profit margin (%)?", answer: 20, explanation: "900 ÷ 4500 × 100 = 20%" }
];

// EXTREME – Risk & Investment (shares, ROI, multi-step)
export const extremeQuestions: EntrepreneurQuestion[] = [
  { question: "Investor gives R10 000 for 25% ownership. Business makes R4 000 profit. How much does investor receive (R)?", answer: 1000, explanation: "4000 × 0.25 = R1000" },
  { question: "Costs were R8 000. Costs increase by 15%. New costs (R)?", answer: 9200, explanation: "8000 × 1.15 = R9200" },
  { question: "Investor gives R20 000 for 30% ownership. Business makes R6 000 profit. How much does investor receive (R)?", answer: 1800, explanation: "6000 × 0.30 = R1800" },
  { question: "Costs were R12 000. Costs increase by 20%. New costs (R)?", answer: 14400, explanation: "12000 × 1.20 = R14400" },
  { question: "Investor gives R15 000 for 20% ownership. Business makes R5 000 profit. How much does investor receive (R)?", answer: 1000, explanation: "5000 × 0.20 = R1000" },
  { question: "Revenue R10 000. Costs increase by 10% from R6 000. New profit (R)?", answer: 3400, explanation: "10000 - 6600 = R3400" },
  { question: "Investor gives R25 000 for 40% ownership. Business makes R8 000 profit. How much does investor receive (R)?", answer: 3200, explanation: "8000 × 0.40 = R3200" },
  { question: "Costs were R5 000. Costs increase by 25%. New costs (R)?", answer: 6250, explanation: "5000 × 1.25 = R6250" },
  { question: "Investor gives R8 000 for 15% ownership. Business makes R3 000 profit. How much does investor receive (R)?", answer: 450, explanation: "3000 × 0.15 = R450" },
  { question: "Revenue R15 000. Costs were R9 000. Costs increase by 12%. New profit (R)?", answer: 4920, explanation: "15000 - 10080 = R4920" },
  { question: "Investor gives R30 000 for 50% ownership. Business makes R10 000 profit. How much does investor receive (R)?", answer: 5000, explanation: "10000 × 0.50 = R5000" },
  { question: "Costs were R7 000. Costs increase by 18%. New costs (R)?", answer: 8260, explanation: "7000 × 1.18 = R8260" },
  { question: "Investor gives R12 000 for 24% ownership. Business makes R5 500 profit. How much does investor receive (R)?", answer: 1320, explanation: "5500 × 0.24 = R1320" },
  { question: "Revenue R18 000. Costs were R11 000. Costs increase by 15%. New profit (R)?", answer: 7350, explanation: "18000 - 12650 = R7350" },
  { question: "Investor gives R18 000 for 36% ownership. Business makes R4 000 profit. How much does investor receive (R)?", answer: 1440, explanation: "4000 × 0.36 = R1440" },
  { question: "Costs were R4 500. Costs increase by 22%. New costs (R)?", answer: 5490, explanation: "4500 × 1.22 = R5490" },
  { question: "Investor gives R14 000 for 28% ownership. Business makes R7 000 profit. How much does investor receive (R)?", answer: 1960, explanation: "7000 × 0.28 = R1960" },
  { question: "Revenue R22 000. Costs were R14 000. Costs increase by 10%. New profit (R)?", answer: 8600, explanation: "22000 - 15400 = R8600" },
  { question: "Investor gives R9 000 for 18% ownership. Business makes R2 500 profit. How much does investor receive (R)?", answer: 450, explanation: "2500 × 0.18 = R450" },
  { question: "Costs were R16 000. Costs increase by 8%. New costs (R)?", answer: 17280, explanation: "16000 × 1.08 = R17280" }
];

export function getEntrepreneurQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): EntrepreneurQuestion {
  let questions: EntrepreneurQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
