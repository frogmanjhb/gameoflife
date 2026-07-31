// Marketing Manager – Campaign Strategy Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface MarketingManagerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: MarketingManagerQuestion[] = [
  { question: "Youth Day stall: 62 samoosas at R15 each. Total revenue (R)?", answer: 930, explanation: "62 × 15 = R930" },
  { question: "Campaign revenue R7,850. Production costs R4,920. Profit (R)?", answer: 2930, explanation: "7850 − 4920 = R2,930" },
  { question: "School bake sale: 85 cupcakes at R22 each. Total revenue (R)?", answer: 1870, explanation: "85 × 22 = R1,870" },
  { question: "Revenue R10,200. Costs R6,450. Profit (R)?", answer: 3750, explanation: "10200 − 6450 = R3,750" },
  { question: "Spring festival: 44 branded caps at R72 each. Total revenue (R)?", answer: 3168, explanation: "44 × 72 = R3,168" },
  { question: "Revenue R8,300. Costs R5,100. Profit (R)?", answer: 3200, explanation: "8300 − 5100 = R3,200" },
  { question: "Town fair: 56 ceramic mugs at R68 each. Total revenue (R)?", answer: 3808, explanation: "56 × 68 = R3,808" },
  { question: "Revenue R12,400. Costs R7,800. Profit (R)?", answer: 4600, explanation: "12400 − 7800 = R4,600" },
  { question: "Sports day: 95 snack packs at R16 each. Total revenue (R)?", answer: 1520, explanation: "95 × 16 = R1,520" },
  { question: "Revenue R6,700. Costs R4,050. Profit (R)?", answer: 2650, explanation: "6700 − 4050 = R2,650" },
  { question: "Charity dinner: 40 meal tickets at R95 each. Total revenue (R)?", answer: 3800, explanation: "40 × 95 = R3,800" },
  { question: "Revenue R9,500. Costs R5,850. Profit (R)?", answer: 3650, explanation: "9500 − 5850 = R3,650" },
  { question: "Holiday market: 75 craft kits at R38 each. Total revenue (R)?", answer: 2850, explanation: "75 × 38 = R2,850" },
  { question: "Revenue R5,600. Costs R3,400. Profit (R)?", answer: 2200, explanation: "5600 − 3400 = R2,200" },
  { question: "Beach campaign: 63 sun visors at R52 each. Total revenue (R)?", answer: 3276, explanation: "63 × 52 = R3,276" },
  { question: "Revenue R15,600. Costs R9,750. Profit (R)?", answer: 5850, explanation: "15600 − 9750 = R5,850" },
  { question: "Winter promo: 32 gift boxes at R275 each. Total revenue (R)?", answer: 8800, explanation: "32 × 275 = R8,800" },
  { question: "Revenue R7,200. Costs R4,480. Profit (R)?", answer: 2720, explanation: "7200 − 4480 = R2,720" },
  { question: "School fête: 125 keyrings at R24 each. Total revenue (R)?", answer: 3000, explanation: "125 × 24 = R3,000" },
  { question: "Revenue R16,500. Costs R10,200. Profit (R)?", answer: 6300, explanation: "16500 − 10200 = R6,300" }
];

const mediumQuestions: MarketingManagerQuestion[] = [
  { question: "TikTok followers 280 last week, 364 this week. Percentage increase?", answer: 30, explanation: "(364−280)/280 × 100 = 30%" },
  { question: "Sneaker price R260. 20% launch discount. New price (R)?", answer: 208, explanation: "260 × 0.80 = R208" },
  { question: "Radio ad spend R3,200. Campaign generates R5,120 extra revenue. Profit (R)?", answer: 1920, explanation: "5120 − 3200 = R1,920" },
  { question: "WhatsApp sign-ups 160 → 208. Percentage increase?", answer: 30, explanation: "(208−160)/160 × 100 = 30%" },
  { question: "Product R180. 15% promo discount. New price (R)?", answer: 153, explanation: "180 × 0.85 = R153" },
  { question: "Flyer campaign R2,250. Revenue R3,600. Profit (R)?", answer: 1350, explanation: "3600 − 2250 = R1,350" },
  { question: "Store footfall 380 → 494. Percentage increase?", answer: 30, explanation: "(494−380)/380 × 100 = 30%" },
  { question: "Backpack R380. 25% student discount. New price (R)?", answer: 285, explanation: "380 × 0.75 = R285" },
  { question: "Social media ads R4,200. Campaign revenue R6,720. Profit (R)?", answer: 2520, explanation: "6720 − 4200 = R2,520" },
  { question: "Email list 520 → 650. Percentage increase?", answer: 25, explanation: "(650−520)/520 × 100 = 25%" },
  { question: "Cap R80. 10% weekend special. New price (R)?", answer: 72, explanation: "80 × 0.90 = R72" },
  { question: "Billboard spend R4,800. Revenue R7,680. Profit (R)?", answer: 2880, explanation: "7680 − 4800 = R2,880" },
  { question: "Online orders 320 → 416. Percentage increase?", answer: 30, explanation: "(416−320)/320 × 100 = 30%" },
  { question: "Jersey R450. 30% end-of-season sale. New price (R)?", answer: 315, explanation: "450 × 0.70 = R315" },
  { question: "Influencer fee R3,000. Campaign revenue R4,800. Profit (R)?", answer: 1800, explanation: "4800 − 3000 = R1,800" },
  { question: "App downloads 880 → 1,144. Percentage increase?", answer: 30, explanation: "(1144−880)/880 × 100 = 30%" },
  { question: "Sunscreen R120. 20% summer promo. New price (R)?", answer: 96, explanation: "120 × 0.80 = R96" },
  { question: "SMS campaign R1,600. Revenue R2,560. Profit (R)?", answer: 960, explanation: "2560 − 1600 = R960" },
  { question: "Newsletter subscribers 540 → 702. Percentage increase?", answer: 30, explanation: "(702−540)/540 × 100 = 30%" },
  { question: "Hoodie R300. 15% loyalty discount. New price (R)?", answer: 255, explanation: "300 × 0.85 = R255" }
];

