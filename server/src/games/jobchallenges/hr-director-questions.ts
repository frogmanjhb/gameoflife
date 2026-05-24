// HR Director – People Management Challenge (HR Review Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface HRDirectorQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Attendance & Totals (counting, percentages, simple averages)
export const easyQuestions: HRDirectorQuestion[] = [
  { question: "Class has 32 students. 28 are present. What percentage attended?", answer: 87.5, explanation: "28 ÷ 32 × 100 = 87.5%" },
  { question: "6 students completed 5 tasks each. Total tasks completed?", answer: 30, explanation: "6 × 5 = 30" },
  { question: "36 students. 33 present. Attendance percentage?", answer: 91.67, explanation: "33 ÷ 36 × 100 ≈ 91.67%" },
  { question: "8 students did 4 tasks each. Total tasks?", answer: 32, explanation: "8 × 4 = 32" },
  { question: "Class of 24. 21 attended. What percentage?", answer: 87.5, explanation: "21 ÷ 24 × 100 = 87.5%" },
  { question: "5 students completed 6 tasks each. Total tasks?", answer: 30, explanation: "5 × 6 = 30" },
  { question: "45 students. 40 present. Attendance %?", answer: 88.89, explanation: "40 ÷ 45 × 100 ≈ 88.89%" },
  { question: "9 students, 3 tasks each. Total tasks completed?", answer: 27, explanation: "9 × 3 = 27" },
  { question: "Class has 28 students. 25 present. What percentage attended?", answer: 89.29, explanation: "25 ÷ 28 × 100 ≈ 89.29%" },
  { question: "11 students completed 4 tasks each. Total tasks?", answer: 44, explanation: "11 × 4 = 44" },
  { question: "52 students. 47 present. Attendance percentage?", answer: 90.38, explanation: "47 ÷ 52 × 100 ≈ 90.38%" },
  { question: "4 students did 8 tasks each. Total tasks?", answer: 32, explanation: "4 × 8 = 32" },
  { question: "Class of 34. 30 attended. What percentage?", answer: 88.24, explanation: "30 ÷ 34 × 100 ≈ 88.24%" },
  { question: "7 students, 5 tasks each. Total tasks completed?", answer: 35, explanation: "7 × 5 = 35" },
  { question: "38 students. 34 present. Attendance %?", answer: 89.47, explanation: "34 ÷ 38 × 100 ≈ 89.47%" },
  { question: "10 students completed 7 tasks each. Total tasks?", answer: 70, explanation: "10 × 7 = 70" },
  { question: "Class has 26 students. 23 present. What percentage attended?", answer: 88.46, explanation: "23 ÷ 26 × 100 ≈ 88.46%" },
  { question: "12 students, 4 tasks each. Total tasks?", answer: 48, explanation: "12 × 4 = 48" },
  { question: "64 students. 58 present. Attendance percentage?", answer: 90.63, explanation: "58 ÷ 64 × 100 = 90.625" },
  { question: "6 students did 9 tasks each. Total tasks completed?", answer: 54, explanation: "6 × 9 = 54" }
];

