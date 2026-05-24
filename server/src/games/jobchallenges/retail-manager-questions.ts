// Retail Manager – Shop Profit Challenge (Trading Day Review)
// 20 questions per difficulty tier. All numeric answers. SA context (Rands).

export interface RetailManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Sales & Totals (revenue = price × quantity, total sales)
export const easyQuestions: RetailManagerQuestion[] = [
  { question: "Maize meal costs R52 per 5 kg bag. You sell 35 bags. Total revenue (R)?", answer: 1820, explanation: "52 × 35 = R1,820" },
  { question: "11 customers buy R68 worth of groceries each. Total sales (R)?", answer: 748, explanation: "11 × 68 = R748" },
  { question: "Long-life milk R19 per litre. You sell 45 litres. Total revenue (R)?", answer: 855, explanation: "19 × 45 = R855" },
  { question: "16 customers spend R55 each at the tuck shop. Total sales (R)?", answer: 880, explanation: "16 × 55 = R880" },
  { question: "Two-minute noodles R14 per pack. You sell 60 packs. Total revenue (R)?", answer: 840, explanation: "14 × 60 = R840" },
  { question: "7 customers buy R125 worth of braai supplies each. Total sales (R)?", answer: 875, explanation: "7 × 125 = R875" },
  { question: "Biltong costs R89 per 100 g pack. You sell 22 packs. Total revenue (R)?", answer: 1958, explanation: "89 × 22 = R1,958" },
  { question: "13 customers spend R72 each. Total sales (R)?", answer: 936, explanation: "13 × 72 = R936" },
  { question: "Sunflower oil R38 per bottle. You sell 28 bottles. Total revenue (R)?", answer: 1064, explanation: "38 × 28 = R1,064" },
  { question: "22 customers buy R48 worth of snacks each. Total sales (R)?", answer: 1056, explanation: "22 × 48 = R1,056" },
  { question: "Toilet paper R42 per bundle. You sell 19 bundles. Total revenue (R)?", answer: 798, explanation: "42 × 19 = R798" },
  { question: "5 customers spend R210 each on school uniforms. Total sales (R)?", answer: 1050, explanation: "5 × 210 = R1,050" },
  { question: "Baked beans R16 per tin. You sell 55 tins. Total revenue (R)?", answer: 880, explanation: "16 × 55 = R880" },
  { question: "18 customers buy R62 worth of produce each. Total sales (R)?", answer: 1116, explanation: "18 × 62 = R1,116" },
  { question: "Rusks R24 per packet. You sell 40 packets. Total revenue (R)?", answer: 960, explanation: "24 × 40 = R960" },
  { question: "10 customers spend R95 each. Total sales (R)?", answer: 950, explanation: "10 × 95 = R950" },
  { question: "Washing powder R58 per box. You sell 14 boxes. Total revenue (R)?", answer: 812, explanation: "58 × 14 = R812" },
  { question: "17 customers buy R78 worth of items each. Total sales (R)?", answer: 1326, explanation: "17 × 78 = R1,326" },
  { question: "Rooibos tea R32 per box. You sell 26 boxes. Total revenue (R)?", answer: 832, explanation: "32 × 26 = R832" },
  { question: "24 customers spend R44 each. Total sales (R)?", answer: 1056, explanation: "24 × 44 = R1,056" }
];

