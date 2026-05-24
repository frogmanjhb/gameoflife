// Entrepreneur – Business Builder Challenge (Business Scenario) – client, same as server
// 20 questions per difficulty tier. All numeric answers. SA context (Rands).

export interface EntrepreneurQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: EntrepreneurQuestion[] = [
  { question: "You sell vetkoek for R6 each. Ingredients cost R2.50 each. You sell 80 at the school gate. Total profit (R)?", answer: 280, explanation: "(6 - 2.50) × 80 = R280" },
  { question: "Weekend market stall revenue R3 400. Table hire and stock cost R2 100. Profit (R)?", answer: 1300, explanation: "3400 - 2100 = R1,300" },
  { question: "Handmade bracelets: cost R18 each, sell R32 each. You sell 35. Total profit (R)?", answer: 490, explanation: "(32 - 18) × 35 = R490" },
  { question: "Tutoring revenue R4 800. Transport and worksheets cost R2 900. Profit (R)?", answer: 1900, explanation: "4800 - 2900 = R1,900" },
  { question: "Ice lollies: cost R4 each, sell R9 each. You sell 120 on a hot day. Total profit (R)?", answer: 600, explanation: "(9 - 4) × 120 = R600" },
  { question: "You earn R2 750 from a bake sale. Flour and sugar cost R1 480. Profit (R)?", answer: 1270, explanation: "2750 - 1480 = R1,270" },
  { question: "Phone covers: cost R22 each, sell R45 each. You sell 28. Total profit (R)?", answer: 644, explanation: "(45 - 22) × 28 = R644" },
  { question: "Revenue from a car wash R5 600. Soap and water cost R3 200. Profit (R)?", answer: 2400, explanation: "5600 - 3200 = R2,400" },
  { question: "Snack packs: cost R7 each, sell R15 each. You sell 90. Total profit (R)?", answer: 720, explanation: "(15 - 7) × 90 = R720" },
  { question: "You earn R6 200 from a craft fair. Materials and booth fee cost R4 050. Profit (R)?", answer: 2150, explanation: "6200 - 4050 = R2,150" },
  { question: "Custom T-shirts: cost R55 each, sell R95 each. You sell 18. Total profit (R)?", answer: 720, explanation: "(95 - 55) × 18 = R720" },
  { question: "Revenue R3 150. Packaging and ingredients cost R1 870. Profit (R)?", answer: 1280, explanation: "3150 - 1870 = R1,280" },
  { question: "Garden plants: cost R12 each, sell R28 each. You sell 55. Total profit (R)?", answer: 880, explanation: "(28 - 12) × 55 = R880" },
  { question: "You earn R1 950 from dog-walking. Treats and travel cost R780. Profit (R)?", answer: 1170, explanation: "1950 - 780 = R1,170" },
  { question: "Beaded keyrings: cost R9 each, sell R21 each. You sell 70. Total profit (R)?", answer: 840, explanation: "(21 - 9) × 70 = R840" },
  { question: "Revenue R7 400. Stock and rent cost R5 100. Profit (R)?", answer: 2300, explanation: "7400 - 5100 = R2,300" },
  { question: "Smoothies: cost R11 each, sell R25 each. You sell 48. Total profit (R)?", answer: 672, explanation: "(25 - 11) × 48 = R672" },
  { question: "You earn R4 500 from a pop-up shop. Display and stock cost R2 850. Profit (R)?", answer: 1650, explanation: "4500 - 2850 = R1,650" },
  { question: "Second-hand books: cost R15 each, sell R35 each. You sell 42. Total profit (R)?", answer: 840, explanation: "(35 - 15) × 42 = R840" },
  { question: "Revenue R3 600. Supplies and advertising cost R2 040. Profit (R)?", answer: 1560, explanation: "3600 - 2040 = R1,560" }
];