const hardQuestions: MarketingManagerQuestion[] = [
  { question: "Ad cost R5,000. Revenue generated R8,500. ROI (%)? (ROI = Profit ÷ Cost × 100)", answer: 70, explanation: "Profit 3500; 3500/5000×100 = 70%" },
  { question: "Facebook ad reaches 1,400 people. 6% buy. Product R180. Total revenue (R)?", answer: 15120, explanation: "1400 × 0.06 × 180 = R15,120" },
  { question: "Cost R3,600. Revenue R6,480. ROI (%)?", answer: 80, explanation: "Profit 2880; 2880/3600×100 = 80%" },
  { question: "Reach 1,600. 5% convert. Price R150. Total revenue (R)?", answer: 12000, explanation: "1600 × 0.05 × 150 = R12,000" },
  { question: "Ad cost R6,000. Revenue R10,200. ROI (%)?", answer: 70, explanation: "Profit 4200; 4200/6000×100 = 70%" },
  { question: "Reach 800. 8% buy. Price R105. Revenue (R)?", answer: 6720, explanation: "800 × 0.08 × 105 = R6,720" },
  { question: "Cost R3,400. Revenue R5,780. ROI (%)?", answer: 70, explanation: "Profit 2380; 2380/3400×100 = 70%" },
  { question: "Reach 2,200. 4% buy. Price R225. Revenue (R)?", answer: 19800, explanation: "2200 × 0.04 × 225 = R19,800" },
  { question: "Ad R7,000. Revenue R11,900. ROI (%)?", answer: 70, explanation: "Profit 4900; 4900/7000×100 = 70%" },
  { question: "Reach 950. 7% convert. Price R140. Revenue (R)?", answer: 9310, explanation: "950 × 0.07 × 140 = R9,310" },
  { question: "Cost R4,200. Revenue R7,140. ROI (%)?", answer: 70, explanation: "Profit 2940; 2940/4200×100 = 70%" },
  { question: "Reach 1,700. 6% buy. Price R92. Revenue (R)?", answer: 9384, explanation: "1700 × 0.06 × 92 = R9,384" },
  { question: "Ad R8,500. Revenue R13,600. ROI (%)?", answer: 60, explanation: "Profit 5100; 5100/8500×100 = 60%" },
  { question: "Reach 800. 9% buy. Price R80. Revenue (R)?", answer: 5760, explanation: "800 × 0.09 × 80 = R5,760" },
  { question: "Cost R4,500. Revenue R7,650. ROI (%)?", answer: 70, explanation: "Profit 3150; 3150/4500×100 = 70%" },
  { question: "Reach 2,000. 5% convert. Price R172. Revenue (R)?", answer: 17200, explanation: "2000 × 0.05 × 172 = R17,200" },
  { question: "Ad R5,800. Revenue R9,860. ROI (%)?", answer: 70, explanation: "Profit 4060; 4060/5800×100 = 70%" },
  { question: "Reach 1,250. 6% buy. Price R148. Revenue (R)?", answer: 11100, explanation: "1250 × 0.06 × 148 = R11,100" },
  { question: "Cost R7,200. Revenue R12,240. ROI (%)?", answer: 70, explanation: "Profit 5040; 5040/7200×100 = 70%" },
  { question: "Reach 3,000. 3% buy. Price R280. Revenue (R)?", answer: 25200, explanation: "3000 × 0.03 × 280 = R25,200" }
];

