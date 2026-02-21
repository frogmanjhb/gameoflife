// Journalist – Data & Reporting Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface JournalistQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: JournalistQuestion[] = [
  { question: "Town collected R10,000 in tax Monday and R8,000 Tuesday. What is the total (R)?", answer: 18000, explanation: "10,000 + 8,000 = R18,000" },
  { question: "5 students earned: 800, 900, 700, 1,000, 600. What is the average?", answer: 800, explanation: "(800+900+700+1000+600)/5 = 800" },
  { question: "Shop revenue: R12,000 Monday, R9,500 Tuesday. Total (R)?", answer: 21500, explanation: "12,000 + 9,500 = R21,500" },
  { question: "4 weeks of sales: 2,000, 2,400, 1,800, 2,200. Average per week?", answer: 2100, explanation: "(2000+2400+1800+2200)/4 = 2,100" },
  { question: "Tax collected: R5,000 + R6,000 + R4,500. Total (R)?", answer: 15500, explanation: "5,000 + 6,000 + 4,500 = R15,500" },
  { question: "6 residents earned: 1,200, 1,500, 1,100, 1,400, 1,300, 1,600. Average?", answer: 1350, explanation: "Sum 8,100 ÷ 6 = 1,350" },
  { question: "Income R15,000. Expenses R9,000. Difference (R)?", answer: 6000, explanation: "15,000 − 9,000 = R6,000" },
  { question: "Three days revenue: R3,000, R3,500, R2,500. Total (R)?", answer: 9000, explanation: "3,000 + 3,500 + 2,500 = R9,000" },
  { question: "Scores: 70, 80, 90, 85, 75. Average?", answer: 80, explanation: "(70+80+90+85+75)/5 = 80" },
  { question: "Town spent R20,000 and received R28,000. Net (R)?", answer: 8000, explanation: "28,000 − 20,000 = R8,000" },
  { question: "Donations: R1,000, R1,500, R2,000. Total (R)?", answer: 4500, explanation: "1,000 + 1,500 + 2,000 = R4,500" },
  { question: "4 values: 100, 120, 80, 100. Average?", answer: 100, explanation: "400 ÷ 4 = 100" },
  { question: "Revenue R7,000. Costs R4,200. Profit (R)?", answer: 2800, explanation: "7,000 − 4,200 = R2,800" },
  { question: "Five months: 5,000, 5,500, 4,800, 5,200, 5,500. Average?", answer: 5200, explanation: "26,000 ÷ 5 = 5,200" },
  { question: "Monday R6,000, Tuesday R7,200. Total (R)?", answer: 13200, explanation: "6,000 + 7,200 = R13,200" },
  { question: "Budget R30,000. Spent R18,000. Remaining (R)?", answer: 12000, explanation: "30,000 − 18,000 = R12,000" },
  { question: "Three readings: 50, 60, 70. Average?", answer: 60, explanation: "180 ÷ 3 = 60" },
  { question: "Income R11,000 and R13,000. Total (R)?", answer: 24000, explanation: "11,000 + 13,000 = R24,000" },
  { question: "Expenses R8,000. Income R14,000. Surplus (R)?", answer: 6000, explanation: "14,000 − 8,000 = R6,000" },
  { question: "6 items: 200, 250, 200, 300, 250, 200. Average?", answer: 233.33, explanation: "1,400 ÷ 6 ≈ 233.33" }
];

