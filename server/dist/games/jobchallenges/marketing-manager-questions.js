"use strict";
// Marketing Manager – Campaign Strategy Challenge
// 20 questions per difficulty tier. All numeric answers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extremeQuestions = exports.hardQuestions = exports.mediumQuestions = exports.easyQuestions = void 0;
exports.getMarketingManagerQuestion = getMarketingManagerQuestion;
// EASY – Sales & Revenue Basics (revenue, profit, unit price × quantity)
exports.easyQuestions = [
    { question: "Heritage Day promo: 55 boerewors rolls at R35 each. Total revenue (R)?", answer: 1925, explanation: "55 × 35 = R1,925" },
    { question: "Campaign revenue R6,800. Production costs R4,150. Profit (R)?", answer: 2650, explanation: "6,800 − 4,150 = R2,650" },
    { question: "Township bakery sells 48 vetkoek at R12 each. Total revenue (R)?", answer: 576, explanation: "48 × 12 = R576" },
    { question: "Revenue R9,600. Costs R5,900. Profit (R)?", answer: 3700, explanation: "9,600 − 5,900 = R3,700" },
    { question: "72 festival wristbands at R65 each. Total revenue (R)?", answer: 4680, explanation: "72 × 65 = R4,680" },
    { question: "Revenue R7,400. Costs R4,600. Profit (R)?", answer: 2800, explanation: "7,400 − 4,600 = R2,800" },
    { question: "38 branded T-shirts at R95 each. Total revenue (R)?", answer: 3610, explanation: "38 × 95 = R3,610" },
    { question: "Revenue R11,500. Costs R7,200. Profit (R)?", answer: 4300, explanation: "11,500 − 7,200 = R4,300" },
    { question: "120 energy drinks at R18 each. Total revenue (R)?", answer: 2160, explanation: "120 × 18 = R2,160" },
    { question: "Revenue R5,250. Costs R3,100. Profit (R)?", answer: 2150, explanation: "5,250 − 3,100 = R2,150" },
    { question: "65 meal vouchers at R85 each. Total revenue (R)?", answer: 5525, explanation: "65 × 85 = R5,525" },
    { question: "Revenue R8,900. Costs R5,450. Profit (R)?", answer: 3450, explanation: "8,900 − 5,450 = R3,450" },
    { question: "90 school stationery packs at R42 each. Total revenue (R)?", answer: 3780, explanation: "90 × 42 = R3,780" },
    { question: "Revenue R4,200. Costs R2,650. Profit (R)?", answer: 1550, explanation: "4,200 − 2,650 = R1,550" },
    { question: "52 sun hats at R58 each for a beach campaign. Total revenue (R)?", answer: 3016, explanation: "52 × 58 = R3,016" },
    { question: "Revenue R13,200. Costs R8,100. Profit (R)?", answer: 5100, explanation: "13,200 − 8,100 = R5,100" },
    { question: "28 premium gift hampers at R320 each. Total revenue (R)?", answer: 8960, explanation: "28 × 320 = R8,960" },
    { question: "Revenue R6,150. Costs R3,780. Profit (R)?", answer: 2370, explanation: "6,150 − 3,780 = R2,370" },
    { question: "110 reusable water bottles at R28 each. Total revenue (R)?", answer: 3080, explanation: "110 × 28 = R3,080" },
    { question: "Revenue R14,800. Costs R9,200. Profit (R)?", answer: 5600, explanation: "14,800 − 9,200 = R5,600" }
];
// MEDIUM – Percentage & Growth (% increase, discount, basic ROI)
exports.mediumQuestions = [
    { question: "Instagram followers 340 last week, 442 this week. Percentage increase?", answer: 30, explanation: "(442−340)/340 × 100 = 30%" },
    { question: "Sneaker price R240. 25% Heritage Day discount. New price (R)?", answer: 180, explanation: "240 × 0.75 = R180" },
    { question: "Radio ad spend R2,800. Campaign generates R4,200 extra revenue. Profit (R)?", answer: 1400, explanation: "4,200 − 2,800 = R1,400" },
    { question: "WhatsApp sign-ups 140 → 182. Percentage increase?", answer: 30, explanation: "(182−140)/140 × 100 = 30%" },
    { question: "Product R160. 15% launch discount. New price (R)?", answer: 136, explanation: "160 × 0.85 = R136" },
    { question: "Flyer campaign R1,950. Revenue R3,120. Profit (R)?", answer: 1170, explanation: "3,120 − 1,950 = R1,170" },
    { question: "Store footfall 420 → 546. Percentage increase?", answer: 30, explanation: "(546−420)/420 × 100 = 30%" },
    { question: "Backpack R350. 20% student discount. New price (R)?", answer: 280, explanation: "350 × 0.80 = R280" },
    { question: "Social media ads R3,500. Campaign revenue R5,600. Profit (R)?", answer: 2100, explanation: "5,600 − 3,500 = R2,100" },
    { question: "Email list 600 → 750. Percentage increase?", answer: 25, explanation: "(750−600)/600 × 100 = 25%" },
    { question: "Cap R75. 10% weekend special. New price (R)?", answer: 67.5, explanation: "75 × 0.90 = R67.50" },
    { question: "Billboard spend R4,200. Revenue R6,720. Profit (R)?", answer: 2520, explanation: "6,720 − 4,200 = R2,520" },
    { question: "Online orders 280 → 364. Percentage increase?", answer: 30, explanation: "(364−280)/280 × 100 = 30%" },
    { question: "Jersey R420. 30% end-of-season sale. New price (R)?", answer: 294, explanation: "420 × 0.70 = R294" },
    { question: "Influencer fee R2,600. Campaign revenue R4,160. Profit (R)?", answer: 1560, explanation: "4,160 − 2,600 = R1,560" },
    { question: "App downloads 950 → 1,235. Percentage increase?", answer: 30, explanation: "(1,235−950)/950 × 100 = 30%" },
    { question: "Sunscreen R110. 20% summer promo. New price (R)?", answer: 88, explanation: "110 × 0.80 = R88" },
    { question: "SMS campaign R1,400. Revenue R2,240. Profit (R)?", answer: 840, explanation: "2,240 − 1,400 = R840" },
    { question: "Newsletter subscribers 480 → 624. Percentage increase?", answer: 30, explanation: "(624−480)/480 × 100 = 30%" },
    { question: "Hoodie R280. 15% loyalty discount. New price (R)?", answer: 238, explanation: "280 × 0.85 = R238" }
];
// HARD – ROI, cost per acquisition, margin (ROI = Profit ÷ Cost × 100)
exports.hardQuestions = [
    { question: "Ad cost R4,500. Revenue generated R7,650. ROI (%)? (ROI = Profit ÷ Cost × 100)", answer: 70, explanation: "Profit 3,150; 3,150/4,500×100 = 70%" },
    { question: "Facebook ad reaches 1,200 people. 6% buy. Product R175. Total revenue (R)?", answer: 12600, explanation: "1,200 × 0.06 × 175 = R12,600" },
    { question: "Cost R3,200. Revenue R5,760. ROI (%)?", answer: 80, explanation: "Profit 2,560; 2,560/3,200×100 = 80%" },
    { question: "Reach 1,800. 5% convert. Price R140. Total revenue (R)?", answer: 12600, explanation: "1,800 × 0.05 × 140 = R12,600" },
    { question: "Ad cost R5,500. Revenue R9,350. ROI (%)?", answer: 70, explanation: "Profit 3,850; 3,850/5,500×100 = 70%" },
    { question: "Reach 750. 8% buy. Price R95. Revenue (R)?", answer: 5700, explanation: "750 × 0.08 × 95 = R5,700" },
    { question: "Cost R2,800. Revenue R4,760. ROI (%)?", answer: 70, explanation: "Profit 1,960; 1,960/2,800×100 = 70%" },
    { question: "Reach 2,400. 4% buy. Price R210. Revenue (R)?", answer: 20160, explanation: "2,400 × 0.04 × 210 = R20,160" },
    { question: "Ad R6,200. Revenue R10,540. ROI (%)?", answer: 70, explanation: "Profit 4,340; 4,340/6,200×100 = 70%" },
    { question: "Reach 900. 7% convert. Price R130. Revenue (R)?", answer: 8190, explanation: "900 × 0.07 × 130 = R8,190" },
    { question: "Cost R3,600. Revenue R6,120. ROI (%)?", answer: 70, explanation: "Profit 2,520; 2,520/3,600×100 = 70%" },
    { question: "Reach 1,500. 6% buy. Price R88. Revenue (R)?", answer: 7920, explanation: "1,500 × 0.06 × 88 = R7,920" },
    { question: "Ad R7,800. Revenue R12,480. ROI (%)?", answer: 60, explanation: "Profit 4,680; 4,680/7,800×100 = 60%" },
    { question: "Reach 650. 9% buy. Price R72. Revenue (R)?", answer: 4212, explanation: "650 × 0.09 × 72 = R4,212" },
    { question: "Cost R4,000. Revenue R6,800. ROI (%)?", answer: 70, explanation: "Profit 2,800; 2,800/4,000×100 = 70%" },
    { question: "Reach 2,100. 5% convert. Price R165. Revenue (R)?", answer: 17325, explanation: "2,100 × 0.05 × 165 = R17,325" },
    { question: "Ad R5,000. Revenue R8,500. ROI (%)?", answer: 70, explanation: "Profit 3,500; 3,500/5,000×100 = 70%" },
    { question: "Reach 1,100. 6% buy. Price R155. Revenue (R)?", answer: 10230, explanation: "1,100 × 0.06 × 155 = R10,230" },
    { question: "Cost R6,400. Revenue R10,880. ROI (%)?", answer: 70, explanation: "Profit 4,480; 4,480/6,400×100 = 70%" },
    { question: "Reach 3,200. 3% buy. Price R250. Revenue (R)?", answer: 24000, explanation: "3,200 × 0.03 × 250 = R24,000" }
];
// EXTREME – Strategy & Optimisation (comparing campaigns, multi-step)
exports.extremeQuestions = [
    { question: "Campaign A: Cost R3,500, Revenue R6,650. Campaign B: Cost R5,000, Revenue R8,500. Higher ROI (%)?", answer: 90, explanation: "A: 3,150/3,500=90%. B: 3,500/5,000=70%. Answer 90" },
    { question: "Budget R9,000. R1,800 per channel. Each channel: 85 customers, R35 profit each. How many channels? (max 5)", answer: 5, explanation: "5×1,800=9,000; 5×85×35=R14,875 gross profit" },
    { question: "Campaign X: Cost R2,400, Revenue R4,560. Campaign Y: Cost R4,000, Revenue R6,800. Higher ROI (%)?", answer: 90, explanation: "X: 2,160/2,400=90%. Y: 2,800/4,000=70%. Answer 90" },
    { question: "Budget R12,000. R2,400 per platform. Each: 120 customers, R28 profit. How many platforms? (max 5)", answer: 5, explanation: "5×2,400=12,000; 5×120×28=R16,800" },
    { question: "A: Cost R3,000, Revenue R5,700. B: Cost R5,500, Revenue R9,350. Higher ROI (%)?", answer: 90, explanation: "A: 2,700/3,000=90%. B: 3,850/5,500=70%. Answer 90" },
    { question: "Budget R7,500. R1,500 per campaign. Each: 75 sales at R22 profit. How many campaigns? (max 5)", answer: 5, explanation: "5×1,500=7,500; 5×75×22=R8,250 profit" },
    { question: "Campaign P: R4,200 cost, R7,560 revenue. Q: R6,000 cost, R10,200 revenue. Higher ROI (%)?", answer: 80, explanation: "P: 3,360/4,200=80%. Q: 4,200/6,000=70%. Answer 80" },
    { question: "Budget R10,000. R2,000 per channel. Each: 100 customers, R32 profit. How many channels? (max 5)", answer: 5, explanation: "5×2,000=10,000; 5×100×32=R16,000" },
    { question: "M: Cost R3,800, Revenue R6,840. N: Cost R5,700, Revenue R9,690. Higher ROI (%)?", answer: 80, explanation: "M: 3,040/3,800=80%. N: 3,990/5,700=70%. Answer 80" },
    { question: "Budget R8,400. R1,680 per option. Each: 84 customers, R38 profit. How many options? (max 5)", answer: 5, explanation: "5×1,680=8,400; 5×84×38=R15,960" },
    { question: "Campaign A: R2,800 cost, R5,040 revenue. B: R4,500 cost, R7,650 revenue. Higher ROI (%)?", answer: 80, explanation: "A: 2,240/2,800=80%. B: 3,150/4,500=70%. Answer 80" },
    { question: "Budget R13,500. R4,500 per campaign. Each: 135 customers, R42 profit. How many campaigns? (max 3)", answer: 3, explanation: "3×4,500=13,500; 3×135×42=R17,010" },
    { question: "X: Cost R2,600, Revenue R4,680. Y: Cost R4,000, Revenue R6,800. Higher ROI (%)?", answer: 80, explanation: "X: 2,080/2,600=80%. Y: 2,800/4,000=70%. Answer 80" },
    { question: "Budget R6,000. R1,200 per channel. Each: 60 customers, R25 profit. How many channels? (max 5)", answer: 5, explanation: "5×1,200=6,000; 5×60×25=R7,500" },
    { question: "Campaign C: R5,000 cost, R9,000 revenue. D: R7,500 cost, R12,750 revenue. Higher ROI (%)?", answer: 80, explanation: "C: 4,000/5,000=80%. D: 5,250/7,500=70%. Answer 80" },
    { question: "Budget R11,000. R2,200 per platform. Each: 110 customers, R40 profit. How many platforms? (max 5)", answer: 5, explanation: "5×2,200=11,000; 5×110×40=R22,000" },
    { question: "E: Cost R4,400, Revenue R7,920. F: Cost R7,000, Revenue R11,900. Higher ROI (%)?", answer: 80, explanation: "E: 3,520/4,400=80%. F: 4,900/7,000=70%. Answer 80" },
    { question: "Budget R5,500. R1,100 per campaign. Each: 55 customers, R18 profit. How many campaigns? (max 5)", answer: 5, explanation: "5×1,100=5,500; 5×55×18=R4,950 profit" },
    { question: "G: Cost R3,600, Revenue R6,480. H: Cost R6,000, Revenue R10,200. Higher ROI (%)?", answer: 80, explanation: "G: 2,880/3,600=80%. H: 4,200/6,000=70%. Answer 80" },
    { question: "Budget R16,000. R4,000 per option. Each: 160 customers, R30 profit. How many options? (max 4)", answer: 4, explanation: "4×4,000=16,000; 4×160×30=R19,200" }
];
function getMarketingManagerQuestion(difficulty) {
    let questions;
    switch (difficulty) {
        case 'easy':
            questions = exports.easyQuestions;
            break;
        case 'medium':
            questions = exports.mediumQuestions;
            break;
        case 'hard':
            questions = exports.hardQuestions;
            break;
        case 'extreme':
            questions = exports.extremeQuestions;
            break;
    }
    return questions[Math.floor(Math.random() * questions.length)];
}
//# sourceMappingURL=marketing-manager-questions.js.map