const mediumQuestions: EntrepreneurQuestion[] = [
  { question: "Startup cost = R6 500. Profit per vetkoek = R26. How many must you sell to break even?", answer: 250, explanation: "6500 ÷ 26 = 250 units" },
  { question: "Weekly profit = R650. How many weeks to recover R3 900 startup cost?", answer: 6, explanation: "3900 ÷ 650 = 6 weeks" },
  { question: "Startup cost = R9 600. Profit per bracelet = R48. How many units to break even?", answer: 200, explanation: "9600 ÷ 48 = 200 units" },
  { question: "Weekly profit = R720. How many weeks to recover R5 040 startup cost?", answer: 7, explanation: "5040 ÷ 720 = 7 weeks" },
  { question: "Startup cost = R4 500. Profit per ice lolly = R15. How many units to break even?", answer: 300, explanation: "4500 ÷ 15 = 300 units" },
  { question: "Weekly profit = R880. How many weeks to recover R5 280 startup cost?", answer: 6, explanation: "5280 ÷ 880 = 6 weeks" },
  { question: "Startup cost = R11 000. Profit per snack pack = R55. How many units to break even?", answer: 200, explanation: "11000 ÷ 55 = 200 units" },
  { question: "Weekly profit = R540. How many weeks to recover R4 320 startup cost?", answer: 8, explanation: "4320 ÷ 540 = 8 weeks" },
  { question: "Startup cost = R7 800. Profit per plant = R26. How many units to break even?", answer: 300, explanation: "7800 ÷ 26 = 300 units" },
  { question: "Weekly profit = R950. How many weeks to recover R5 700 startup cost?", answer: 6, explanation: "5700 ÷ 950 = 6 weeks" },
  { question: "Startup cost = R13 500. Profit per T-shirt = R54. How many units to break even?", answer: 250, explanation: "13500 ÷ 54 = 250 units" },
  { question: "Weekly profit = R1 100. How many weeks to recover R7 700 startup cost?", answer: 7, explanation: "7700 ÷ 1100 = 7 weeks" },
  { question: "Startup cost = R5 600. Profit per smoothie = R28. How many units to break even?", answer: 200, explanation: "5600 ÷ 28 = 200 units" },
  { question: "Weekly profit = R420. How many weeks to recover R2 520 startup cost?", answer: 6, explanation: "2520 ÷ 420 = 6 weeks" },
  { question: "Startup cost = R8 250. Profit per keyring = R33. How many units to break even?", answer: 250, explanation: "8250 ÷ 33 = 250 units" },
  { question: "Weekly profit = R780. How many weeks to recover R6 240 startup cost?", answer: 8, explanation: "6240 ÷ 780 = 8 weeks" },
  { question: "Startup cost = R3 600. Profit per book = R18. How many units to break even?", answer: 200, explanation: "3600 ÷ 18 = 200 units" },
  { question: "Weekly profit = R600. How many weeks to recover R3 600 startup cost?", answer: 6, explanation: "3600 ÷ 600 = 6 weeks" },
  { question: "Startup cost = R10 800. Profit per phone cover = R54. How many units to break even?", answer: 200, explanation: "10800 ÷ 54 = 200 units" },
  { question: "Weekly profit = R490. How many weeks to recover R3 920 startup cost?", answer: 8, explanation: "3920 ÷ 490 = 8 weeks" }
];

const hardQuestions: EntrepreneurQuestion[] = [
  { question: "Revenue last week = R11 500. This week increases by 20%. New revenue (R)?", answer: 13800, explanation: "11500 × 1.20 = R13,800" },
  { question: "Profit = R2 760. Revenue = R11 040. What is profit margin (%)?", answer: 25, explanation: "2760 ÷ 11040 × 100 = 25%" },
  { question: "Revenue last week = R9 200. This week increases by 15%. New revenue (R)?", answer: 10580, explanation: "9200 × 1.15 = R10,580" },
  { question: "Profit = R1 890. Revenue = R9 450. Profit margin (%)?", answer: 20, explanation: "1890 ÷ 9450 × 100 = 20%" },
  { question: "Revenue last week = R16 800. This week increases by 25%. New revenue (R)?", answer: 21000, explanation: "16800 × 1.25 = R21,000" },
  { question: "Profit = R2 100. Revenue = R8 400. Profit margin (%)?", answer: 25, explanation: "2100 ÷ 8400 × 100 = 25%" },
  { question: "Revenue last week = R7 500. This week increases by 30%. New revenue (R)?", answer: 9750, explanation: "7500 × 1.30 = R9,750" },
  { question: "Profit = R3 900. Revenue = R13 000. Profit margin (%)?", answer: 30, explanation: "3900 ÷ 13000 × 100 = 30%" },
  { question: "Revenue last week = R13 750. This week increases by 10%. New revenue (R)?", answer: 15125, explanation: "13750 × 1.10 = R15,125" },
  { question: "Profit = R1 440. Revenue = R7 200. Profit margin (%)?", answer: 20, explanation: "1440 ÷ 7200 × 100 = 20%" },
  { question: "Revenue last week = R22 500. This week increases by 18%. New revenue (R)?", answer: 26550, explanation: "22500 × 1.18 = R26,550" },
  { question: "Profit = R3 300. Revenue = R13 200. Profit margin (%)?", answer: 25, explanation: "3300 ÷ 13200 × 100 = 25%" },
  { question: "Revenue last week = R8 400. This week increases by 12%. New revenue (R)?", answer: 9408, explanation: "8400 × 1.12 = R9,408" },
  { question: "Profit = R2 520. Revenue = R10 080. Profit margin (%)?", answer: 25, explanation: "2520 ÷ 10080 × 100 = 25%" },
  { question: "Revenue last week = R10 250. This week increases by 22%. New revenue (R)?", answer: 12505, explanation: "10250 × 1.22 = R12,505" },
  { question: "Profit = R1 680. Revenue = R8 400. Profit margin (%)?", answer: 20, explanation: "1680 ÷ 8400 × 100 = 20%" },
  { question: "Revenue last week = R12 600. This week increases by 8%. New revenue (R)?", answer: 13608, explanation: "12600 × 1.08 = R13,608" },
  { question: "Profit = R4 200. Revenue = R16 800. Profit margin (%)?", answer: 25, explanation: "4200 ÷ 16800 × 100 = 25%" },
  { question: "Revenue last week = R15 500. This week increases by 16%. New revenue (R)?", answer: 17980, explanation: "15500 × 1.16 = R17,980" },
  { question: "Profit = R1 350. Revenue = R6 750. Profit margin (%)?", answer: 20, explanation: "1350 ÷ 6750 × 100 = 20%" }
];

