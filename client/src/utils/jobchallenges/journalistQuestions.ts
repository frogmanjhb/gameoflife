// Journalist – Data & Reporting Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface JournalistQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Basic Data Reading (totals, differences, simple averages)
const easyQuestions: JournalistQuestion[] = [
  { question: "Municipal fees collected: Tue R10,600, Thu R8,900, Sat R11,500. Total (R)?", answer: 31000, explanation: "10,600 + 8,900 + 11,500 = R31,000" },
  { question: "5 fruit stalls reported daily sales: 980; 1,120; 1,050; 1,180; 1,070. Average (R)?", answer: 1080, explanation: "5,400 ÷ 5 = R1,080" },
  { question: "Electricity levy revenue: R2,750 + R3,100 + R2,950. Total (R)?", answer: 8800, explanation: "2,750 + 3,100 + 2,950 = R8,800" },
  { question: "4 sports bursaries awarded: R1,800, R2,200, R1,600, R2,400. Average (R)?", answer: 2000, explanation: "8,000 ÷ 4 = R2,000" },
  { question: "Golden Arrow bus fares: R3,200 (morning), R4,100 (evening). Total collected (R)?", answer: 7300, explanation: "3,200 + 4,100 = R7,300" },
  { question: "Census count: Ward C 692 residents, Ward D 818. Combined total?", answer: 1510, explanation: "692 + 818 = 1,510" },
  { question: "Food bank drive: R650, R890, R760. Total (R)?", answer: 2300, explanation: "650 + 890 + 760 = R2,300" },
  { question: "5 weekly edition sales: 480, 520, 490, 510, 500 copies. Average per week?", answer: 500, explanation: "2,500 ÷ 5 = 500" },
  { question: "Town income R22,400. Expenditure R14,800. Surplus (R)?", answer: 7600, explanation: "22,400 − 14,800 = R7,600" },
  { question: "Load shedding report: outages of 3 hr, 5 hr, 4 hr over 3 days. Total hours?", answer: 12, explanation: "3 + 5 + 4 = 12 hours" },
  { question: "Property rates billed: R7,200 + R6,400. Total (R)?", answer: 13600, explanation: "7,200 + 6,400 = R13,600" },
  { question: "Maths survey scores: 65, 72, 78, 70, 75. Average?", answer: 72, explanation: "360 ÷ 5 = 72" },
  { question: "Charity fun run: R200 entry fee, 55 runners. Total raised (R)?", answer: 11000, explanation: "200 × 55 = R11,000" },
  { question: "Diesel prices tracked: R20.00, R22.00, R24.00. Average (R)?", answer: 22, explanation: "66 ÷ 3 = R22" },
  { question: "Disaster relief fund: Budget R52,000. Spent R31,500. Remaining (R)?", answer: 20500, explanation: "52,000 − 31,500 = R20,500" },
  { question: "Podcast listeners: 890 + 1,150. Total listeners?", answer: 2040, explanation: "890 + 1,150 = 2,040" },
  { question: "5 community meetings attendance: 42, 58, 36, 64, 50. Average?", answer: 50, explanation: "250 ÷ 5 = 50" },
  { question: "Solar rebate claims: R1,950, R2,300, R1,750. Total (R)?", answer: 6000, explanation: "1,950 + 2,300 + 1,750 = R6,000" },
  { question: "Revenue R28,600. Operating costs R19,400. Net (R)?", answer: 9200, explanation: "28,600 − 19,400 = R9,200" },
  { question: "4 months road repair spend: 3,600; 4,200; 3,900; 4,500 (R). Average?", answer: 4050, explanation: "16,200 ÷ 4 = R4,050" },
];

