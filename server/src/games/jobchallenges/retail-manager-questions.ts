// Retail Manager – Shop Profit Challenge (Trading Day Review)
// 20 questions per difficulty tier. All numeric answers. SA context (Rands).

export interface RetailManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Sales & Totals (revenue = price × quantity, total sales)
export const easyQuestions: RetailManagerQuestion[] = [
  { question: "A loaf of bread costs R18. You sell 40 loaves. Total revenue (R)?", answer: 720, explanation: "18 × 40 = R720" },
  { question: "10 customers buy items worth R75 each. Total sales (R)?", answer: 750, explanation: "10 × 75 = R750" },
  { question: "Milk costs R25 per bottle. You sell 20 bottles. Total revenue (R)?", answer: 500, explanation: "25 × 20 = R500" },
  { question: "15 customers spend R60 each. Total sales (R)?", answer: 900, explanation: "15 × 60 = R900" },
  { question: "Cooldrink costs R15. You sell 30. Total revenue (R)?", answer: 450, explanation: "15 × 30 = R450" },
  { question: "8 customers buy items worth R100 each. Total sales (R)?", answer: 800, explanation: "8 × 100 = R800" },
  { question: "Chips cost R22 per packet. You sell 25 packets. Total revenue (R)?", answer: 550, explanation: "22 × 25 = R550" },
  { question: "12 customers spend R45 each. Total sales (R)?", answer: 540, explanation: "12 × 45 = R540" },
  { question: "Sugar costs R28 per bag. You sell 15 bags. Total revenue (R)?", answer: 420, explanation: "28 × 15 = R420" },
  { question: "20 customers buy items worth R50 each. Total sales (R)?", answer: 1000, explanation: "20 × 50 = R1000" },
  { question: "Soap costs R35. You sell 18. Total revenue (R)?", answer: 630, explanation: "35 × 18 = R630" },
  { question: "6 customers spend R120 each. Total sales (R)?", answer: 720, explanation: "6 × 120 = R720" },
  { question: "Rice costs R42 per bag. You sell 10 bags. Total revenue (R)?", answer: 420, explanation: "42 × 10 = R420" },
  { question: "25 customers buy items worth R40 each. Total sales (R)?", answer: 1000, explanation: "25 × 40 = R1000" },
  { question: "Bread rolls cost R12 each. You sell 50. Total revenue (R)?", answer: 600, explanation: "12 × 50 = R600" },
  { question: "9 customers spend R80 each. Total sales (R)?", answer: 720, explanation: "9 × 80 = R720" },
  { question: "Eggs cost R45 per tray. You sell 12 trays. Total revenue (R)?", answer: 540, explanation: "45 × 12 = R540" },
  { question: "14 customers buy items worth R55 each. Total sales (R)?", answer: 770, explanation: "14 × 55 = R770" },
  { question: "Oil costs R65 per bottle. You sell 8 bottles. Total revenue (R)?", answer: 520, explanation: "65 × 8 = R520" },
  { question: "30 customers spend R35 each. Total sales (R)?", answer: 1050, explanation: "30 × 35 = R1050" }
];