const extremeQuestions: EntrepreneurQuestion[] = [
  { question: "Investor gives R12 000 for 20% ownership. Business makes R5 500 profit. How much does investor receive (R)?", answer: 1100, explanation: "5500 × 0.20 = R1,100" },
  { question: "Supplier costs were R9 500. Costs increase by 16%. New costs (R)?", answer: 11020, explanation: "9500 × 1.16 = R11,020" },
  { question: "Investor gives R22 000 for 25% ownership. Business makes R7 200 profit. How much does investor receive (R)?", answer: 1800, explanation: "7200 × 0.25 = R1,800" },
  { question: "Supplier costs were R14 000. Costs increase by 22%. New costs (R)?", answer: 17080, explanation: "14000 × 1.22 = R17,080" },
  { question: "Investor gives R16 500 for 15% ownership. Business makes R6 000 profit. How much does investor receive (R)?", answer: 900, explanation: "6000 × 0.15 = R900" },
  { question: "Revenue R12 500. Costs were R7 500 and increase by 10%. New profit (R)?", answer: 4250, explanation: "12500 - 8250 = R4,250" },
  { question: "Investor gives R28 000 for 35% ownership. Business makes R9 600 profit. How much does investor receive (R)?", answer: 3360, explanation: "9600 × 0.35 = R3,360" },
  { question: "Supplier costs were R6 800. Costs increase by 25%. New costs (R)?", answer: 8500, explanation: "6800 × 1.25 = R8,500" },
  { question: "Investor gives R9 500 for 19% ownership. Business makes R3 500 profit. How much does investor receive (R)?", answer: 665, explanation: "3500 × 0.19 = R665" },
  { question: "Revenue R17 800. Costs were R10 600. Costs increase by 12%. New profit (R)?", answer: 6128, explanation: "17800 - 11872 = R6,128" },
  { question: "Investor gives R35 000 for 40% ownership. Business makes R11 250 profit. How much does investor receive (R)?", answer: 4500, explanation: "11250 × 0.40 = R4,500" },
  { question: "Supplier costs were R8 200. Costs increase by 18%. New costs (R)?", answer: 9676, explanation: "8200 × 1.18 = R9,676" },
  { question: "Investor gives R13 500 for 27% ownership. Business makes R6 400 profit. How much does investor receive (R)?", answer: 1728, explanation: "6400 × 0.27 = R1,728" },
  { question: "Revenue R20 400. Costs were R12 800. Costs increase by 15%. New profit (R)?", answer: 5480, explanation: "20400 - 14720 = R5,480" },
  { question: "Investor gives R19 800 for 33% ownership. Business makes R4 800 profit. How much does investor receive (R)?", answer: 1584, explanation: "4800 × 0.33 = R1,584" },
  { question: "Supplier costs were R5 400. Costs increase by 20%. New costs (R)?", answer: 6480, explanation: "5400 × 1.20 = R6,480" },
  { question: "Investor gives R15 600 for 26% ownership. Business makes R8 200 profit. How much does investor receive (R)?", answer: 2132, explanation: "8200 × 0.26 = R2,132" },
  { question: "Revenue R24 600. Costs were R15 400. Costs increase by 10%. New profit (R)?", answer: 7660, explanation: "24600 - 16940 = R7,660" },
  { question: "Investor gives R10 800 for 18% ownership. Business makes R3 200 profit. How much does investor receive (R)?", answer: 576, explanation: "3200 × 0.18 = R576" },
  { question: "Supplier costs were R17 500. Costs increase by 8%. New costs (R)?", answer: 18900, explanation: "17500 × 1.08 = R18,900" }
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