// MEDIUM – Percentages & Change (% increase/decrease, growth)
const mediumQuestions: JournalistQuestion[] = [
  { question: "Khayelitsha population was 520. Now 650. What is the percentage increase?", answer: 25, explanation: "(650−520)/520 × 100 = 25%" },
  { question: "Home loan repayment dropped from R420,000 to R336,000. Percentage decrease?", answer: 20, explanation: "(420,000−336,000)/420,000 × 100 = 20%" },
  { question: "School enrolment 250 last year, 325 this year. Percentage increase?", answer: 30, explanation: "(325−250)/250 × 100 = 30%" },
  { question: "Minibus taxi fare was R30, now R24. Percentage decrease?", answer: 20, explanation: "(30−24)/30 × 100 = 20%" },
  { question: "Spaza turnover R12,000 → R15,600. Percentage increase?", answer: 30, explanation: "(15,600−12,000)/12,000 × 100 = 30%" },
  { question: "Weekend market visitors 200 → 260. Percentage increase?", answer: 30, explanation: "(260−200)/200 × 100 = 30%" },
  { question: "Plot value R160,000 → R120,000. Percentage decrease?", answer: 25, explanation: "(160,000−120,000)/160,000 × 100 = 25%" },
  { question: "Informal traders 150 → 195. Percentage increase?", answer: 30, explanation: "(195−150)/150 × 100 = 30%" },
  { question: "Electricity bill R950 → R760. Percentage decrease?", answer: 20, explanation: "(950−760)/950 × 100 = 20%" },
  { question: "Library members 400 → 480. Percentage increase?", answer: 20, explanation: "(480−400)/400 × 100 = 20%" },
  { question: "Grant recipients 450 → 585. Percentage increase?", answer: 30, explanation: "(585−450)/450 × 100 = 30%" },
  { question: "Flat rental R5,000 → R4,000. Percentage decrease?", answer: 20, explanation: "(5,000−4,000)/5,000 × 100 = 20%" },
  { question: "Newspaper sales 640 → 800. Percentage increase?", answer: 25, explanation: "(800−640)/640 × 100 = 25%" },
  { question: "Municipal budget R30,000 → R24,000. Percentage decrease?", answer: 20, explanation: "(30,000−24,000)/30,000 × 100 = 20%" },
  { question: "Clinic patients 320 → 416. Percentage increase?", answer: 30, explanation: "(416−320)/320 × 100 = 30%" },
  { question: "Water usage 1,500 → 1,200 litres. Percentage decrease?", answer: 20, explanation: "(1,500−1,200)/1,500 × 100 = 20%" },
  { question: "Digital subscribers 1,200 → 1,560. Percentage increase?", answer: 30, explanation: "(1,560−1,200)/1,200 × 100 = 30%" },
  { question: "Concert ticket R200 → R160. Percentage decrease?", answer: 20, explanation: "(200−160)/200 × 100 = 20%" },
  { question: "Social grant count 350 → 455. Percentage increase?", answer: 30, explanation: "(455−350)/350 × 100 = 30%" },
  { question: "Municipal debt R60,000 → R48,000. Percentage decrease?", answer: 20, explanation: "(60,000−48,000)/60,000 × 100 = 20%" },
];

// HARD – Trend Analysis (comparing datasets, patterns, growth from previous)
const hardQuestions: JournalistQuestion[] = [
  { question: "Town income: Week 1 R14,000, Week 2 R16,800, Week 3 R14,700, Week 4 R20,580. Highest week-on-week growth (%)?", answer: 40, explanation: "Week 4: (20,580−14,700)/14,700 = 40%" },
  { question: "Municipal expenses rise 10% monthly starting at R7,500. Month 2 expense (R)?", answer: 8250, explanation: "7,500 × 1.10 = R8,250" },
  { question: "Week 1: R12,000, Week 2: R14,400, Week 3: R13,200, Week 4: R15,840. Highest week-on-week growth (%)?", answer: 20, explanation: "Week 2 and Week 4 both 20%" },
  { question: "Revenue starts at R6,000 and grows 15% per month. Month 2 revenue (R)?", answer: 6900, explanation: "6,000 × 1.15 = R6,900" },
  { question: "Daily sales: Mon 100, Tue 120, Wed 100, Thu 120. Which day had 20% growth from previous? Answer that day's sales.", answer: 120, explanation: "Tue and Thu: (120−100)/100 = 20%" },
  { question: "Ward budget R4,000. Increases 20% next quarter. New budget (R)?", answer: 4800, explanation: "4,000 × 1.20 = R4,800" },
  { question: "Q1: R18,000, Q2: R19,800, Q3: R17,820, Q4: R21,384. Highest quarter-on-quarter growth (%)?", answer: 20, explanation: "Q4: (21,384−17,820)/17,820 = 20%" },
  { question: "Teacher stipend R4,000. 5% raise. New stipend (R)?", answer: 4200, explanation: "4,000 × 1.05 = R4,200" },
  { question: "Income: Jan 8,000, Feb 9,600, Mar 8,640, Apr 10,368. Highest month-on-month growth (%)?", answer: 20, explanation: "Feb: (9,600−8,000)/8,000 = 20%" },
  { question: "Operating costs R9,000. Next month +25%. Month 2 costs (R)?", answer: 11250, explanation: "9,000 × 1.25 = R11,250" },
  { question: "Poll readings: 50, 55, 60, 66. Largest percentage increase from previous?", answer: 10, explanation: "Each step is 10% increase" },
  { question: "Revenue R12,000. Grows 12%. New value (R)?", answer: 13440, explanation: "12,000 × 1.12 = R13,440" },
  { question: "Q1: 20,000, Q2: 22,000, Q3: 20,000, Q4: 24,000. Highest quarter growth (%)?", answer: 20, explanation: "Q4: (24,000−20,000)/20,000 = 20%" },
  { question: "Start R2,000. +40% next period. New amount (R)?", answer: 2800, explanation: "2,000 × 1.40 = R2,800" },
  { question: "Month 1: 5,000, Month 2: 5,500, Month 3: 5,000, Month 4: 6,000. Highest month-on-month % growth?", answer: 20, explanation: "Month 4: (6,000−5,000)/5,000 = 20%" },
  { question: "Base R9,000. Increase 10%. New value (R)?", answer: 9900, explanation: "9,000 × 1.10 = R9,900" },
  { question: "Values: A 150→180, B 100→130, C 250→275. Which change equals 30%? Answer that percentage.", answer: 30, explanation: "B: (130−100)/100 = 30%" },
  { question: "Expenses R8,000. +12% next month. Month 2 (R)?", answer: 8960, explanation: "8,000 × 1.12 = R8,960" },
  { question: "Week 1: 10,000, Week 2: 12,000, Week 3: 10,000, Week 4: 12,500. Highest week-on-week growth (%)?", answer: 25, explanation: "Week 4: (12,500−10,000)/10,000 = 25%" },
  { question: "Starting R5,000. 20% increase. New value (R)?", answer: 6000, explanation: "5,000 × 1.20 = R6,000" },
];