// MEDIUM – Markup & Profit (profit per item, total profit)
export const mediumQuestions: RetailManagerQuestion[] = [
  { question: "Shop buys cooldrink at R8 each. Sells at R12 each. Profit per item (R)?", answer: 4, explanation: "12 - 8 = R4" },
  { question: "If 100 units sold at R4 profit each, total profit (R)?", answer: 400, explanation: "100 × 4 = R400" },
  { question: "Shop buys chips at R15. Sells at R22. Profit per item (R)?", answer: 7, explanation: "22 - 15 = R7" },
  { question: "If 50 units sold at R7 profit each, total profit (R)?", answer: 350, explanation: "50 × 7 = R350" },
  { question: "Shop buys bread at R10. Sells at R18. Profit per item (R)?", answer: 8, explanation: "18 - 10 = R8" },
  { question: "If 60 units sold at R8 profit each, total profit (R)?", answer: 480, explanation: "60 × 8 = R480" },
  { question: "Shop buys milk at R18. Sells at R25. Profit per item (R)?", answer: 7, explanation: "25 - 18 = R7" },
  { question: "If 40 units sold at R7 profit each, total profit (R)?", answer: 280, explanation: "40 × 7 = R280" },
  { question: "Shop buys soap at R20. Sells at R35. Profit per item (R)?", answer: 15, explanation: "35 - 20 = R15" },
  { question: "If 25 units sold at R15 profit each, total profit (R)?", answer: 375, explanation: "25 × 15 = R375" },
  { question: "Shop buys sweets at R5. Sells at R9. Profit per item (R)?", answer: 4, explanation: "9 - 5 = R4" },
  { question: "If 80 units sold at R4 profit each, total profit (R)?", answer: 320, explanation: "80 × 4 = R320" },
  { question: "Shop buys rice at R35. Sells at R48. Profit per item (R)?", answer: 13, explanation: "48 - 35 = R13" },
  { question: "If 30 units sold at R13 profit each, total profit (R)?", answer: 390, explanation: "30 × 13 = R390" },
  { question: "Shop buys oil at R50. Sells at R68. Profit per item (R)?", answer: 18, explanation: "68 - 50 = R18" },
  { question: "If 20 units sold at R18 profit each, total profit (R)?", answer: 360, explanation: "20 × 18 = R360" },
  { question: "Shop buys eggs at R38. Sells at R52. Profit per item (R)?", answer: 14, explanation: "52 - 38 = R14" },
  { question: "If 45 units sold at R14 profit each, total profit (R)?", answer: 630, explanation: "45 × 14 = R630" },
  { question: "Shop buys sugar at R22. Sells at R32. Profit per item (R)?", answer: 10, explanation: "32 - 22 = R10" },
  { question: "If 70 units sold at R10 profit each, total profit (R)?", answer: 700, explanation: "70 × 10 = R700" }
];

// HARD – Discounts & Promotions (% off, buy 2 get 1 free effective price)
export const hardQuestions: RetailManagerQuestion[] = [
  { question: "Jacket costs R500. 20% discount applied. New price (R)?", answer: 400, explanation: "500 × 0.80 = R400" },
  { question: "Buy 2 get 1 free. Each item costs R30. Effective price per item (R)?", answer: 20, explanation: "3 for R60 → R20 each" },
  { question: "Shoes cost R800. 25% discount. New price (R)?", answer: 600, explanation: "800 × 0.75 = R600" },
  { question: "Buy 3 get 1 free. Each item R40. Effective price per item (R)?", answer: 30, explanation: "4 for R120 → R30 each" },
  { question: "Shirt costs R350. 15% discount. New price (R)?", answer: 297.5, explanation: "350 × 0.85 = R297.50" },
  { question: "Buy 2 get 1 free. Each item R45. Effective price per item (R)?", answer: 30, explanation: "3 for R90 → R30 each" },
  { question: "Dress costs R600. 30% discount. New price (R)?", answer: 420, explanation: "600 × 0.70 = R420" },
  { question: "Buy 4 get 1 free. Each item R25. Effective price per item (R)?", answer: 20, explanation: "5 for R100 → R20 each" },
  { question: "Jeans cost R450. 10% discount. New price (R)?", answer: 405, explanation: "450 × 0.90 = R405" },
  { question: "Buy 2 get 1 free. Each item R60. Effective price per item (R)?", answer: 40, explanation: "3 for R120 → R40 each" },
  { question: "Cap costs R200. 50% discount. New price (R)?", answer: 100, explanation: "200 × 0.50 = R100" },
  { question: "Buy 3 get 1 free. Each item R36. Effective price per item (R)?", answer: 27, explanation: "4 for R108 → R27 each" },
  { question: "Bag costs R550. 20% discount. New price (R)?", answer: 440, explanation: "550 × 0.80 = R440" },
  { question: "Buy 2 get 1 free. Each item R24. Effective price per item (R)?", answer: 16, explanation: "3 for R48 → R16 each" },
  { question: "Belt costs R180. 25% discount. New price (R)?", answer: 135, explanation: "180 × 0.75 = R135" },
  { question: "Buy 5 get 1 free. Each item R20. Effective price per item (R)?", answer: 16.67, explanation: "6 for R100 → R16.67 each" },
  { question: "Hoodie costs R420. 15% discount. New price (R)?", answer: 357, explanation: "420 × 0.85 = R357" },
  { question: "Buy 2 get 1 free. Each item R90. Effective price per item (R)?", answer: 60, explanation: "3 for R180 → R60 each" },
  { question: "Socks cost R120. 30% discount. New price (R)?", answer: 84, explanation: "120 × 0.70 = R84" },
  { question: "Buy 4 get 1 free. Each item R50. Effective price per item (R)?", answer: 40, explanation: "5 for R200 → R40 each" }
];

