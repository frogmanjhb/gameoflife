// Entrepreneur – Business Builder Challenge (Business Scenario) – client, same as server
// 20 questions per difficulty tier. All numeric answers. SA context (Rands).

export interface EntrepreneurQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: EntrepreneurQuestion[] = [
  { question: "You sell muffins for R8 each. Ingredients cost R3 each. You sell 65 at the school gate. Total profit (R)?", answer: 325, explanation: "(8 - 3) × 65 = R325" },
  { question: "Saturday market stall revenue R3 850. Table hire and stock cost R2 350. Profit (R)?", answer: 1500, explanation: "3850 - 2350 = R1,500" },
  { question: "Handmade earrings: cost R22 each, sell R38 each. You sell 40. Total profit (R)?", answer: 640, explanation: "(38 - 22) × 40 = R640" },
  { question: "Tutoring revenue R5 200. Transport and worksheets cost R3 100. Profit (R)?", answer: 2100, explanation: "5200 - 3100 = R2,100" },
  { question: "Frozen lollies: cost R5 each, sell R11 each. You sell 110 on a hot day. Total profit (R)?", answer: 660, explanation: "(11 - 5) × 110 = R660" },
  { question: "You earn R3 100 from a bake sale. Flour and sugar cost R1 720. Profit (R)?", answer: 1380, explanation: "3100 - 1720 = R1,380" },
  { question: "Screen protectors: cost R25 each, sell R48 each. You sell 32. Total profit (R)?", answer: 736, explanation: "(48 - 25) × 32 = R736" },
  { question: "Revenue from a car wash R6 300. Soap and water cost R3 700. Profit (R)?", answer: 2600, explanation: "6300 - 3700 = R2,600" },
  { question: "Lunch boxes: cost R9 each, sell R18 each. You sell 85. Total profit (R)?", answer: 765, explanation: "(18 - 9) × 85 = R765" },
  { question: "You earn R6 800 from a craft fair. Materials and booth fee cost R4 450. Profit (R)?", answer: 2350, explanation: "6800 - 4450 = R2,350" },
  { question: "Custom hoodies: cost R62 each, sell R105 each. You sell 22. Total profit (R)?", answer: 946, explanation: "(105 - 62) × 22 = R946" },
  { question: "Revenue R3 480. Packaging and ingredients cost R2 050. Profit (R)?", answer: 1430, explanation: "3480 - 2050 = R1,430" },
  { question: "Herb pots: cost R14 each, sell R32 each. You sell 50. Total profit (R)?", answer: 900, explanation: "(32 - 14) × 50 = R900" },
  { question: "You earn R2 240 from pet-sitting. Treats and travel cost R920. Profit (R)?", answer: 1320, explanation: "2240 - 920 = R1,320" },
  { question: "Wire bracelets: cost R11 each, sell R24 each. You sell 75. Total profit (R)?", answer: 975, explanation: "(24 - 11) × 75 = R975" },
  { question: "Revenue R8 100. Stock and rent cost R5 600. Profit (R)?", answer: 2500, explanation: "8100 - 5600 = R2,500" },
  { question: "Fruit shakes: cost R13 each, sell R28 each. You sell 52. Total profit (R)?", answer: 780, explanation: "(28 - 13) × 52 = R780" },
  { question: "You earn R4 950 from a pop-up shop. Display and stock cost R3 120. Profit (R)?", answer: 1830, explanation: "4950 - 3120 = R1,830" },
  { question: "Used textbooks: cost R18 each, sell R40 each. You sell 38. Total profit (R)?", answer: 836, explanation: "(40 - 18) × 38 = R836" },
  { question: "Revenue R3 900. Supplies and advertising cost R2 340. Profit (R)?", answer: 1560, explanation: "3900 - 2340 = R1,560" }
];