// MEDIUM – Performance Analysis (averages, comparison, fairness)
export const mediumQuestions: HRDirectorQuestion[] = [
  { question: "Team A completed 9, 11, 8, 10 tasks. What is Team A's average?", answer: 9.5, explanation: "(9+11+8+10) ÷ 4 = 9.5" },
  { question: "Team B completed 6, 7, 5, 8 tasks. What is Team B's average?", answer: 6.5, explanation: "(6+7+5+8) ÷ 4 = 6.5" },
  { question: "4 students earned bonuses R450, R550, R650, R750. What is the average bonus (R)?", answer: 600, explanation: "(450+550+650+750) ÷ 4 = R600" },
  { question: "Scores: 12, 9, 11, 8. Average?", answer: 10, explanation: "(12+9+11+8) ÷ 4 = 10" },
  { question: "5 workers completed 14, 16, 12, 18, 15 tasks. Average tasks per worker?", answer: 15, explanation: "(14+16+12+18+15) ÷ 5 = 15" },
  { question: "Bonuses R350, R450, R550. Average (R)?", answer: 450, explanation: "(350+450+550) ÷ 3 = R450" },
  { question: "Team completed 7, 9, 8, 10, 6 tasks. Average?", answer: 8, explanation: "(7+9+8+10+6) ÷ 5 = 8" },
  { question: "6 students earned R120, R180, R240, R180, R240, R120. Average bonus (R)?", answer: 180, explanation: "1,080 ÷ 6 = R180" },
  { question: "Attendance counts: 26, 28, 25, 27. Average attendance?", answer: 26.5, explanation: "(26+28+25+27) ÷ 4 = 26.5" },
  { question: "Tasks per person: 5, 6, 4, 7, 5. Average?", answer: 5.4, explanation: "27 ÷ 5 = 5.4" },
  { question: "Team A: 13, 15, 14. Team B: 10, 12, 11. What is Team A's average?", answer: 14, explanation: "(13+15+14) ÷ 3 = 14" },
  { question: "Team A: 13, 15, 14. Team B: 10, 12, 11. What is Team B's average?", answer: 11, explanation: "(10+12+11) ÷ 3 = 11" },
  { question: "Bonuses R500, R600, R700, R600. Average (R)?", answer: 600, explanation: "2,400 ÷ 4 = R600" },
  { question: "Performance scores: 8, 9, 7, 9, 8. Average?", answer: 8.2, explanation: "41 ÷ 5 = 8.2" },
  { question: "7 workers: 16, 19, 14, 21, 17, 18, 15 tasks. Average?", answer: 17.14, explanation: "120 ÷ 7 ≈ 17.14" },
  { question: "5 students R300, R400, R300, R400, R500. Average bonus (R)?", answer: 380, explanation: "1,900 ÷ 5 = R380" },
  { question: "Weekly attendance: 31, 29, 33, 30. Average?", answer: 30.75, explanation: "(31+29+33+30) ÷ 4 = 30.75" },
  { question: "Tasks: 4, 5, 6, 3, 6, 4. Average?", answer: 4.67, explanation: "28 ÷ 6 ≈ 4.67" },
  { question: "Team X: 17, 19, 18. What is Team X's average?", answer: 18, explanation: "(17+19+18) ÷ 3 = 18" },
  { question: "Bonuses R700, R900, R800, R1,000. Average (R)?", answer: 850, explanation: "3,400 ÷ 4 = R850" }
];

// HARD – Resource Allocation (distributing bonuses, proportional reasoning, workload)
export const hardQuestions: HRDirectorQuestion[] = [
  { question: "HR has R6,000 bonus pool. 6 students performed equally. How much each (R)?", answer: 1000, explanation: "6,000 ÷ 6 = R1,000" },
  { question: "Attendance dropped from 28 to 21 students. What percentage decrease?", answer: 25, explanation: "(28−21) ÷ 28 × 100 = 25%" },
  { question: "R4,800 bonus pool. 8 equal shares. How much per person (R)?", answer: 600, explanation: "4,800 ÷ 8 = R600" },
  { question: "Attendance went from 35 to 28. Percentage decrease?", answer: 20, explanation: "(35−28) ÷ 35 × 100 = 20%" },
  { question: "R9,600 to share among 8 workers equally. Each gets (R)?", answer: 1200, explanation: "9,600 ÷ 8 = R1,200" },
  { question: "Class size 30, then 24. What percentage decrease?", answer: 20, explanation: "(30−24) ÷ 30 × 100 = 20%" },
  { question: "R5,400 pool. 9 students. Equal share (R)?", answer: 600, explanation: "5,400 ÷ 9 = R600" },
  { question: "Attendance 32, then 24. Percentage decrease?", answer: 25, explanation: "(32−24) ÷ 32 × 100 = 25%" },
  { question: "R7,200 bonus. 6 workers equally. Each (R)?", answer: 1200, explanation: "7,200 ÷ 6 = R1,200" },
  { question: "From 44 to 33 present. Percentage decrease?", answer: 25, explanation: "(44−33) ÷ 44 × 100 = 25%" },
  { question: "R2,500 pool. 5 equal shares. Per person (R)?", answer: 500, explanation: "2,500 ÷ 5 = R500" },
  { question: "Attendance 48, then 36. Percentage decrease?", answer: 25, explanation: "(48−36) ÷ 48 × 100 = 25%" },
  { question: "R8,400 among 7 workers. Each gets (R)?", answer: 1200, explanation: "8,400 ÷ 7 = R1,200" },
  { question: "From 40 to 30 students. Percentage decrease?", answer: 25, explanation: "(40−30) ÷ 40 × 100 = 25%" },
  { question: "R10,500 pool. 7 equal. Per person (R)?", answer: 1500, explanation: "10,500 ÷ 7 = R1,500" },
  { question: "Attendance 24, then 18. Percentage decrease?", answer: 25, explanation: "(24−18) ÷ 24 × 100 = 25%" },
  { question: "R1,800 bonus. 4 workers. Each (R)?", answer: 450, explanation: "1,800 ÷ 4 = R450" },
  { question: "From 55 to 44 present. Percentage decrease?", answer: 20, explanation: "(55−44) ÷ 55 × 100 = 20%" },
  { question: "R14,400 pool. 9 equal shares. How much each (R)?", answer: 1600, explanation: "14,400 ÷ 9 = R1,600" },
  { question: "Attendance 34, then 26. Percentage decrease?", answer: 23.53, explanation: "(34−26) ÷ 34 × 100 ≈ 23.53%" }
];