const mediumQuestions: JournalistQuestion[] = [
  { question: "Last week: 200 residents. This week: 250. What is the percentage increase?", answer: 25, explanation: "(250−200)/200 × 100 = 25%" },
  { question: "Land prices dropped from R5,000 to R4,000. What percentage decrease?", answer: 20, explanation: "(5000−4000)/5000 × 100 = 20%" },
  { question: "Sales 300 last month, 360 this month. Percentage increase?", answer: 20, explanation: "(360−300)/300 × 100 = 20%" },
  { question: "Price was R80, now R64. Percentage decrease?", answer: 20, explanation: "(80−64)/80 × 100 = 20%" },
  { question: "Population 400 → 500. Percentage increase?", answer: 25, explanation: "(500−400)/400 × 100 = 25%" },
  { question: "Revenue R10,000 → R12,000. Percentage increase?", answer: 20, explanation: "(12000−10000)/10000 × 100 = 20%" },
  { question: "Value R120 dropped to R90. Percentage decrease?", answer: 25, explanation: "(120−90)/120 × 100 = 25%" },
  { question: "Customers 150 → 195. Percentage increase?", answer: 30, explanation: "(195−150)/150 × 100 = 30%" },
  { question: "Cost R200 → R150. Percentage decrease?", answer: 25, explanation: "(200−150)/200 × 100 = 25%" },
  { question: "Visitors 80 → 100. Percentage increase?", answer: 25, explanation: "(100−80)/80 × 100 = 25%" },
  { question: "Income R6,000 → R7,500. Percentage increase?", answer: 25, explanation: "(7500−6000)/6000 × 100 = 25%" },
  { question: "Price R50 → R40. Percentage decrease?", answer: 20, explanation: "(50−40)/50 × 100 = 20%" },
  { question: "Members 120 → 150. Percentage increase?", answer: 25, explanation: "(150−120)/120 × 100 = 25%" },
  { question: "Revenue R8,000 → R6,400. Percentage decrease?", answer: 20, explanation: "(8000−6400)/8000 × 100 = 20%" },
  { question: "Attendance 250 → 325. Percentage increase?", answer: 30, explanation: "(325−250)/250 × 100 = 30%" },
  { question: "Fee R100 → R75. Percentage decrease?", answer: 25, explanation: "(100−75)/100 × 100 = 25%" },
  { question: "Sales 500 → 650. Percentage increase?", answer: 30, explanation: "(650−500)/500 × 100 = 30%" },
  { question: "Budget R4,000 → R3,200. Percentage decrease?", answer: 20, explanation: "(4000−3200)/4000 × 100 = 20%" },
  { question: "Enrolment 200 → 260. Percentage increase?", answer: 30, explanation: "(260−200)/200 × 100 = 30%" },
  { question: "Value R300 → R240. Percentage decrease?", answer: 20, explanation: "(300−240)/300 × 100 = 20%" }
];

const hardQuestions: JournalistQuestion[] = [
  { question: "Town income: Week 1 R15,000, Week 2 R17,000, Week 3 R14,000, Week 4 R19,000. What is the percentage growth in the week with the highest growth from the previous week? (One decimal)", answer: 35.7, explanation: "Week 4: (19000−14000)/14000 = 35.7%" },
  { question: "Expenses rise 10% each month starting at R5,000. What is month 2 expense (R)?", answer: 5500, explanation: "5,000 × 1.10 = R5,500" },
  { question: "Week 1: R10,000, Week 2: R12,000, Week 3: R11,000, Week 4: R13,200. Highest week-on-week growth (%)?", answer: 20, explanation: "Week 2 and Week 4 both 20%" },
  { question: "Revenue starts at R4,000 and grows 15% per month. Month 2 revenue (R)?", answer: 4600, explanation: "4,000 × 1.15 = R4,600" },
  { question: "Sales: Mon 100, Tue 120, Wed 110, Thu 132. Which day had 20% growth from previous? Answer with that day's sales.", answer: 132, explanation: "Thu: (132−110)/110 = 20%" },
  { question: "Budget R2,000. Increases 25% next period. New budget (R)?", answer: 2500, explanation: "2,000 × 1.25 = R2,500" },
  { question: "Quarter 1: R20,000, Q2: R22,000, Q3: R19,800, Q4: R24,200. Highest quarter-on-quarter growth (%)?", answer: 22.2, explanation: "Q4: (24200−19800)/19800 ≈ 22.2%" },
  { question: "Starting salary R3,000. 10% raise. New salary (R)?", answer: 3300, explanation: "3,000 × 1.10 = R3,300" },
  { question: "Income: Jan 8,000, Feb 9,600, Mar 8,640, Apr 10,368. Highest month-on-month growth (%)?", answer: 20, explanation: "Feb: (9600−8000)/8000 = 20%" },
  { question: "Costs R6,000. Next month +15%. Month 2 costs (R)?", answer: 6900, explanation: "6,000 × 1.15 = R6,900" },
  { question: "Readings: 50, 55, 60, 66. Largest percentage increase from previous?", answer: 10, explanation: "50→55 and 60→66 both 10%" },
  { question: "Revenue R7,000. Grows 20%. New value (R)?", answer: 8400, explanation: "7,000 × 1.20 = R8,400" },
  { question: "Q1: 12,000, Q2: 13,200, Q3: 12,100, Q4: 14,520. Highest quarter growth (%)?", answer: 20, explanation: "Q4: (14520−12100)/12100 = 20%" },
  { question: "Start R1,000. +30% next period. New amount (R)?", answer: 1300, explanation: "1,000 × 1.30 = R1,300" },
  { question: "Month 1: 5,000, Month 2: 5,500, Month 3: 5,000, Month 4: 6,000. Highest month-on-month % growth?", answer: 20, explanation: "Month 4: (6000−5000)/5000 = 20%" },
  { question: "Base R9,000. Increase 10%. New value (R)?", answer: 9900, explanation: "9,000 × 1.10 = R9,900" },
  { question: "Values: A 100→120, B 80→100, C 150→165. Which change equals 25%? Answer that percentage.", answer: 25, explanation: "B: (100−80)/80 = 25%" },
  { question: "Expenses R4,000. +25% next month. Month 2 (R)?", answer: 5000, explanation: "4,000 × 1.25 = R5,000" },
  { question: "Week 1: 8,000, Week 2: 9,600, Week 3: 8,000, Week 4: 10,000. Highest week-on-week growth (%)?", answer: 25, explanation: "Week 4: (10000−8000)/8000 = 25%" },
  { question: "Starting R2,500. 20% increase. New value (R)?", answer: 3000, explanation: "2,500 × 1.20 = R3,000" }
];