const mediumQuestions: EntrepreneurQuestion[] = [
  { question: "Startup cost = R7 200. Profit per muffin = R24. How many must you sell to break even?", answer: 300, explanation: "7200 ÷ 24 = 300 units" },
  { question: "Weekly profit = R720. How many weeks to recover R4 320 startup cost?", answer: 6, explanation: "4320 ÷ 720 = 6 weeks" },
  { question: "Startup cost = R10 400. Profit per earring = R52. How many units to break even?", answer: 200, explanation: "10400 ÷ 52 = 200 units" },
  { question: "Weekly profit = R840. How many weeks to recover R5 880 startup cost?", answer: 7, explanation: "5880 ÷ 840 = 7 weeks" },
  { question: "Startup cost = R5 400. Profit per lolly = R18. How many units to break even?", answer: 300, explanation: "5400 ÷ 18 = 300 units" },
  { question: "Weekly profit = R920. How many weeks to recover R5 520 startup cost?", answer: 6, explanation: "5520 ÷ 920 = 6 weeks" },
  { question: "Startup cost = R12 100. Profit per lunch box = R55. How many units to break even?", answer: 220, explanation: "12100 ÷ 55 = 220 units" },
  { question: "Weekly profit = R580. How many weeks to recover R4 640 startup cost?", answer: 8, explanation: "4640 ÷ 580 = 8 weeks" },
  { question: "Startup cost = R8 400. Profit per herb pot = R28. How many units to break even?", answer: 300, explanation: "8400 ÷ 28 = 300 units" },
  { question: "Weekly profit = R1 050. How many weeks to recover R6 300 startup cost?", answer: 6, explanation: "6300 ÷ 1050 = 6 weeks" },
  { question: "Startup cost = R14 750. Profit per hoodie = R59. How many units to break even?", answer: 250, explanation: "14750 ÷ 59 = 250 units" },
  { question: "Startup cost = R6 300. Profit per fruit shake = R31. How many units to break even?", answer: 203.23, explanation: "6300 ÷ 31" },
  { question: "Startup cost = R6 200. Profit per fruit shake = R31. How many units to break even?", answer: 200, explanation: "6200 ÷ 31 = 200 units" },
  { question: "Weekly profit = R460. How many weeks to recover R2 760 startup cost?", answer: 6, explanation: "2760 ÷ 460 = 6 weeks" },
  { question: "Startup cost = R9 150. Profit per bracelet = R61. How many units to break even?", answer: 150, explanation: "9150 ÷ 61 = 150 units" },
  { question: "Weekly profit = R820. How many weeks to recover R6 560 startup cost?", answer: 8, explanation: "6560 ÷ 820 = 8 weeks" },
  { question: "Startup cost = R4 200. Profit per book = R21. How many units to break even?", answer: 200, explanation: "4200 ÷ 21 = 200 units" },
  { question: "Weekly profit = R640. How many weeks to recover R3 840 startup cost?", answer: 6, explanation: "3840 ÷ 640 = 6 weeks" },
  { question: "Startup cost = R11 700. Profit per screen protector = R58. How many units to break even?", answer: 201.72, explanation: "11700 ÷ 58" },
  { question: "Weekly profit = R530. How many weeks to recover R4 240 startup cost?", answer: 8, explanation: "4240 ÷ 530 = 8 weeks" }
];

const hardQuestions: EntrepreneurQuestion[] = [
  { question: "Revenue last week = R12 800. This week increases by 15%. New revenue (R)?", answer: 14720, explanation: "12800 × 1.15 = R14,720" },
  { question: "Profit = R3 080. Revenue = R12 320. What is profit margin (%)?", answer: 25, explanation: "3080 ÷ 12320 × 100 = 25%" },
  { question: "Revenue last week = R10 500. This week increases by 20%. New revenue (R)?", answer: 12600, explanation: "10500 × 1.20 = R12,600" },
  { question: "Profit = R2 040. Revenue = R10 200. Profit margin (%)?", answer: 20, explanation: "2040 ÷ 10200 × 100 = 20%" },
  { question: "Revenue last week = R18 400. This week increases by 25%. New revenue (R)?", answer: 23000, explanation: "18400 × 1.25 = R23,000" },
  { question: "Profit = R2 760. Revenue = R11 040. Profit margin (%)?", answer: 25, explanation: "2760 ÷ 11040 × 100 = 25%" },
  { question: "Revenue last week = R8 200. This week increases by 30%. New revenue (R)?", answer: 10660, explanation: "8200 × 1.30 = R10,660" },
  { question: "Profit = R4 260. Revenue = R14 200. Profit margin (%)?", answer: 30, explanation: "4260 ÷ 14200 × 100 = 30%" },
  { question: "Revenue last week = R14 600. This week increases by 10%. New revenue (R)?", answer: 16060, explanation: "14600 × 1.10 = R16,060" },
  { question: "Profit = R1 560. Revenue = R7 800. Profit margin (%)?", answer: 20, explanation: "1560 ÷ 7800 × 100 = 20%" },
  { question: "Revenue last week = R24 000. This week increases by 18%. New revenue (R)?", answer: 28320, explanation: "24000 × 1.18 = R28,320" },
  { question: "Profit = R3 720. Revenue = R14 880. Profit margin (%)?", answer: 25, explanation: "3720 ÷ 14880 × 100 = 25%" },
  { question: "Revenue last week = R9 600. This week increases by 12%. New revenue (R)?", answer: 10752, explanation: "9600 × 1.12 = R10,752" },
  { question: "Profit = R2 880. Revenue = R11 520. Profit margin (%)?", answer: 25, explanation: "2880 ÷ 11520 × 100 = 25%" },
  { question: "Revenue last week = R11 400. This week increases by 22%. New revenue (R)?", answer: 13908, explanation: "11400 × 1.22 = R13,908" },
  { question: "Profit = R1 920. Revenue = R9 600. Profit margin (%)?", answer: 20, explanation: "1920 ÷ 9600 × 100 = 20%" },
  { question: "Revenue last week = R13 500. This week increases by 8%. New revenue (R)?", answer: 14580, explanation: "13500 × 1.08 = R14,580" },
  { question: "Profit = R4 680. Revenue = R18 720. Profit margin (%)?", answer: 25, explanation: "4680 ÷ 18720 × 100 = 25%" },
  { question: "Revenue last week = R16 800. This week increases by 16%. New revenue (R)?", answer: 19488, explanation: "16800 × 1.16 = R19,488" },
  { question: "Profit = R1 620. Revenue = R8 100. Profit margin (%)?", answer: 20, explanation: "1620 ÷ 8100 × 100 = 20%" }
];

