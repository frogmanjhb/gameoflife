// Retail Manager – Shop Profit Challenge (Trading Day Review)
// 20 questions per difficulty tier. All numeric answers. SA context (Rands).

export interface RetailManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Sales & Totals (revenue = price × quantity, total sales)
export const easyQuestions: RetailManagerQuestion[] = [
  { question: "Brown bread costs R47 per loaf. You sell 38 loaves. Total revenue (R)?", answer: 1786, explanation: "47 × 38 = R1,786" },
  { question: "9 customers buy R73 worth of groceries each. Total sales (R)?", answer: 657, explanation: "9 × 73 = R657" },
  { question: "Fresh milk R21 per litre. You sell 42 litres. Total revenue (R)?", answer: 882, explanation: "21 × 42 = R882" },
  { question: "14 customers spend R63 each at the tuck shop. Total sales (R)?", answer: 882, explanation: "14 × 63 = R882" },
  { question: "Instant noodles R13 per pack. You sell 72 packs. Total revenue (R)?", answer: 936, explanation: "13 × 72 = R936" },
  { question: "8 customers buy R118 worth of braai supplies each. Total sales (R)?", answer: 944, explanation: "8 × 118 = R944" },
  { question: "Dried fruit R76 per 200 g pack. You sell 26 packs. Total revenue (R)?", answer: 1976, explanation: "76 × 26 = R1,976" },
  { question: "15 customers spend R67 each. Total sales (R)?", answer: 1005, explanation: "15 × 67 = R1,005" },
  { question: "Cooking oil R41 per bottle. You sell 31 bottles. Total revenue (R)?", answer: 1271, explanation: "41 × 31 = R1,271" },
  { question: "19 customers buy R54 worth of snacks each. Total sales (R)?", answer: 1026, explanation: "19 × 54 = R1,026" },
  { question: "Paper towels R36 per bundle. You sell 23 bundles. Total revenue (R)?", answer: 828, explanation: "36 × 23 = R828" },
  { question: "6 customers spend R185 each on school uniforms. Total sales (R)?", answer: 1110, explanation: "6 × 185 = R1,110" },
  { question: "Tomato sauce R17 per bottle. You sell 48 bottles. Total revenue (R)?", answer: 816, explanation: "17 × 48 = R816" },
  { question: "21 customers buy R59 worth of produce each. Total sales (R)?", answer: 1239, explanation: "21 × 59 = R1,239" },
  { question: "Oats R27 per packet. You sell 36 packets. Total revenue (R)?", answer: 972, explanation: "27 × 36 = R972" },
  { question: "12 customers spend R88 each. Total sales (R)?", answer: 1056, explanation: "12 × 88 = R1,056" },
  { question: "Dish soap R49 per bottle. You sell 17 bottles. Total revenue (R)?", answer: 833, explanation: "49 × 17 = R833" },
  { question: "20 customers buy R81 worth of items each. Total sales (R)?", answer: 1620, explanation: "20 × 81 = R1,620" },
  { question: "Herbal tea R29 per box. You sell 33 boxes. Total revenue (R)?", answer: 957, explanation: "29 × 33 = R957" },
  { question: "26 customers spend R41 each. Total sales (R)?", answer: 1066, explanation: "26 × 41 = R1,066" }
];

