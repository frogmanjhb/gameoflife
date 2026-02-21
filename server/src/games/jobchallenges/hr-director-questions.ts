// HR Director – People Management Challenge (HR Review Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface HRDirectorQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Attendance & Totals (counting, percentages, simple averages)
export const easyQuestions: HRDirectorQuestion[] = [
  { question: "Class has 25 students. 22 are present. What percentage attended?", answer: 88, explanation: "22 ÷ 25 × 100 = 88%" },
  { question: "5 students completed 4 tasks each. Total tasks completed?", answer: 20, explanation: "5 × 4 = 20" },
  { question: "30 students. 27 present. Attendance percentage?", answer: 90, explanation: "27 ÷ 30 × 100 = 90%" },
  { question: "6 students did 3 tasks each. Total tasks?", answer: 18, explanation: "6 × 3 = 18" },
  { question: "Class of 20. 18 attended. What percentage?", answer: 90, explanation: "18 ÷ 20 × 100 = 90%" },
  { question: "4 students completed 5 tasks each. Total tasks?", answer: 20, explanation: "4 × 5 = 20" },
  { question: "40 students. 36 present. Attendance %?", answer: 90, explanation: "36 ÷ 40 × 100 = 90%" },
  { question: "8 students, 2 tasks each. Total tasks completed?", answer: 16, explanation: "8 × 2 = 16" },
  { question: "Class has 24 students. 21 present. What percentage attended?", answer: 87.5, explanation: "21 ÷ 24 × 100 = 87.5%" },
  { question: "10 students completed 6 tasks each. Total tasks?", answer: 60, explanation: "10 × 6 = 60" },
  { question: "50 students. 45 present. Attendance percentage?", answer: 90, explanation: "45 ÷ 50 × 100 = 90%" },
  { question: "3 students did 7 tasks each. Total tasks?", answer: 21, explanation: "3 × 7 = 21" },
  { question: "Class of 28. 25 attended. What percentage?", answer: 89.3, explanation: "25 ÷ 28 × 100 ≈ 89.3%" },
  { question: "7 students, 4 tasks each. Total tasks completed?", answer: 28, explanation: "7 × 4 = 28" },
  { question: "35 students. 31 present. Attendance %?", answer: 88.6, explanation: "31 ÷ 35 × 100 ≈ 88.6%" },
  { question: "9 students completed 5 tasks each. Total tasks?", answer: 45, explanation: "9 × 5 = 45" },
  { question: "Class has 22 students. 20 present. What percentage attended?", answer: 90.9, explanation: "20 ÷ 22 × 100 ≈ 90.9%" },
  { question: "12 students, 3 tasks each. Total tasks?", answer: 36, explanation: "12 × 3 = 36" },
  { question: "60 students. 54 present. Attendance percentage?", answer: 90, explanation: "54 ÷ 60 × 100 = 90%" },
  { question: "5 students did 8 tasks each. Total tasks completed?", answer: 40, explanation: "5 × 8 = 40" }
];