// EXTREME – Investigative Analysis (inconsistencies, multi-step, profit %)
const extremeQuestions: JournalistQuestion[] = [
  { question: "Mayor claims tax revenue rose 20%. Last month R15,000, this month R17,250. Actual percentage increase?", answer: 15, explanation: "(17,250−15,000)/15,000 = 15%. Claim was 20%." },
  { question: "Spaza A: Revenue R20,000, Profit R5,000. Spaza B: Revenue R15,000, Profit R6,000. Higher profit margin (%)?", answer: 40, explanation: "A: 25%. B: 6,000/15,000 = 40%. Answer 40" },
  { question: "Claim: market sales up 25%. Last month 400, this month 480. Actual percentage increase?", answer: 20, explanation: "(480−400)/400 = 20%. Claim 25% is wrong." },
  { question: "Company X: Revenue R40,000, Profit R10,000. Company Y: Revenue R32,000, Profit R11,200. Higher profit margin (%)?", answer: 35, explanation: "X: 25%. Y: 11,200/32,000 = 35%. Answer 35" },
  { question: "Council says spending fell 15%. Was R12,000, now R10,200. Actual percentage change?", answer: 15, explanation: "(12,000−10,200)/12,000 = 15% decrease." },
  { question: "Butchery A: R50,000 revenue, R15,000 profit. Butchery B: R60,000 revenue, R18,000 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 30%. B: 18,000/60,000 = 30%. Answer 30" },
  { question: "Report claims 40% growth. Before: 200, after: 260. Actual growth (%)?", answer: 30, explanation: "(260−200)/200 = 30%. Claim 40% inaccurate." },
  { question: "Firm P: R80,000 revenue, R24,000 profit. Firm Q: R70,000 revenue, R21,000 profit. Higher profit margin (%)?", answer: 30, explanation: "P: 30%. Q: 21,000/70,000 = 30%. Answer 30" },
  { question: "Council claims 10% budget cut. Was R20,000, now R18,000. Actual percentage decrease?", answer: 10, explanation: "(20,000−18,000)/20,000 = 10%. Claim accurate." },
  { question: "Store A: R30,000 sales, R6,000 profit. Store B: R22,000 sales, R6,600 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 20%. B: 6,600/22,000 = 30%. Answer 30" },
  { question: "Headline: 80% increase. Old 125, new 200. Actual increase (%)?", answer: 60, explanation: "(200−125)/125 = 60%. Claim wrong." },
  { question: "Business M: R100,000 revenue, R25,000 profit. Business N: R90,000 revenue, R27,000 profit. Higher margin (%)?", answer: 30, explanation: "M: 25%. N: 27,000/90,000 = 30%. Answer 30" },
  { question: "Announcement: 22% rise. Was R10,000, now R12,200. Actual percentage increase?", answer: 22, explanation: "(12,200−10,000)/10,000 = 22%. Claim accurate." },
  { question: "Vendor A: R18,000 revenue, R4,500 profit. Vendor B: R13,750 revenue, R4,400 profit. Higher profit %? Answer that percentage.", answer: 32, explanation: "A: 25%. B: 4,400/13,750 = 32%. Answer 32" },
  { question: "Press release: 50% growth. Previous 320, current 448. Actual growth (%)?", answer: 40, explanation: "(448−320)/320 = 40%. Claim 50% inaccurate." },
  { question: "Enterprise X: R150,000 revenue, R37,500 profit. Y: R130,000 revenue, R39,000 profit. Higher margin (%)?", answer: 30, explanation: "X: 25%. Y: 39,000/130,000 = 30%. Answer 30" },
  { question: "Statement: 30% drop. Old R8,000, new R5,760. Actual percentage decrease?", answer: 28, explanation: "(8,000−5,760)/8,000 = 28%. Claim 30% wrong." },
  { question: "Outlet A: R20,000 sales, R6,000 profit. Outlet B: R15,000 sales, R4,800 profit. Higher profit %? Answer that percentage.", answer: 32, explanation: "A: 30%. B: 4,800/15,000 = 32%. Answer 32" },
  { question: "Claim: doubled. Was 350, now 630. Actual percentage increase?", answer: 80, explanation: "(630−350)/350 = 80%. Not 100%." },
  { question: "Corp A: R200,000 revenue, R50,000 profit. Corp B: R160,000 revenue, R51,200 profit. Higher profit margin (%)?", answer: 32, explanation: "A: 25%. B: 51,200/160,000 = 32%. Answer 32" },
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
