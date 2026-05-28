"use strict";
// Journalist – Data & Reporting Challenge (Economic News Investigation)
// 20 questions per difficulty tier. All numeric answers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extremeQuestions = exports.hardQuestions = exports.mediumQuestions = exports.easyQuestions = void 0;
exports.getJournalistQuestion = getJournalistQuestion;
// EASY – Basic Data Reading (totals, differences, simple averages)
exports.easyQuestions = [
    { question: "Municipal tax collected: Mon R12,400, Wed R9,800, Fri R11,200. Total (R)?", answer: 33400, explanation: "12,400 + 9,800 + 11,200 = R33,400" },
    { question: "6 spaza shops reported daily sales: 1,450; 1,680; 1,320; 1,590; 1,410; 1,550. Average (R)?", answer: 1500, explanation: "9,000 ÷ 6 = R1,500" },
    { question: "Water tariff revenue: R3,200 + R2,850 + R3,400. Total (R)?", answer: 9450, explanation: "3,200 + 2,850 + 3,400 = R9,450" },
    { question: "5 school bursaries awarded: R2,000, R2,400, R1,800, R2,600, R2,200. Average (R)?", answer: 2240, explanation: "11,200 ÷ 5 = R2,240" },
    { question: "MyCiTi bus fares: R4,500 (morning), R3,900 (evening). Total collected (R)?", answer: 8400, explanation: "4,500 + 3,900 = R8,400" },
    { question: "Census count: Ward A 820 residents, Ward B 755. Combined total?", answer: 1575, explanation: "820 + 755 = 1,575" },
    { question: "Clinic donation drive: R800, R1,200, R950. Total (R)?", answer: 2950, explanation: "800 + 1,200 + 950 = R2,950" },
    { question: "4 weekly newspaper sales: 520, 580, 495, 605 copies. Average per week?", answer: 550, explanation: "2,200 ÷ 4 = 550" },
    { question: "Town income R18,000. Expenditure R11,600. Surplus (R)?", answer: 6400, explanation: "18,000 − 11,600 = R6,400" },
    { question: "Load shedding report: outages of 4 hr, 6 hr, 5 hr over 3 days. Total hours?", answer: 15, explanation: "4 + 6 + 5 = 15 hours" },
    { question: "Property rates billed: R6,700 + R5,900. Total (R)?", answer: 12600, explanation: "6,700 + 5,900 = R12,600" },
    { question: "Literacy survey scores: 72, 68, 80, 74, 76. Average?", answer: 74, explanation: "370 ÷ 5 = 74" },
    { question: "Charity run: R150 entry fee, 80 runners. Total raised (R)?", answer: 12000, explanation: "150 × 80 = R12,000" },
    { question: "Petrol prices tracked: R22.50, R23.10, R22.80. Average (R)?", answer: 22.8, explanation: "67.40 ÷ 3 = R22.80" },
    { question: "Disaster relief fund: Budget R45,000. Spent R28,750. Remaining (R)?", answer: 16250, explanation: "45,000 − 28,750 = R16,250" },
    { question: "Online subscribers: 1,240 + 980. Total subscribers?", answer: 2220, explanation: "1,240 + 980 = 2,220" },
    { question: "4 town hall meetings attendance: 45, 52, 38, 65. Average?", answer: 50, explanation: "200 ÷ 4 = 50" },
    { question: "Eskom rebate claims: R2,400, R1,850, R2,150. Total (R)?", answer: 6400, explanation: "2,400 + 1,850 + 2,150 = R6,400" },
    { question: "Revenue R24,500. Operating costs R16,300. Net (R)?", answer: 8200, explanation: "24,500 − 16,300 = R8,200" },
    { question: "6 months pothole repair spend: 4,200; 3,800; 5,100; 4,600; 4,900; 5,400 (R). Average?", answer: 4666.67, explanation: "28,000 ÷ 6 ≈ R4,666.67" }
];
// MEDIUM – Percentages & Change (% increase/decrease, growth)
exports.mediumQuestions = [
    { question: "Township population was 480. Now 600. What is the percentage increase?", answer: 25, explanation: "(600−480)/480 × 100 = 25%" },
    { question: "Bond repayment dropped from R350,000 to R280,000. Percentage decrease?", answer: 20, explanation: "(350,000−280,000)/350,000 × 100 = 20%" },
    { question: "School enrolment 320 last year, 416 this year. Percentage increase?", answer: 30, explanation: "(416−320)/320 × 100 = 30%" },
    { question: "Taxi fare was R25, now R20. Percentage decrease?", answer: 20, explanation: "(25−20)/25 × 100 = 20%" },
    { question: "Spaza turnover R15,000 → R19,500. Percentage increase?", answer: 30, explanation: "(19,500−15,000)/15,000 × 100 = 30%" },
    { question: "Market visitors 240 → 312. Percentage increase?", answer: 30, explanation: "(312−240)/240 × 100 = 30%" },
    { question: "Plot value R120,000 → R90,000. Percentage decrease?", answer: 25, explanation: "(120,000−90,000)/120,000 × 100 = 25%" },
    { question: "Informal traders 180 → 234. Percentage increase?", answer: 30, explanation: "(234−180)/180 × 100 = 30%" },
    { question: "Electricity bill R850 → R680. Percentage decrease?", answer: 20, explanation: "(850−680)/850 × 100 = 20%" },
    { question: "Library members 350 → 420. Percentage increase?", answer: 20, explanation: "(420−350)/350 × 100 = 20%" },
    { question: "Grant recipients 500 → 650. Percentage increase?", answer: 30, explanation: "(650−500)/500 × 100 = 30%" },
    { question: "Flat rental R4,500 → R3,600. Percentage decrease?", answer: 20, explanation: "(4,500−3,600)/4,500 × 100 = 20%" },
    { question: "Newspaper sales 800 → 1,000. Percentage increase?", answer: 25, explanation: "(1,000−800)/800 × 100 = 25%" },
    { question: "Municipal budget R25,000 → R20,000. Percentage decrease?", answer: 20, explanation: "(25,000−20,000)/25,000 × 100 = 20%" },
    { question: "Clinic patients 280 → 364. Percentage increase?", answer: 30, explanation: "(364−280)/280 × 100 = 30%" },
    { question: "Water usage 1,200 → 960 litres. Percentage decrease?", answer: 20, explanation: "(1,200−960)/1,200 × 100 = 20%" },
    { question: "Digital subscribers 1,500 → 1,950. Percentage increase?", answer: 30, explanation: "(1,950−1,500)/1,500 × 100 = 30%" },
    { question: "Concert ticket R180 → R144. Percentage decrease?", answer: 20, explanation: "(180−144)/180 × 100 = 20%" },
    { question: "Social grant count 400 → 520. Percentage increase?", answer: 30, explanation: "(520−400)/400 × 100 = 30%" },
    { question: "Municipal debt R50,000 → R40,000. Percentage decrease?", answer: 20, explanation: "(50,000−40,000)/50,000 × 100 = 20%" }
];
// HARD – Trend Analysis (comparing datasets, patterns, growth from previous)
exports.hardQuestions = [
    { question: "Town income: Week 1 R16,000, Week 2 R18,400, Week 3 R15,200, Week 4 R21,280. Highest week-on-week growth (%)? (One decimal)", answer: 40, explanation: "Week 4: (21,280−15,200)/15,200 = 40%" },
    { question: "Municipal expenses rise 12% monthly starting at R6,000. Month 2 expense (R)?", answer: 6720, explanation: "6,000 × 1.12 = R6,720" },
    { question: "Week 1: R11,000, Week 2: R13,200, Week 3: R12,100, Week 4: R14,520. Highest week-on-week growth (%)?", answer: 20, explanation: "Week 2 and Week 4 both 20%" },
    { question: "Revenue starts at R5,000 and grows 18% per month. Month 2 revenue (R)?", answer: 5900, explanation: "5,000 × 1.18 = R5,900" },
    { question: "Daily sales: Mon 100, Tue 120, Wed 110, Thu 132. Which day had 20% growth from previous? Answer that day's sales.", answer: 132, explanation: "Thu: (132−110)/110 = 20%" },
    { question: "Ward budget R3,200. Increases 25% next quarter. New budget (R)?", answer: 4000, explanation: "3,200 × 1.25 = R4,000" },
    { question: "Q1: R22,000, Q2: R24,200, Q3: R21,780, Q4: R26,136. Highest quarter-on-quarter growth (%)? (One decimal)", answer: 20, explanation: "Q4: (26,136−21,780)/21,780 = 20%" },
    { question: "Teacher stipend R3,500. 8% raise. New stipend (R)?", answer: 3780, explanation: "3,500 × 1.08 = R3,780" },
    { question: "Income: Jan 9,000, Feb 10,800, Mar 9,720, Apr 11,664. Highest month-on-month growth (%)?", answer: 20, explanation: "Feb: (10,800−9,000)/9,000 = 20%" },
    { question: "Operating costs R7,500. Next month +20%. Month 2 costs (R)?", answer: 9000, explanation: "7,500 × 1.20 = R9,000" },
    { question: "Poll readings: 60, 66, 72, 79. Largest percentage increase from previous?", answer: 10, explanation: "Each step is 10% increase" },
    { question: "Revenue R8,500. Grows 15%. New value (R)?", answer: 9775, explanation: "8,500 × 1.15 = R9,775" },
    { question: "Q1: 14,000, Q2: 15,400, Q3: 14,000, Q4: 16,800. Highest quarter growth (%)?", answer: 20, explanation: "Q4: (16,800−14,000)/14,000 = 20%" },
    { question: "Start R1,200. +35% next period. New amount (R)?", answer: 1620, explanation: "1,200 × 1.35 = R1,620" },
    { question: "Month 1: 6,000, Month 2: 6,600, Month 3: 6,000, Month 4: 7,200. Highest month-on-month % growth?", answer: 20, explanation: "Month 4: (7,200−6,000)/6,000 = 20%" },
    { question: "Base R10,500. Increase 10%. New value (R)?", answer: 11550, explanation: "10,500 × 1.10 = R11,550" },
    { question: "Values: A 120→144, B 90→117, C 200→220. Which change equals 30%? Answer that percentage.", answer: 30, explanation: "B: (117−90)/90 = 30%" },
    { question: "Expenses R5,600. +15% next month. Month 2 (R)?", answer: 6440, explanation: "5,600 × 1.15 = R6,440" },
    { question: "Week 1: 9,000, Week 2: 10,800, Week 3: 9,000, Week 4: 11,250. Highest week-on-week growth (%)?", answer: 25, explanation: "Week 4: (11,250−9,000)/9,000 = 25%" },
    { question: "Starting R3,750. 16% increase. New value (R)?", answer: 4350, explanation: "3,750 × 1.16 = R4,350" }
];
// EXTREME – Investigative Analysis (inconsistencies, multi-step, profit %)
exports.extremeQuestions = [
    { question: "Mayor claims tax revenue rose 25%. Last month R12,000, this month R13,800. Actual percentage increase?", answer: 15, explanation: "(13,800−12,000)/12,000 = 15%. Claim was 25%." },
    { question: "Spaza A: Revenue R24,000, Profit R6,000. Spaza B: Revenue R18,000, Profit R7,200. Higher profit margin (%)?", answer: 40, explanation: "A: 25%. B: 7,200/18,000 = 40%. Answer 40" },
    { question: "Claim: market sales up 30%. Last month 350, this month 420. Actual percentage increase?", answer: 20, explanation: "(420−350)/350 = 20%. Claim 30% is wrong." },
    { question: "Company X: Revenue R36,000, Profit R9,000. Company Y: Revenue R28,000, Profit R9,800. Higher profit margin (%)?", answer: 35, explanation: "X: 25%. Y: 9,800/28,000 = 35%. Answer 35" },
    { question: "Council says spending fell 20%. Was R10,000, now R8,500. Actual percentage change?", answer: 15, explanation: "(10,000−8,500)/10,000 = 15% decrease." },
    { question: "Butchery A: R48,000 revenue, R14,400 profit. Butchery B: R55,000 revenue, R16,500 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 30%. B: 16,500/55,000 = 30%. Answer 30" },
    { question: "Report claims 35% growth. Before: 240, after: 300. Actual growth (%)?", answer: 25, explanation: "(300−240)/240 = 25%. Claim 35% inaccurate." },
    { question: "Firm P: R72,000 revenue, R21,600 profit. Firm Q: R54,000 revenue, R16,200 profit. Higher profit margin (%)?", answer: 30, explanation: "P: 30%. Q: 30%. Answer 30" },
    { question: "Council claims 12% budget cut. Was R15,000, now R13,200. Actual percentage decrease?", answer: 12, explanation: "(15,000−13,200)/15,000 = 12%. Claim accurate." },
    { question: "Store A: R25,000 sales, R5,000 profit. Store B: R19,000 sales, R5,700 profit. Higher profit %? Answer that percentage.", answer: 30, explanation: "A: 20%. B: 5,700/19,000 = 30%. Answer 30" },
    { question: "Headline: 60% increase. Old 150, new 225. Actual increase (%)?", answer: 50, explanation: "(225−150)/150 = 50%. Claim wrong." },
    { question: "Business M: R96,000 revenue, R24,000 profit. Business N: R84,000 revenue, R25,200 profit. Higher margin (%)?", answer: 30, explanation: "M: 25%. N: 25,200/84,000 = 30%. Answer 30" },
    { question: "Announcement: 18% rise. Was R7,500, now R8,850. Actual percentage increase?", answer: 18, explanation: "(8,850−7,500)/7,500 = 18%. Claim accurate." },
    { question: "Vendor A: R14,000 revenue, R3,500 profit. Vendor B: R11,000 revenue, R3,520 profit. Higher profit %? Answer that percentage.", answer: 32, explanation: "A: 25%. B: 3,520/11,000 = 32%. Answer 32" },
    { question: "Press release: 45% growth. Previous 400, current 540. Actual growth (%)?", answer: 35, explanation: "(540−400)/400 = 35%. Claim 45% inaccurate." },
    { question: "Enterprise X: R120,000 revenue, R30,000 profit. Y: R105,000 revenue, R31,500 profit. Higher margin (%)?", answer: 30, explanation: "X: 25%. Y: 31,500/105,000 = 30%. Answer 30" },
    { question: "Statement: 25% drop. Old R6,400, new R4,992. Actual percentage decrease?", answer: 22, explanation: "(6,400−4,992)/6,400 = 22%. Claim 25% wrong." },
    { question: "Outlet A: R16,000 sales, R4,800 profit. Outlet B: R12,000 sales, R3,720 profit. Higher profit %? Answer that percentage.", answer: 31, explanation: "A: 30%. B: 3,720/12,000 = 31%. Answer 31" },
    { question: "Claim: doubled. Was 280, now 504. Actual percentage increase?", answer: 80, explanation: "(504−280)/280 = 80%. Not 100%." },
    { question: "Corp A: R240,000 revenue, R60,000 profit. Corp B: R180,000 revenue, R57,600 profit. Higher profit margin (%)?", answer: 32, explanation: "A: 25%. B: 57,600/180,000 = 32%. Answer 32" }
];
function getJournalistQuestion(difficulty) {
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
//# sourceMappingURL=journalist-questions.js.map