// EXTREME – Workforce Strategy (multi-step, participation, behaviour trends)
export const extremeQuestions: HRDirectorQuestion[] = [
  { question: "Town has 36 workers. 24 completed tasks. If 6 more complete tasks next week, what is the new participation rate (%)?", answer: 83.33, explanation: "(24+6) ÷ 36 × 100 ≈ 83.33%" },
  { question: "Absenteeism starts at 12%. It increases 4% per week. What is absenteeism in week 2 (%)?", answer: 16, explanation: "12% + 4% = 16%" },
  { question: "42 workers. 30 completed. If 6 more complete, new participation rate (%)?", answer: 85.71, explanation: "(30+6) ÷ 42 × 100 ≈ 85.71%" },
  { question: "Absenteeism 9% week 1, +6% per week. Week 2 absenteeism (%)?", answer: 15, explanation: "9 + 6 = 15%" },
  { question: "55 workers. 38 completed. 8 more complete next week. New participation rate (%)?", answer: 83.64, explanation: "(38+8) ÷ 55 × 100 ≈ 83.64%" },
  { question: "Absenteeism 14% week 1, +3% per week. Week 2 (%)?", answer: 17, explanation: "14 + 3 = 17%" },
  { question: "28 workers. 17 completed. 5 more complete. New participation rate (%)?", answer: 78.57, explanation: "(17+5) ÷ 28 × 100 ≈ 78.57%" },
  { question: "Absenteeism 6% week 1, +4% per week. Week 2 (%)?", answer: 10, explanation: "6 + 4 = 10%" },
  { question: "64 workers. 48 completed. 8 more complete. New participation rate (%)?", answer: 87.5, explanation: "(48+8) ÷ 64 × 100 = 87.5%" },
  { question: "Absenteeism 18% week 1, +4% per week. Week 2 (%)?", answer: 22, explanation: "18 + 4 = 22%" },
  { question: "38 workers. 26 completed. 4 more complete. New participation rate (%)?", answer: 78.95, explanation: "(26+4) ÷ 38 × 100 ≈ 78.95%" },
  { question: "Absenteeism 7% week 1, +5% per week. Week 2 (%)?", answer: 12, explanation: "7 + 5 = 12%" },
  { question: "50 workers. 35 completed. 10 more complete. New participation rate (%)?", answer: 90, explanation: "(35+10) ÷ 50 × 100 = 90%" },
  { question: "Absenteeism 22% week 1, +3% per week. Week 2 (%)?", answer: 25, explanation: "22 + 3 = 25%" },
  { question: "24 workers. 15 completed. 3 more complete. New participation rate (%)?", answer: 75, explanation: "(15+3) ÷ 24 × 100 = 75%" },
  { question: "Absenteeism 10% week 1, +2% per week. Week 2 (%)?", answer: 12, explanation: "10 + 2 = 12%" },
  { question: "58 workers. 46 completed. 6 more complete. New participation rate (%)?", answer: 89.66, explanation: "(46+6) ÷ 58 × 100 ≈ 89.66%" },
  { question: "Absenteeism 13% week 1, +5% per week. Week 2 (%)?", answer: 18, explanation: "13 + 5 = 18%" },
  { question: "52 workers. 39 completed. 7 more complete. New participation rate (%)?", answer: 88.46, explanation: "(39+7) ÷ 52 × 100 ≈ 88.46%" },
  { question: "Absenteeism 8% week 1, +6% per week. Week 2 (%)?", answer: 14, explanation: "8 + 6 = 14%" }
];

export function getHRDirectorQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): HRDirectorQuestion {
  let questions: HRDirectorQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
