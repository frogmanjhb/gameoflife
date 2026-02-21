// Marketing Manager – Campaign Strategy Challenge
// 20 questions per difficulty tier. All numeric answers.

export interface MarketingManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Sales & Revenue Basics (revenue, profit, unit price × quantity)
export const easyQuestions: MarketingManagerQuestion[] = [
  { question: "A café sells 40 drinks at R25 each. What is total revenue?", answer: 1000, explanation: "40 × 25 = R1,000" },
  { question: "Revenue = R5,000. Costs = R3,200. Profit?", answer: 1800, explanation: "5000 − 3200 = R1,800" },
  { question: "A shop sells 30 items at R50 each. Total revenue?", answer: 1500, explanation: "30 × 50 = R1,500" },
  { question: "Revenue R8,000. Costs R4,500. Profit?", answer: 3500, explanation: "8000 − 4500 = R3,500" },
  { question: "60 tickets at R75 each. Total revenue?", answer: 4500, explanation: "60 × 75 = R4,500" },
  { question: "Revenue R6,200. Costs R3,800. Profit?", answer: 2400, explanation: "6200 − 3800 = R2,400" },
  { question: "25 products at R80 each. Total revenue?", answer: 2000, explanation: "25 × 80 = R2,000" },
  { question: "Revenue R9,000. Costs R5,200. Profit?", answer: 3800, explanation: "9000 − 5200 = R3,800" },
  { question: "50 units at R40 each. Total revenue?", answer: 2000, explanation: "50 × 40 = R2,000" },
  { question: "Revenue R4,500. Costs R2,100. Profit?", answer: 2400, explanation: "4500 − 2100 = R2,400" },
  { question: "100 items at R15 each. Total revenue?", answer: 1500, explanation: "100 × 15 = R1,500" },
  { question: "Revenue R7,500. Costs R4,800. Profit?", answer: 2700, explanation: "7500 − 4800 = R2,700" },
  { question: "35 drinks at R30 each. Total revenue?", answer: 1050, explanation: "35 × 30 = R1,050" },
  { question: "Revenue R11,000. Costs R6,500. Profit?", answer: 4500, explanation: "11000 − 6500 = R4,500" },
  { question: "20 cakes at R45 each. Total revenue?", answer: 900, explanation: "20 × 45 = R900" },
  { question: "Revenue R3,800. Costs R2,200. Profit?", answer: 1600, explanation: "3800 − 2200 = R1,600" },
  { question: "80 units at R12 each. Total revenue?", answer: 960, explanation: "80 × 12 = R960" },
  { question: "Revenue R5,500. Costs R3,100. Profit?", answer: 2400, explanation: "5500 − 3100 = R2,400" },
  { question: "45 items at R22 each. Total revenue?", answer: 990, explanation: "45 × 22 = R990" },
  { question: "Revenue R12,000. Costs R7,400. Profit?", answer: 4600, explanation: "12000 − 7400 = R4,600" }
];

// MEDIUM – Percentage & Growth (% increase, discount, basic ROI)
export const mediumQuestions: MarketingManagerQuestion[] = [
  { question: "Last week: 200 customers. This week: 260 customers. What is the percentage increase?", answer: 30, explanation: "(260−200)/200 × 100 = 30%" },
  { question: "Product costs R100. You apply a 20% discount. What is the new price?", answer: 80, explanation: "100 × 0.80 = R80" },
  { question: "You spend R2,000 on advertising. It generates R3,000 extra revenue. What is profit from the campaign?", answer: 1000, explanation: "3000 − 2000 = R1,000" },
  { question: "Sales were 150, now 195. Percentage increase?", answer: 30, explanation: "(195−150)/150 × 100 = 30%" },
  { question: "Price R80. 15% discount. New price?", answer: 68, explanation: "80 × 0.85 = R68" },
  { question: "Ad spend R1,500. Revenue from campaign R2,400. Profit from campaign?", answer: 900, explanation: "2400 − 1500 = R900" },
  { question: "Last month 400 sales. This month 520. Percentage increase?", answer: 30, explanation: "(520−400)/400 × 100 = 30%" },
  { question: "Product R120. 25% discount. New price?", answer: 90, explanation: "120 × 0.75 = R90" },
  { question: "Ad spend R3,000. Campaign revenue R4,500. Profit?", answer: 1500, explanation: "4500 − 3000 = R1,500" },
  { question: "Customers 80 last week, 100 this week. Percentage increase?", answer: 25, explanation: "(100−80)/80 × 100 = 25%" },
  { question: "Price R60. 10% discount. New price?", answer: 54, explanation: "60 × 0.90 = R54" },
  { question: "Spend R2,500 on ads. Revenue R3,800. Profit from campaign?", answer: 1300, explanation: "3800 − 2500 = R1,300" },
  { question: "Sales 300 → 360. Percentage increase?", answer: 20, explanation: "(360−300)/300 × 100 = 20%" },
  { question: "Product R200. 30% discount. New price?", answer: 140, explanation: "200 × 0.70 = R140" },
  { question: "Ad R1,800. Revenue R2,700. Profit?", answer: 900, explanation: "2700 − 1800 = R900" },
  { question: "Customers 120 → 150. Percentage increase?", answer: 25, explanation: "(150−120)/120 × 100 = 25%" },
  { question: "Price R90. 20% off. New price?", answer: 72, explanation: "90 × 0.80 = R72" },
  { question: "Spend R4,000. Revenue R6,200. Campaign profit?", answer: 2200, explanation: "6200 − 4000 = R2,200" },
  { question: "Sales 250 → 325. Percentage increase?", answer: 30, explanation: "(325−250)/250 × 100 = 30%" },
  { question: "Product R150. 15% discount. New price?", answer: 127.5, explanation: "150 × 0.85 = R127.50" }
];