// MEDIUM – Markup & Profit (profit per item, total profit)
export const mediumQuestions: RetailManagerQuestion[] = [
  { question: "Shop buys samoosas at R7 each. Sells at R13. Profit per item (R)?", answer: 6, explanation: "13 − 7 = R6" },
  { question: "If 95 samoosas sold at R6 profit each, total profit (R)?", answer: 570, explanation: "95 × 6 = R570" },
  { question: "Shop buys kota rolls at R18. Sells at R32. Profit per item (R)?", answer: 14, explanation: "32 − 18 = R14" },
  { question: "If 45 kota rolls sold at R14 profit each, total profit (R)?", answer: 630, explanation: "45 × 14 = R630" },
  { question: "Shop buys rice at R39. Sells at R54. Profit per item (R)?", answer: 15, explanation: "54 − 39 = R15" },
  { question: "If 62 bags sold at R15 profit each, total profit (R)?", answer: 930, explanation: "62 × 15 = R930" },
  { question: "Shop buys juice at R10. Sells at R17. Profit per item (R)?", answer: 7, explanation: "17 − 10 = R7" },
  { question: "If 110 units sold at R7 profit each, total profit (R)?", answer: 770, explanation: "110 × 7 = R770" },
  { question: "Shop buys data bundles at R52. Sells at R60. Profit per item (R)?", answer: 8, explanation: "60 − 52 = R8" },
  { question: "If 58 vouchers sold at R8 profit each, total profit (R)?", answer: 464, explanation: "58 × 8 = R464" },
  { question: "Shop buys popcorn at R12. Sells at R20. Profit per item (R)?", answer: 8, explanation: "20 − 12 = R8" },
  { question: "If 85 bags sold at R8 profit each, total profit (R)?", answer: 680, explanation: "85 × 8 = R680" },
  { question: "Shop buys soap bars at R9. Sells at R16. Profit per item (R)?", answer: 7, explanation: "16 − 9 = R7" },
  { question: "If 68 soap bars sold at R7 profit each, total profit (R)?", answer: 476, explanation: "68 × 7 = R476" },
  { question: "Shop buys jam at R31. Sells at R47. Profit per item (R)?", answer: 16, explanation: "47 − 31 = R16" },
  { question: "If 42 jars sold at R16 profit each, total profit (R)?", answer: 672, explanation: "42 × 16 = R672" },
  { question: "Shop buys lighters at R4. Sells at R8. Profit per item (R)?", answer: 4, explanation: "8 − 4 = R4" },
  { question: "If 175 lighters sold at R4 profit each, total profit (R)?", answer: 700, explanation: "175 × 4 = R700" },
  { question: "Shop buys beans at R27. Sells at R41. Profit per item (R)?", answer: 14, explanation: "41 − 27 = R14" },
  { question: "If 52 bags sold at R14 profit each, total profit (R)?", answer: 728, explanation: "52 × 14 = R728" }
];

// HARD – Discounts & Promotions (% off, buy-X-get-Y effective price)
export const hardQuestions: RetailManagerQuestion[] = [
  { question: "School jersey costs R720. 15% winter discount. New price (R)?", answer: 612, explanation: "720 × 0.85 = R612" },
  { question: "Buy 2 get 1 free. Each soap bar R30. Effective price per bar (R)?", answer: 20, explanation: "3 for R60 → R20 each" },
  { question: "Running shoes R880. 20% clearance sale. New price (R)?", answer: 704, explanation: "880 × 0.80 = R704" },
  { question: "Buy 3 get 1 free. Each cooldrink R20. Effective price per item (R)?", answer: 15, explanation: "4 for R60 → R15 each" },
  { question: "Winter coat R840. 10% cold snap promo. New price (R)?", answer: 756, explanation: "840 × 0.90 = R756" },
  { question: "Buy 2 get 1 free. Each chutney jar R39. Effective price per jar (R)?", answer: 26, explanation: "3 for R78 → R26 each" },
  { question: "Sandals R360. 25% summer sale. New price (R)?", answer: 270, explanation: "360 × 0.75 = R270" },
  { question: "Buy 4 get 1 free. Each snack pack R25. Effective price per pack (R)?", answer: 20, explanation: "5 for R100 → R20 each" },
  { question: "Backpack R580. 10% student discount. New price (R)?", answer: 522, explanation: "580 × 0.90 = R522" },
  { question: "Buy 2 get 1 free. Each boerie roll R36. Effective price per roll (R)?", answer: 24, explanation: "3 for R72 → R24 each" },
  { question: "Sun hat R180. 40% beach season special. New price (R)?", answer: 108, explanation: "180 × 0.60 = R108" },
  { question: "Buy 3 get 1 free. Each pasta pack R32. Effective price per pack (R)?", answer: 24, explanation: "4 for R96 → R24 each" },
  { question: "Rain jacket R640. 20% rainy-day discount. New price (R)?", answer: 512, explanation: "640 × 0.80 = R512" },
  { question: "Buy 2 get 1 free. Each yoghurt R21. Effective price per tub (R)?", answer: 14, explanation: "3 for R42 → R14 each" },
  { question: "Tracksuit R480. 25% sports day sale. New price (R)?", answer: 360, explanation: "480 × 0.75 = R360" },
  { question: "Buy 5 get 1 free. Each pen R15. Effective price per pen (R)?", answer: 12.5, explanation: "6 for R75 → R12.50 each" },
  { question: "Gumboots R400. 15% winter promo. New price (R)?", answer: 340, explanation: "400 × 0.85 = R340" },
  { question: "Buy 2 get 1 free. Each pie R45. Effective price per pie (R)?", answer: 30, explanation: "3 for R90 → R30 each" },
  { question: "Blanket R320. 30% cold front sale. New price (R)?", answer: 224, explanation: "320 × 0.70 = R224" },
  { question: "Buy 4 get 1 free. Each juice box R18. Effective price per box (R)?", answer: 14.4, explanation: "5 for R72 → R14.40 each" }
];