const extremeQuestions: EntrepreneurQuestion[] = [
  { question: "Investor gives R14 000 for 20% ownership. Business makes R6 200 profit. How much does investor receive (R)?", answer: 1240, explanation: "6200 × 0.20 = R1,240" },
  { question: "Supplier costs were R10 800. Costs increase by 15%. New costs (R)?", answer: 12420, explanation: "10800 × 1.15 = R12,420" },
  { question: "Investor gives R24 000 for 25% ownership. Business makes R8 400 profit. How much does investor receive (R)?", answer: 2100, explanation: "8400 × 0.25 = R2,100" },
  { question: "Supplier costs were R16 500. Costs increase by 20%. New costs (R)?", answer: 19800, explanation: "16500 × 1.20 = R19,800" },
  { question: "Investor gives R18 000 for 15% ownership. Business makes R7 200 profit. How much does investor receive (R)?", answer: 1080, explanation: "7200 × 0.15 = R1,080" },
  { question: "Revenue R13 800. Costs were R8 200 and increase by 10%. New profit (R)?", answer: 4780, explanation: "13800 - 9020 = R4,780" },
  { question: "Investor gives R30 000 for 30% ownership. Business makes R10 500 profit. How much does investor receive (R)?", answer: 3150, explanation: "10500 × 0.30 = R3,150" },
  { question: "Supplier costs were R7 600. Costs increase by 25%. New costs (R)?", answer: 9500, explanation: "7600 × 1.25 = R9,500" },
  { question: "Investor gives R11 400 for 19% ownership. Business makes R4 200 profit. How much does investor receive (R)?", answer: 798, explanation: "4200 × 0.19 = R798" },
  { question: "Revenue R19 200. Costs were R11 400. Costs increase by 12%. New profit (R)?", answer: 6636, explanation: "19200 - 12768 = R6,636" },
  { question: "Investor gives R38 000 for 40% ownership. Business makes R12 000 profit. How much does investor receive (R)?", answer: 4800, explanation: "12000 × 0.40 = R4,800" },
  { question: "Supplier costs were R9 400. Costs increase by 18%. New costs (R)?", answer: 11092, explanation: "9400 × 1.18 = R11,092" },
  { question: "Investor gives R15 300 for 27% ownership. Business makes R7 200 profit. How much does investor receive (R)?", answer: 1944, explanation: "7200 × 0.27 = R1,944" },
  { question: "Revenue R22 500. Costs were R14 200. Costs increase by 15%. New profit (R)?", answer: 6170, explanation: "22500 - 16330 = R6,170" },
  { question: "Investor gives R21 000 for 33% ownership. Business makes R5 400 profit. How much does investor receive (R)?", answer: 1782, explanation: "5400 × 0.33 = R1,782" },
  { question: "Supplier costs were R6 200. Costs increase by 20%. New costs (R)?", answer: 7440, explanation: "6200 × 1.20 = R7,440" },
  { question: "Investor gives R17 200 for 26% ownership. Business makes R9 000 profit. How much does investor receive (R)?", answer: 2340, explanation: "9000 × 0.26 = R2,340" },
  { question: "Revenue R26 800. Costs were R16 800. Costs increase by 10%. New profit (R)?", answer: 8320, explanation: "26800 - 18480 = R8,320" },
  { question: "Investor gives R12 600 for 18% ownership. Business makes R3 800 profit. How much does investor receive (R)?", answer: 684, explanation: "3800 × 0.18 = R684" },
  { question: "Supplier costs were R19 200. Costs increase by 8%. New costs (R)?", answer: 20736, explanation: "19200 × 1.08 = R20,736" }
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