// HARD – ROI, cost per acquisition, margin (ROI = Profit ÷ Cost × 100)
export const hardQuestions: MarketingManagerQuestion[] = [
  { question: "Ad cost = R5,000. Revenue generated = R8,000. What is ROI? (ROI = Profit ÷ Cost × 100)", answer: 60, explanation: "Profit 3000, 3000/5000×100 = 60%" },
  { question: "Ad reaches 1,000 people. 5% buy. Product price = R200. Total revenue?", answer: 10000, explanation: "1000×0.05×200 = R10,000" },
  { question: "Cost R4,000. Revenue R6,500. What is ROI (%)?", answer: 62.5, explanation: "Profit 2500, 2500/4000×100 = 62.5%" },
  { question: "Reach 2,000. 4% convert. Price R150. Total revenue?", answer: 12000, explanation: "2000×0.04×150 = R12,000" },
  { question: "Ad cost R6,000. Revenue R9,600. ROI (%)?", answer: 60, explanation: "3600/6000×100 = 60%" },
  { question: "Reach 500. 8% buy. Price R100. Revenue?", answer: 4000, explanation: "500×0.08×100 = R4,000" },
  { question: "Cost R3,000. Revenue R5,400. ROI (%)?", answer: 80, explanation: "2400/3000×100 = 80%" },
  { question: "Reach 1,500. 6% buy. Price R80. Revenue?", answer: 7200, explanation: "1500×0.06×80 = R7,200" },
  { question: "Ad R7,000. Revenue R11,200. ROI (%)?", answer: 60, explanation: "4200/7000×100 = 60%" },
  { question: "Reach 800. 5% convert. Price R250. Revenue?", answer: 10000, explanation: "800×0.05×250 = R10,000" },
  { question: "Cost R2,500. Revenue R4,250. ROI (%)?", answer: 70, explanation: "1750/2500×100 = 70%" },
  { question: "Reach 3,000. 3% buy. Price R120. Revenue?", answer: 10800, explanation: "3000×0.03×120 = R10,800" },
  { question: "Ad R8,000. Revenue R12,000. ROI (%)?", answer: 50, explanation: "4000/8000×100 = 50%" },
  { question: "Reach 600. 10% buy. Price R50. Revenue?", answer: 3000, explanation: "600×0.10×50 = R3,000" },
  { question: "Cost R4,500. Revenue R7,650. ROI (%)?", answer: 70, explanation: "3150/4500×100 = 70%" },
  { question: "Reach 1,200. 5% convert. Price R180. Revenue?", answer: 10800, explanation: "1200×0.05×180 = R10,800" },
  { question: "Ad R5,500. Revenue R8,800. ROI (%)?", answer: 60, explanation: "3300/5500×100 = 60%" },
  { question: "Reach 900. 7% buy. Price R90. Revenue?", answer: 5670, explanation: "900×0.07×90 = R5,670" },
  { question: "Cost R6,500. Revenue R10,400. ROI (%)?", answer: 60, explanation: "3900/6500×100 = 60%" },
  { question: "Reach 2,500. 4% buy. Price R200. Revenue?", answer: 20000, explanation: "2500×0.04×200 = R20,000" }
];