// MEDIUM – Performance Analysis (averages, comparison, fairness)
export const mediumQuestions: HRDirectorQuestion[] = [
  { question: "Team A completed 8, 9, 7, 6 tasks. What is Team A's average?", answer: 7.5, explanation: "(8+9+7+6) ÷ 4 = 7.5" },
  { question: "Team B completed 5, 6, 5, 7 tasks. What is Team B's average?", answer: 5.75, explanation: "(5+6+5+7) ÷ 4 = 5.75" },
  { question: "3 students earned bonuses R500, R600, R700. What is the average bonus (R)?", answer: 600, explanation: "(500+600+700) ÷ 3 = R600" },
  { question: "Scores: 10, 8, 9, 7. Average?", answer: 8.5, explanation: "(10+8+9+7) ÷ 4 = 8.5" },
  { question: "4 workers completed 12, 14, 10, 16 tasks. Average tasks per worker?", answer: 13, explanation: "(12+14+10+16) ÷ 4 = 13" },
  { question: "Bonuses R200, R300, R400. Average (R)?", answer: 300, explanation: "(200+300+400) ÷ 3 = R300" },
  { question: "Team completed 6, 8, 7, 9, 5 tasks. Average?", answer: 7, explanation: "(6+8+7+9+5) ÷ 5 = 7" },
  { question: "5 students earned R100, R150, R200, R150, R200. Average bonus (R)?", answer: 160, explanation: "800 ÷ 5 = R160" },
  { question: "Attendance counts: 22, 24, 23, 21. Average attendance?", answer: 22.5, explanation: "(22+24+23+21) ÷ 4 = 22.5" },
  { question: "Tasks per person: 4, 5, 6, 4, 6. Average?", answer: 5, explanation: "25 ÷ 5 = 5" },
  { question: "Team A: 10, 12, 11. Team B: 9, 10, 11. What is Team A's average?", answer: 11, explanation: "(10+12+11) ÷ 3 = 11" },
  { question: "Team A: 10, 12, 11. Team B: 9, 10, 11. What is Team B's average?", answer: 10, explanation: "(9+10+11) ÷ 3 = 10" },
  { question: "Bonuses R400, R500, R600, R500. Average (R)?", answer: 500, explanation: "2000 ÷ 4 = R500" },
  { question: "Performance scores: 7, 8, 9, 8, 8. Average?", answer: 8, explanation: "40 ÷ 5 = 8" },
  { question: "6 workers: 15, 18, 12, 20, 14, 17 tasks. Average?", answer: 16, explanation: "96 ÷ 6 = 16" },
  { question: "4 students R250, R350, R250, R350. Average bonus (R)?", answer: 300, explanation: "1200 ÷ 4 = R300" },
  { question: "Weekly attendance: 28, 26, 30, 28. Average?", answer: 28, explanation: "112 ÷ 4 = 28" },
  { question: "Tasks: 3, 4, 5, 3, 5, 4. Average?", answer: 4, explanation: "24 ÷ 6 = 4" },
  { question: "Team X: 14, 16, 15. What is Team X's average?", answer: 15, explanation: "(14+16+15) ÷ 3 = 15" },
  { question: "Bonuses R600, R800, R700, R900. Average (R)?", answer: 750, explanation: "3000 ÷ 4 = R750" }
];

// HARD – Resource Allocation (distributing bonuses, proportional reasoning, workload)
export const hardQuestions: HRDirectorQuestion[] = [
  { question: "HR has R5,000 bonus pool. 5 students performed equally. How much each (R)?", answer: 1000, explanation: "5,000 ÷ 5 = R1,000" },
  { question: "Attendance dropped from 24 to 20 students. What percentage decrease?", answer: 16.67, explanation: "(24−20) ÷ 24 × 100 ≈ 16.67%" },
  { question: "R3,600 bonus pool. 6 equal shares. How much per person (R)?", answer: 600, explanation: "3,600 ÷ 6 = R600" },
  { question: "Attendance went from 30 to 24. Percentage decrease?", answer: 20, explanation: "(30−24) ÷ 30 × 100 = 20%" },
  { question: "R8,000 to share among 8 workers equally. Each gets (R)?", answer: 1000, explanation: "8,000 ÷ 8 = R1,000" },
  { question: "Class size 25, then 20. What percentage decrease?", answer: 20, explanation: "(25−20) ÷ 25 × 100 = 20%" },
  { question: "R4,500 pool. 9 students. Equal share (R)?", answer: 500, explanation: "4,500 ÷ 9 = R500" },
  { question: "Attendance 28, then 21. Percentage decrease?", answer: 25, explanation: "(28−21) ÷ 28 × 100 = 25%" },
  { question: "R6,000 bonus. 4 workers equally. Each (R)?", answer: 1500, explanation: "6,000 ÷ 4 = R1,500" },
  { question: "From 32 to 24 present. Percentage decrease?", answer: 25, explanation: "(32−24) ÷ 32 × 100 = 25%" },
  { question: "R2,000 pool. 5 equal shares. Per person (R)?", answer: 400, explanation: "2,000 ÷ 5 = R400" },
  { question: "Attendance 40, then 30. Percentage decrease?", answer: 25, explanation: "(40−30) ÷ 40 × 100 = 25%" },
  { question: "R7,500 among 5 workers. Each gets (R)?", answer: 1500, explanation: "7,500 ÷ 5 = R1,500" },
  { question: "From 36 to 27 students. Percentage decrease?", answer: 25, explanation: "(36−27) ÷ 36 × 100 = 25%" },
  { question: "R9,000 pool. 6 equal. Per person (R)?", answer: 1500, explanation: "9,000 ÷ 6 = R1,500" },
  { question: "Attendance 22, then 18. Percentage decrease?", answer: 18.18, explanation: "(22−18) ÷ 22 × 100 ≈ 18.18%" },
  { question: "R1,500 bonus. 3 workers. Each (R)?", answer: 500, explanation: "1,500 ÷ 3 = R500" },
  { question: "From 50 to 40 present. Percentage decrease?", answer: 20, explanation: "(50−40) ÷ 50 × 100 = 20%" },
  { question: "R12,000 pool. 8 equal shares. How much each (R)?", answer: 1500, explanation: "12,000 ÷ 8 = R1,500" },
  { question: "Attendance 26, then 20. Percentage decrease?", answer: 23.08, explanation: "(26−20) ÷ 26 × 100 ≈ 23.08%" }
];