// EXTREME – Demand & Forecasting (demand growth %, projected profit)
export const extremeQuestions: RetailManagerQuestion[] = [
  { question: "Shop sells 280 maize meal bags per week. Demand rises 12%. New weekly sales (bags)?", answer: 313.6, explanation: "280 × 1.12 = 313.6" },
  { question: "Stock costs R7,200. Projected revenue R10,800. Projected profit (R)?", answer: 3600, explanation: "10,800 − 7,200 = R3,600" },
  { question: "Shop sells 195 cooldrinks per week. Demand rises 15%. New weekly sales?", answer: 224.25, explanation: "195 × 1.15 = 224.25" },
  { question: "Stock costs R15,500. Projected revenue R19,750. Projected profit (R)?", answer: 4250, explanation: "19,750 − 15,500 = R4,250" },
  { question: "Shop sells 340 bread loaves per week. Demand rises 8%. New weekly sales?", answer: 367.2, explanation: "340 × 1.08 = 367.2" },
  { question: "Stock costs R10,400. Projected revenue R14,560. Projected profit (R)?", answer: 4160, explanation: "14,560 − 10,400 = R4,160" },
  { question: "Shop sells 210 airtime vouchers per week. Demand rises 20%. New weekly sales?", answer: 252, explanation: "210 × 1.20 = 252" },
  { question: "Stock costs R23,000. Projected revenue R30,360. Projected profit (R)?", answer: 7360, explanation: "30,360 − 23,000 = R7,360" },
  { question: "Shop sells 285 snack packs per week. Demand rises 10%. New weekly sales?", answer: 313.5, explanation: "285 × 1.10 = 313.5" },
  { question: "Stock costs R8,600. Projected revenue R11,830. Projected profit (R)?", answer: 3230, explanation: "11,830 − 8,600 = R3,230" },
  { question: "Shop sells 430 stationery items per week. Demand rises 16%. New weekly sales?", answer: 498.8, explanation: "430 × 1.16 = 498.8" },
  { question: "Stock costs R17,800. Projected revenue R23,140. Projected profit (R)?", answer: 5340, explanation: "23,140 − 17,800 = R5,340" },
  { question: "Shop sells 150 boerewors rolls per week. Demand rises 24%. New weekly sales?", answer: 186, explanation: "150 × 1.24 = 186" },
  { question: "Stock costs R11,600. Projected revenue R15,660. Projected profit (R)?", answer: 4060, explanation: "15,660 − 11,600 = R4,060" },
  { question: "Shop sells 395 milk bottles per week. Demand rises 6%. New weekly sales?", answer: 418.7, explanation: "395 × 1.06 = 418.7" },
  { question: "Stock costs R25,500. Projected revenue R33,150. Projected profit (R)?", answer: 7650, explanation: "33,150 − 25,500 = R7,650" },
  { question: "Shop sells 310 rice bags per week. Demand rises 18%. New weekly sales?", answer: 365.8, explanation: "310 × 1.18 = 365.8" },
  { question: "Stock costs R13,200. Projected revenue R17,160. Projected profit (R)?", answer: 3960, explanation: "17,160 − 13,200 = R3,960" },
  { question: "Shop sells 560 sweets per week. Demand rises 25%. New weekly sales?", answer: 700, explanation: "560 × 1.25 = 700" },
  { question: "Stock costs R9,750. Projected revenue R13,650. Projected profit (R)?", answer: 3900, explanation: "13,650 − 9,750 = R3,900" }
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