// MEDIUM – Markup & Profit (profit per item, total profit)
export const mediumQuestions: RetailManagerQuestion[] = [
  { question: "Shop buys vetkoek dough at R6 each. Sells at R11. Profit per item (R)?", answer: 5, explanation: "11 − 6 = R5" },
  { question: "If 85 vetkoek sold at R5 profit each, total profit (R)?", answer: 425, explanation: "85 × 5 = R425" },
  { question: "Shop buys boerewors rolls at R22. Sells at R35. Profit per item (R)?", answer: 13, explanation: "35 − 22 = R13" },
  { question: "If 40 rolls sold at R13 profit each, total profit (R)?", answer: 520, explanation: "40 × 13 = R520" },
  { question: "Shop buys maize meal at R44. Sells at R58. Profit per item (R)?", answer: 14, explanation: "58 − 44 = R14" },
  { question: "If 55 bags sold at R14 profit each, total profit (R)?", answer: 770, explanation: "55 × 14 = R770" },
  { question: "Shop buys cooldrink at R9. Sells at R15. Profit per item (R)?", answer: 6, explanation: "15 − 9 = R6" },
  { question: "If 120 units sold at R6 profit each, total profit (R)?", answer: 720, explanation: "120 × 6 = R720" },
  { question: "Shop buys airtime vouchers at R48. Sells at R55. Profit per item (R)?", answer: 7, explanation: "55 − 48 = R7" },
  { question: "If 65 vouchers sold at R7 profit each, total profit (R)?", answer: 455, explanation: "65 × 7 = R455" },
  { question: "Shop buys chips at R11. Sells at R18. Profit per item (R)?", answer: 7, explanation: "18 − 11 = R7" },
  { question: "If 90 packets sold at R7 profit each, total profit (R)?", answer: 630, explanation: "90 × 7 = R630" },
  { question: "Shop buys candles at R8. Sells at R14. Profit per item (R)?", answer: 6, explanation: "14 − 8 = R6" },
  { question: "If 75 candles sold at R6 profit each, total profit (R)?", answer: 450, explanation: "75 × 6 = R450" },
  { question: "Shop buys peanut butter at R28. Sells at R42. Profit per item (R)?", answer: 14, explanation: "42 − 28 = R14" },
  { question: "If 35 jars sold at R14 profit each, total profit (R)?", answer: 490, explanation: "35 × 14 = R490" },
  { question: "Shop buys matches at R3. Sells at R6. Profit per item (R)?", answer: 3, explanation: "6 − 3 = R3" },
  { question: "If 200 boxes sold at R3 profit each, total profit (R)?", answer: 600, explanation: "200 × 3 = R600" },
  { question: "Shop buys samp at R32. Sells at R46. Profit per item (R)?", answer: 14, explanation: "46 − 32 = R14" },
  { question: "If 48 bags sold at R14 profit each, total profit (R)?", answer: 672, explanation: "48 × 14 = R672" }
];

// HARD – Discounts & Promotions (% off, buy 2 get 1 free effective price)
export const hardQuestions: RetailManagerQuestion[] = [
  { question: "School blazer costs R680. 20% back-to-school discount. New price (R)?", answer: 544, explanation: "680 × 0.80 = R544" },
  { question: "Buy 2 get 1 free. Each soap bar R27. Effective price per bar (R)?", answer: 18, explanation: "3 for R54 → R18 each" },
  { question: "Running shoes R920. 25% clearance sale. New price (R)?", answer: 690, explanation: "920 × 0.75 = R690" },
  { question: "Buy 3 get 1 free. Each cooldrink R16. Effective price per item (R)?", answer: 12, explanation: "4 for R48 → R12 each" },
  { question: "Winter jacket R780. 15% cold snap promo. New price (R)?", answer: 663, explanation: "780 × 0.85 = R663" },
  { question: "Buy 2 get 1 free. Each chutney jar R36. Effective price per jar (R)?", answer: 24, explanation: "3 for R72 → R24 each" },
  { question: "Sandals R340. 30% summer sale. New price (R)?", answer: 238, explanation: "340 × 0.70 = R238" },
  { question: "Buy 4 get 1 free. Each snack pack R20. Effective price per pack (R)?", answer: 16, explanation: "5 for R80 → R16 each" },
  { question: "Backpack R560. 10% student discount. New price (R)?", answer: 504, explanation: "560 × 0.90 = R504" },
  { question: "Buy 2 get 1 free. Each boerie roll R33. Effective price per roll (R)?", answer: 22, explanation: "3 for R66 → R22 each" },
  { question: "Sun hat R160. 50% beach season special. New price (R)?", answer: 80, explanation: "160 × 0.50 = R80" },
  { question: "Buy 3 get 1 free. Each pasta pack R28. Effective price per pack (R)?", answer: 21, explanation: "4 for R84 → R21 each" },
  { question: "Rain jacket R620. 20% rainy-day discount. New price (R)?", answer: 496, explanation: "620 × 0.80 = R496" },
  { question: "Buy 2 get 1 free. Each yoghurt R18. Effective price per tub (R)?", answer: 12, explanation: "3 for R36 → R12 each" },
  { question: "Tracksuit R450. 25% sports day sale. New price (R)?", answer: 337.5, explanation: "450 × 0.75 = R337.50" },
  { question: "Buy 5 get 1 free. Each pen R12. Effective price per pen (R)?", answer: 10, explanation: "6 for R60 → R10 each" },
  { question: "Gumboots R380. 15% winter promo. New price (R)?", answer: 323, explanation: "380 × 0.85 = R323" },
  { question: "Buy 2 get 1 free. Each pie R42. Effective price per pie (R)?", answer: 28, explanation: "3 for R84 → R28 each" },
  { question: "Blanket R290. 30% cold front sale. New price (R)?", answer: 203, explanation: "290 × 0.70 = R203" },
  { question: "Buy 4 get 1 free. Each juice box R15. Effective price per box (R)?", answer: 12, explanation: "5 for R60 → R12 each" }
];