// EXTREME – Supply & Demand (demand increase %, projected profit)
export const extremeQuestions: RetailManagerQuestion[] = [
  { question: "Shop sells 200 items per week. Demand increases by 15%. New weekly sales (items)?", answer: 230, explanation: "200 × 1.15 = 230" },
  { question: "Stock costs R5 000. Projected revenue R8 000. What is projected profit (R)?", answer: 3000, explanation: "8000 - 5000 = R3000" },
  { question: "Shop sells 150 items per week. Demand increases by 20%. New weekly sales?", answer: 180, explanation: "150 × 1.20 = 180" },
  { question: "Stock costs R12 000. Projected revenue R15 500. Projected profit (R)?", answer: 3500, explanation: "15500 - 12000 = R3500" },
  { question: "Shop sells 300 items per week. Demand increases by 10%. New weekly sales?", answer: 330, explanation: "300 × 1.10 = 330" },
  { question: "Stock costs R8 000. Projected revenue R11 200. Projected profit (R)?", answer: 3200, explanation: "11200 - 8000 = R3200" },
  { question: "Shop sells 180 items per week. Demand increases by 25%. New weekly sales?", answer: 225, explanation: "180 × 1.25 = 225" },
  { question: "Stock costs R20 000. Projected revenue R26 000. Projected profit (R)?", answer: 6000, explanation: "26000 - 20000 = R6000" },
  { question: "Shop sells 250 items per week. Demand increases by 12%. New weekly sales?", answer: 280, explanation: "250 × 1.12 = 280" },
  { question: "Stock costs R6 500. Projected revenue R9 100. Projected profit (R)?", answer: 2600, explanation: "9100 - 6500 = R2600" },
  { question: "Shop sells 400 items per week. Demand increases by 18%. New weekly sales?", answer: 472, explanation: "400 × 1.18 = 472" },
  { question: "Stock costs R15 000. Projected revenue R19 500. Projected profit (R)?", answer: 4500, explanation: "19500 - 15000 = R4500" },
  { question: "Shop sells 120 items per week. Demand increases by 30%. New weekly sales?", answer: 156, explanation: "120 × 1.30 = 156" },
  { question: "Stock costs R9 000. Projected revenue R12 600. Projected profit (R)?", answer: 3600, explanation: "12600 - 9000 = R3600" },
  { question: "Shop sells 350 items per week. Demand increases by 8%. New weekly sales?", answer: 378, explanation: "350 × 1.08 = 378" },
  { question: "Stock costs R22 000. Projected revenue R28 600. Projected profit (R)?", answer: 6600, explanation: "28600 - 22000 = R6600" },
  { question: "Shop sells 275 items per week. Demand increases by 14%. New weekly sales?", answer: 313.5, explanation: "275 × 1.14 = 313.5" },
  { question: "Stock costs R11 000. Projected revenue R14 300. Projected profit (R)?", answer: 3300, explanation: "14300 - 11000 = R3300" },
  { question: "Shop sells 500 items per week. Demand increases by 22%. New weekly sales?", answer: 610, explanation: "500 × 1.22 = 610" },
  { question: "Stock costs R7 500. Projected revenue R10 500. Projected profit (R)?", answer: 3000, explanation: "10500 - 7500 = R3000" }
];

export function getRetailManagerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): RetailManagerQuestion {
  let questions: RetailManagerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