// EXTREME – Strategy & Optimisation (comparing campaigns, multi-step)
export const extremeQuestions: MarketingManagerQuestion[] = [
  { question: "Campaign A: Cost R4,000, Revenue R7,000. Campaign B: Cost R6,000, Revenue R10,000. What is the ROI of the campaign with the higher ROI? (answer as percentage)", answer: 75, explanation: "A: 3000/4000=75%. B: 4000/6000=66.7%. A has higher ROI = 75%" },
  { question: "Budget R10,000. R2,000 per platform. Each platform returns 150 customers. Profit per customer R30. How many platforms to maximise profit? (max 5)", answer: 5, explanation: "5 platforms = 5×2000=10000, 5×150×30=R22,500 revenue, profit R12,500" },
  { question: "Campaign X: Cost R3,000, Revenue R5,400. Campaign Y: Cost R5,000, Revenue R8,000. What is the higher ROI (%)?", answer: 80, explanation: "X: 2400/3000=80%. Y: 3000/5000=60%. Higher = 80%" },
  { question: "Budget R8,000. R1,600 per channel. Each channel brings 80 customers. Profit R40 per customer. How many channels to use? (max 5)", answer: 5, explanation: "5×1600=8000, 5×80×40=R16,000 revenue, net R8,000" },
  { question: "A: Cost R2,000, Revenue R3,600. B: Cost R4,000, Revenue R6,400. Higher ROI (%)?", answer: 80, explanation: "A: 1600/2000=80%. B: 2400/4000=60%. Answer 80" },
  { question: "Budget R6,000. R1,500 per campaign. Each campaign gains 100 sales at R25 profit each. How many campaigns? (max 4)", answer: 4, explanation: "4 campaigns: cost 6000, 4×100×25=R10,000 profit" },
  { question: "Campaign P: R5,000 cost, R8,500 revenue. Q: R7,000 cost, R11,200 revenue. Which has higher ROI? Give the higher ROI (%).", answer: 70, explanation: "P: 3500/5000=70%. Q: 4200/7000=60%. Higher 70%" },
  { question: "R12,000 budget. R3,000 per platform. Each: 200 customers, R35 profit each. How many platforms? (max 4)", answer: 4, explanation: "4×3000=12000, 4×200×35=R28,000" },
  { question: "M: Cost R4,000, Revenue R7,200. N: Cost R6,000, Revenue R9,600. Higher ROI (%)?", answer: 80, explanation: "M: 3200/4000=80%. N: 3600/6000=60%. 80%" },
  { question: "Budget R9,000. R2,250 per option. Each option: 90 customers, R50 profit. How many options? (max 4)", answer: 4, explanation: "4×2250=9000, 4×90×50=R18,000" },
  { question: "Campaign A: R3,500 cost, R6,300 revenue. B: R5,500 cost, R8,800 revenue. Higher ROI (%)?", answer: 80, explanation: "A: 2800/3500=80%. B: 3300/5500=60%. 80%" },
  { question: "Budget R15,000. R5,000 per campaign. Each: 120 customers, R40 profit. How many campaigns? (max 3)", answer: 3, explanation: "3×5000=15000, 3×120×40=R14,400" },
  { question: "X: R2,500 cost, R4,500 revenue. Y: R4,000 cost, R6,800 revenue. Higher ROI (%)?", answer: 80, explanation: "X: 2000/2500=80%. Y: 2800/4000=70%. 80%" },
  { question: "Budget R7,000. R1,400 per channel. Each: 70 customers, R30 profit. How many channels? (max 5)", answer: 5, explanation: "5×1400=7000, 5×70×30=R10,500" },
  { question: "Campaign C: R6,000 cost, R10,200 revenue. D: R8,000 cost, R12,800 revenue. Higher ROI (%)?", answer: 70, explanation: "C: 4200/6000=70%. D: 4800/8000=60%. 70%" },
  { question: "R11,000 budget. R2,200 per platform. Each: 110 customers, R45 profit. How many platforms? (max 5)", answer: 5, explanation: "5×2200=11000, 5×110×45=R24,750" },
  { question: "E: R4,500 cost, R7,650 revenue. F: R7,500 cost, R12,000 revenue. Higher ROI (%)?", answer: 70, explanation: "E: 3150/4500=70%. F: 4500/7500=60%. 70%" },
  { question: "Budget R5,000. R1,000 per campaign. Each: 50 customers, R20 profit. How many campaigns? (max 5)", answer: 5, explanation: "5×1000=5000, 5×50×20=R5,000" },
  { question: "G: R5,500 cost, R9,350 revenue. H: R9,000 cost, R14,400 revenue. Higher ROI (%)?", answer: 70, explanation: "G: 3850/5500=70%. H: 5400/9000=60%. 70%" },
  { question: "R14,000 budget. R3,500 per option. Each: 140 customers, R25 profit. How many options? (max 4)", answer: 4, explanation: "4×3500=14000, 4×140×25=R14,000" }
];

export function getMarketingManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): MarketingManagerQuestion {
  let questions: MarketingManagerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