// EXTREME – Workforce Strategy (multi-step, participation, behaviour trends)
export const extremeQuestions: HRDirectorQuestion[] = [
  { question: "Town has 30 workers. 20 completed tasks. If 5 more complete tasks next week, what is the new participation rate (%)?", answer: 83.33, explanation: "(20+5) ÷ 30 × 100 ≈ 83.33%" },
  { question: "Absenteeism starts at 10%. It increases 5% per week. What is absenteeism in week 2 (%)?", answer: 15, explanation: "10% + 5% = 15%" },
  { question: "40 workers. 28 completed. If 4 more complete, new participation rate (%)?", answer: 80, explanation: "(28+4) ÷ 40 × 100 = 80%" },
  { question: "Absenteeism 8% week 1, +4% per week. Week 2 absenteeism (%)?", answer: 12, explanation: "8 + 4 = 12%" },
  { question: "50 workers. 35 completed. 10 more complete next week. New participation rate (%)?", answer: 90, explanation: "(35+10) ÷ 50 × 100 = 90%" },
  { question: "Absenteeism 12% week 1, +3% per week. Week 2 (%)?", answer: 15, explanation: "12 + 3 = 15%" },
  { question: "25 workers. 15 completed. 5 more complete. New participation rate (%)?", answer: 80, explanation: "(15+5) ÷ 25 × 100 = 80%" },
  { question: "Absenteeism 5% week 1, +5% per week. Week 2 (%)?", answer: 10, explanation: "5 + 5 = 10%" },
  { question: "60 workers. 45 completed. 9 more complete. New participation rate (%)?", answer: 90, explanation: "(45+9) ÷ 60 × 100 = 90%" },
  { question: "Absenteeism 15% week 1, +5% per week. Week 2 (%)?", answer: 20, explanation: "15 + 5 = 20%" },
  { question: "35 workers. 21 completed. 7 more complete. New participation rate (%)?", answer: 80, explanation: "(21+7) ÷ 35 × 100 = 80%" },
  { question: "Absenteeism 6% week 1, +4% per week. Week 2 (%)?", answer: 10, explanation: "6 + 4 = 10%" },
  { question: "45 workers. 30 completed. 6 more complete. New participation rate (%)?", answer: 80, explanation: "(30+6) ÷ 45 × 100 = 80%" },
  { question: "Absenteeism 20% week 1, +5% per week. Week 2 (%)?", answer: 25, explanation: "20 + 5 = 25%" },
  { question: "20 workers. 12 completed. 4 more complete. New participation rate (%)?", answer: 80, explanation: "(12+4) ÷ 20 × 100 = 80%" },
  { question: "Absenteeism 9% week 1, +3% per week. Week 2 (%)?", answer: 12, explanation: "9 + 3 = 12%" },
  { question: "55 workers. 44 completed. 6 more complete. New participation rate (%)?", answer: 90.91, explanation: "(44+6) ÷ 55 × 100 ≈ 90.91%" },
  { question: "Absenteeism 11% week 1, +4% per week. Week 2 (%)?", answer: 15, explanation: "11 + 4 = 15%" },
  { question: "48 workers. 36 completed. 8 more complete. New participation rate (%)?", answer: 91.67, explanation: "(36+8) ÷ 48 × 100 ≈ 91.67%" },
  { question: "Absenteeism 7% week 1, +5% per week. Week 2 (%)?", answer: 12, explanation: "7 + 5 = 12%" },
  { question: "70 workers. 49 completed. 14 more complete. New participation rate (%)?", answer: 90, explanation: "(49+14) ÷ 70 × 100 = 90%" }
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