const extremeQuestions: JournalistQuestion[] = [
  { question: "Town claims tax revenue increased 20%. Last month R10,000, this month R11,500. What was the actual percentage increase?", answer: 15, explanation: "(11500−10000)/10000 = 15%. Claim was 20%, so not accurate." },
  { question: "Business A: Revenue R20,000, Profit R5,000. Business B: Revenue R15,000, Profit R6,000. Which is more profitable by percentage? Answer the higher profit margin (%).", answer: 40, explanation: "A: 25%. B: 6000/15000=40%. Answer 40" },
  { question: "Claim: sales up 25%. Last month 400, this month 480. Actual percentage increase?", answer: 20, explanation: "(480−400)/400 = 20%. Claim 25% is wrong." },
  { question: "Company X: Revenue R30,000, Profit R7,500. Company Y: Revenue R25,000, Profit R8,000. Higher profit margin (%)?", answer: 32, explanation: "X: 25%. Y: 8000/25000 = 32%. Answer 32" },
  { question: "Mayor says spending fell 15%. Was R8,000, now R7,200. Actual percentage change?", answer: 10, explanation: "(8000−7200)/8000 = 10% decrease. Claim 15% is wrong." },
  { question: "Shop A: R40,000 revenue, R12,000 profit. Shop B: R50,000 revenue, R15,000 profit. Which has higher profit %? Answer that percentage.", answer: 30, explanation: "A: 30%. B: 30%. Both 30%." },
  { question: "Report claims 30% growth. Before: 200, after: 250. Actual growth (%)?", answer: 25, explanation: "(250−200)/200 = 25%. Claim 30% inaccurate." },
  { question: "Firm P: R60,000 revenue, R18,000 profit. Firm Q: R45,000 revenue, R13,500 profit. Higher profit margin (%)?", answer: 30, explanation: "P: 30%. Q: 30%. Answer 30" },
  { question: "Council claims 10% cut. Budget was R12,000, now R10,800. Actual percentage decrease?", answer: 10, explanation: "(12000−10800)/12000 = 10%. Claim accurate." },
  { question: "Store A: R20,000 sales, R4,000 profit. Store B: R15,000 sales, R4,500 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 20%. B: 4500/15000 = 30%. Answer 30" },
  { question: "Headline: 50% increase. Old 100, new 140. Actual increase (%)?", answer: 40, explanation: "(140−100)/100 = 40%. Claim wrong." },
  { question: "Business M: R80,000 revenue, R20,000 profit. Business N: R70,000 revenue, R21,000 profit. Higher margin (%)?", answer: 30, explanation: "M: 25%. N: 21000/70000 = 30%. Answer 30" },
  { question: "Announcement: 15% rise. Was R6,000, now R6,900. Actual percentage increase?", answer: 15, explanation: "(6900−6000)/6000 = 15%. Claim accurate." },
  { question: "Vendor A: R10,000 revenue, R2,500 profit. Vendor B: R8,000 revenue, R2,400 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 25%. B: 2400/8000 = 30%. Answer 30" },
  { question: "Press release: 40% growth. Previous 500, current 680. Actual growth (%)?", answer: 36, explanation: "(680−500)/500 = 36%. Claim 40% inaccurate." },
  { question: "Enterprise X: R100,000 revenue, R25,000 profit. Y: R90,000 revenue, R27,000 profit. Higher margin (%)?", answer: 30, explanation: "X: 25%. Y: 27000/90000 = 30%. Answer 30" },
  { question: "Statement: 20% drop. Old R5,000, new R4,200. Actual percentage decrease?", answer: 16, explanation: "(5000−4200)/5000 = 16%. Claim 20% wrong." },
  { question: "Outlet A: R12,000 sales, R3,600 profit. Outlet B: R9,000 sales, R2,700 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 30%. B: 30%. Answer 30" },
  { question: "Claim: doubled. Was 300, now 550. Actual percentage increase?", answer: 83.33, explanation: "(550−300)/300 ≈ 83.33%. Not 100%." },
  { question: "Corp A: R200,000 revenue, R50,000 profit. Corp B: R150,000 revenue, R48,000 profit. Higher profit margin (%)?", answer: 32, explanation: "A: 25%. B: 48000/150000 = 32%. Answer 32" }
];

export function getJournalistQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): JournalistQuestion {
  let questions: JournalistQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