const extremeQuestions: MarketingManagerQuestion[] = [
  { question: "Campaign A: Cost R4,000, Revenue R7,600. Campaign B: Cost R5,500, Revenue R9,350. Higher ROI (%)?", answer: 90, explanation: "A: 3600/4000=90%. B: 3850/5500=70%. Answer 90" },
  { question: "Budget R10,500. R2,100 per channel. Each channel: 90 customers, R38 profit each. How many channels? (max 5)", answer: 5, explanation: "5×2100=10,500; 5×90×38=R17,100 gross profit" },
  { question: "Campaign X: Cost R2,600, Revenue R4,940. Campaign Y: Cost R4,200, Revenue R7,140. Higher ROI (%)?", answer: 90, explanation: "X: 2340/2600=90%. Y: 2940/4200=70%. Answer 90" },
  { question: "Budget R14,400. R2,880 per platform. Each: 96 customers, R30 profit. How many platforms? (max 5)", answer: 5, explanation: "5×2880=14,400; 5×96×30=R14,400" },
  { question: "A: Cost R3,400, Revenue R6,460. B: Cost R6,000, Revenue R10,200. Higher ROI (%)?", answer: 90, explanation: "A: 3060/3400=90%. B: 4200/6000=70%. Answer 90" },
  { question: "Budget R8,250. R1,650 per campaign. Each: 66 sales at R20 profit. How many campaigns? (max 5)", answer: 5, explanation: "5×1650=8250; 5×66×20=R6,600 profit" },
  { question: "Campaign P: R4,500 cost, R8,100 revenue. Q: R6,500 cost, R11,050 revenue. Higher ROI (%)?", answer: 80, explanation: "P: 3600/4500=80%. Q: 4550/6500=70%. Answer 80" },
  { question: "Budget R11,500. R2,300 per channel. Each: 92 customers, R35 profit. How many channels? (max 5)", answer: 5, explanation: "5×2300=11,500; 5×92×35=R16,100" },
  { question: "M: Cost R4,000, Revenue R7,200. N: Cost R6,200, Revenue R10,540. Higher ROI (%)?", answer: 80, explanation: "M: 3200/4000=80%. N: 4340/6200=70%. Answer 80" },
  { question: "Budget R9,600. R1,920 per option. Each: 80 customers, R36 profit. How many options? (max 5)", answer: 5, explanation: "5×1920=9600; 5×80×36=R14,400" },
  { question: "Campaign A: R3,200 cost, R5,760 revenue. B: R5,000 cost, R8,500 revenue. Higher ROI (%)?", answer: 80, explanation: "A: 2560/3200=80%. B: 3500/5000=70%. Answer 80" },
  { question: "Budget R15,000. R5,000 per campaign. Each: 150 customers, R45 profit. How many campaigns? (max 3)", answer: 3, explanation: "3×5000=15,000; 3×150×45=R20,250" },
  { question: "X: Cost R3,000, Revenue R5,400. Y: Cost R4,800, Revenue R8,160. Higher ROI (%)?", answer: 80, explanation: "X: 2400/3000=80%. Y: 3360/4800=70%. Answer 80" },
  { question: "Budget R7,200. R1,440 per channel. Each: 72 customers, R22 profit. How many channels? (max 5)", answer: 5, explanation: "5×1440=7200; 5×72×22=R7,920" },
  { question: "Campaign C: R5,500 cost, R9,900 revenue. D: R8,000 cost, R13,600 revenue. Higher ROI (%)?", answer: 80, explanation: "C: 4400/5500=80%. D: 5600/8000=70%. Answer 80" },
  { question: "Budget R12,600. R2,520 per platform. Each: 126 customers, R38 profit. How many platforms? (max 5)", answer: 5, explanation: "5×2520=12,600; 5×126×38=R23,940" },
  { question: "E: Cost R4,800, Revenue R8,640. F: Cost R7,500, Revenue R12,750. Higher ROI (%)?", answer: 80, explanation: "E: 3840/4800=80%. F: 5250/7500=70%. Answer 80" },
  { question: "Budget R6,600. R1,320 per campaign. Each: 66 customers, R15 profit. How many campaigns? (max 5)", answer: 5, explanation: "5×1320=6600; 5×66×15=R4,950 profit" },
  { question: "G: Cost R3,900, Revenue R7,020. H: Cost R6,400, Revenue R10,880. Higher ROI (%)?", answer: 80, explanation: "G: 3120/3900=80%. H: 4480/6400=70%. Answer 80" },
  { question: "Budget R18,000. R4,500 per option. Each: 180 customers, R35 profit. How many options? (max 4)", answer: 4, explanation: "4×4500=18,000; 4×180×35=R25,200" }
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