// EXTREME – Supply & Demand (demand increase %, projected profit)
export const extremeQuestions: RetailManagerQuestion[] = [
  { question: "Shop sells 240 maize meal bags per week. Demand rises 15%. New weekly sales (bags)?", answer: 276, explanation: "240 × 1.15 = 276" },
  { question: "Stock costs R6,500. Projected revenue R9,750. Projected profit (R)?", answer: 3250, explanation: "9,750 − 6,500 = R3,250" },
  { question: "Shop sells 175 cooldrinks per week. Demand rises 20%. New weekly sales?", answer: 210, explanation: "175 × 1.20 = 210" },
  { question: "Stock costs R14,000. Projected revenue R18,200. Projected profit (R)?", answer: 4200, explanation: "18,200 − 14,000 = R4,200" },
  { question: "Shop sells 320 bread loaves per week. Demand rises 10%. New weekly sales?", answer: 352, explanation: "320 × 1.10 = 352" },
  { question: "Stock costs R9,600. Projected revenue R13,440. Projected profit (R)?", answer: 3840, explanation: "13,440 − 9,600 = R3,840" },
  { question: "Shop sells 190 airtime vouchers per week. Demand rises 25%. New weekly sales?", answer: 237.5, explanation: "190 × 1.25 = 237.5" },
  { question: "Stock costs R22,500. Projected revenue R29,250. Projected profit (R)?", answer: 6750, explanation: "29,250 − 22,500 = R6,750" },
  { question: "Shop sells 265 snack packs per week. Demand rises 12%. New weekly sales?", answer: 296.8, explanation: "265 × 1.12 = 296.8" },
  { question: "Stock costs R7,800. Projected revenue R10,920. Projected profit (R)?", answer: 3120, explanation: "10,920 − 7,800 = R3,120" },
  { question: "Shop sells 410 stationery items per week. Demand rises 18%. New weekly sales?", answer: 483.8, explanation: "410 × 1.18 = 483.8" },
  { question: "Stock costs R16,500. Projected revenue R21,450. Projected profit (R)?", answer: 4950, explanation: "21,450 − 16,500 = R4,950" },
  { question: "Shop sells 135 boerewors rolls per week. Demand rises 30%. New weekly sales?", answer: 175.5, explanation: "135 × 1.30 = 175.5" },
  { question: "Stock costs R10,200. Projected revenue R14,280. Projected profit (R)?", answer: 4080, explanation: "14,280 − 10,200 = R4,080" },
  { question: "Shop sells 380 milk bottles per week. Demand rises 8%. New weekly sales?", answer: 410.4, explanation: "380 × 1.08 = 410.4" },
  { question: "Stock costs R24,000. Projected revenue R31,200. Projected profit (R)?", answer: 7200, explanation: "31,200 − 24,000 = R7,200" },
  { question: "Shop sells 295 rice bags per week. Demand rises 14%. New weekly sales?", answer: 336.3, explanation: "295 × 1.14 = 336.3" },
  { question: "Stock costs R12,400. Projected revenue R16,120. Projected profit (R)?", answer: 3720, explanation: "16,120 − 12,400 = R3,720" },
  { question: "Shop sells 520 sweets per week. Demand rises 22%. New weekly sales?", answer: 634.4, explanation: "520 × 1.22 = 634.4" },
  { question: "Stock costs R8,900. Projected revenue R12,460. Projected profit (R)?", answer: 3560, explanation: "12,460 − 8,900 = R3,560" }
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
