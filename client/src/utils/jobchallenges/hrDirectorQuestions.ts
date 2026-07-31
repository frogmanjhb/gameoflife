// HR Director – People Management Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface HRDirectorQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Attendance & Totals (counting, percentages, simple averages)
const easyQuestions: HRDirectorQuestion[] = [
  { question: "Class has 40 students. 34 are present. What percentage attended?", answer: 85, explanation: "34 ÷ 40 × 100 = 85%" },
  { question: "7 students completed 6 tasks each. Total tasks completed?", answer: 42, explanation: "7 × 6 = 42" },
  { question: "48 students. 43 present. Attendance percentage?", answer: 89.58, explanation: "43 ÷ 48 × 100 ≈ 89.58%" },
  { question: "9 students did 3 tasks each. Total tasks?", answer: 27, explanation: "9 × 3 = 27" },
  { question: "Class of 30. 27 attended. What percentage?", answer: 90, explanation: "27 ÷ 30 × 100 = 90%" },
  { question: "8 students completed 5 tasks each. Total tasks?", answer: 40, explanation: "8 × 5 = 40" },
  { question: "50 students. 44 present. Attendance %?", answer: 88, explanation: "44 ÷ 50 × 100 = 88%" },
  { question: "13 students, 2 tasks each. Total tasks completed?", answer: 26, explanation: "13 × 2 = 26" },
  { question: "Class has 35 students. 31 present. What percentage attended?", answer: 88.57, explanation: "31 ÷ 35 × 100 ≈ 88.57%" },
  { question: "6 students completed 8 tasks each. Total tasks?", answer: 48, explanation: "6 × 8 = 48" },
  { question: "56 students. 49 present. Attendance percentage?", answer: 87.5, explanation: "49 ÷ 56 × 100 = 87.5%" },
  { question: "10 students did 5 tasks each. Total tasks?", answer: 50, explanation: "10 × 5 = 50" },
  { question: "Class of 42. 37 attended. What percentage?", answer: 88.1, explanation: "37 ÷ 42 × 100 ≈ 88.10%" },
  { question: "14 students, 3 tasks each. Total tasks completed?", answer: 42, explanation: "14 × 3 = 42" },
  { question: "60 students. 54 present. Attendance %?", answer: 90, explanation: "54 ÷ 60 × 100 = 90%" },
  { question: "5 students completed 9 tasks each. Total tasks?", answer: 45, explanation: "5 × 9 = 45" },
  { question: "Class has 33 students. 29 present. What percentage attended?", answer: 87.88, explanation: "29 ÷ 33 × 100 ≈ 87.88%" },
  { question: "15 students, 4 tasks each. Total tasks?", answer: 60, explanation: "15 × 4 = 60" },
  { question: "72 students. 65 present. Attendance percentage?", answer: 90.28, explanation: "65 ÷ 72 × 100 ≈ 90.28%" },
  { question: "3 students did 11 tasks each. Total tasks completed?", answer: 33, explanation: "3 × 11 = 33" }
];

// MEDIUM – Performance Analysis (averages, comparison, fairness)
const mediumQuestions: HRDirectorQuestion[] = [
  { question: "Team A completed 14, 16, 12, 18 tasks. What is Team A's average?", answer: 15, explanation: "(14+16+12+18) ÷ 4 = 15" },
  { question: "Team B completed 8, 10, 9, 11 tasks. What is Team B's average?", answer: 9.5, explanation: "(8+10+9+11) ÷ 4 = 9.5" },
  { question: "4 students earned bonuses R480, R520, R600, R400. What is the average bonus (R)?", answer: 500, explanation: "(480+520+600+400) ÷ 4 = R500" },
  { question: "Scores: 15, 11, 13, 17. Average?", answer: 14, explanation: "(15+11+13+17) ÷ 4 = 14" },
  { question: "5 workers completed 18, 22, 16, 20, 19 tasks. Average tasks per worker?", answer: 19, explanation: "(18+22+16+20+19) ÷ 5 = 19" },
  { question: "Bonuses R280, R420, R500. Average (R)?", answer: 400, explanation: "(280+420+500) ÷ 3 = R400" },
  { question: "Team completed 11, 13, 12, 14, 10 tasks. Average?", answer: 12, explanation: "(11+13+12+14+10) ÷ 5 = 12" },
  { question: "6 students earned R150, R210, R180, R240, R180, R240. Average bonus (R)?", answer: 200, explanation: "1,200 ÷ 6 = R200" },
  { question: "Attendance counts: 32, 34, 31, 33. Average attendance?", answer: 32.5, explanation: "(32+34+31+33) ÷ 4 = 32.5" },
  { question: "Tasks per person: 6, 7, 5, 8, 6. Average?", answer: 6.4, explanation: "32 ÷ 5 = 6.4" },
  { question: "Team A: 20, 18, 22. Team B: 14, 16, 15. What is Team A's average?", answer: 20, explanation: "(20+18+22) ÷ 3 = 20" },
  { question: "Team A: 20, 18, 22. Team B: 14, 16, 15. What is Team B's average?", answer: 15, explanation: "(14+16+15) ÷ 3 = 15" },
  { question: "Bonuses R800, R600, R700, R900. Average (R)?", answer: 750, explanation: "3,000 ÷ 4 = R750" },
  { question: "Performance scores: 9, 10, 8, 11, 9. Average?", answer: 9.4, explanation: "47 ÷ 5 = 9.4" },
  { question: "7 workers: 21, 18, 24, 19, 22, 20, 16 tasks. Average?", answer: 20, explanation: "140 ÷ 7 = 20" },
  { question: "5 students R400, R500, R450, R550, R500. Average bonus (R)?", answer: 480, explanation: "2,400 ÷ 5 = R480" },
  { question: "Weekly attendance: 35, 33, 37, 34. Average?", answer: 34.75, explanation: "(35+33+37+34) ÷ 4 = 34.75" },
  { question: "Tasks: 7, 8, 6, 9, 7, 8. Average?", answer: 7.5, explanation: "45 ÷ 6 = 7.5" },
  { question: "Team X: 22, 24, 26. What is Team X's average?", answer: 24, explanation: "(22+24+26) ÷ 3 = 24" },
  { question: "Bonuses R650, R850, R750, R950. Average (R)?", answer: 800, explanation: "3,200 ÷ 4 = R800" }
];

// HARD – Resource Allocation (distributing bonuses, proportional reasoning, workload)
const hardQuestions: HRDirectorQuestion[] = [
  { question: "HR has R8,400 bonus pool. 7 students performed equally. How much each (R)?", answer: 1200, explanation: "8,400 ÷ 7 = R1,200" },
  { question: "Attendance dropped from 36 to 27 students. What percentage decrease?", answer: 25, explanation: "(36−27) ÷ 36 × 100 = 25%" },
  { question: "R3,600 bonus pool. 6 equal shares. How much per person (R)?", answer: 600, explanation: "3,600 ÷ 6 = R600" },
  { question: "Attendance went from 45 to 36. Percentage decrease?", answer: 20, explanation: "(45−36) ÷ 45 × 100 = 20%" },
  { question: "R11,200 to share among 8 workers equally. Each gets (R)?", answer: 1400, explanation: "11,200 ÷ 8 = R1,400" },
  { question: "Class size 35, then 28. What percentage decrease?", answer: 20, explanation: "(35−28) ÷ 35 × 100 = 20%" },
  { question: "R6,300 pool. 9 students. Equal share (R)?", answer: 700, explanation: "6,300 ÷ 9 = R700" },
  { question: "Attendance 40, then 30. Percentage decrease?", answer: 25, explanation: "(40−30) ÷ 40 × 100 = 25%" },
  { question: "R5,600 bonus. 8 workers equally. Each (R)?", answer: 700, explanation: "5,600 ÷ 8 = R700" },
  { question: "From 50 to 40 present. Percentage decrease?", answer: 20, explanation: "(50−40) ÷ 50 × 100 = 20%" },
  { question: "R3,750 pool. 5 equal shares. Per person (R)?", answer: 750, explanation: "3,750 ÷ 5 = R750" },
  { question: "Attendance 56, then 42. Percentage decrease?", answer: 25, explanation: "(56−42) ÷ 56 × 100 = 25%" },
  { question: "R9,800 among 7 workers. Each gets (R)?", answer: 1400, explanation: "9,800 ÷ 7 = R1,400" },
  { question: "From 32 to 24 students. Percentage decrease?", answer: 25, explanation: "(32−24) ÷ 32 × 100 = 25%" },
  { question: "R12,000 pool. 8 equal. Per person (R)?", answer: 1500, explanation: "12,000 ÷ 8 = R1,500" },
  { question: "Attendance 28, then 21. Percentage decrease?", answer: 25, explanation: "(28−21) ÷ 28 × 100 = 25%" },
  { question: "R2,160 bonus. 6 workers. Each (R)?", answer: 360, explanation: "2,160 ÷ 6 = R360" },
  { question: "From 60 to 48 present. Percentage decrease?", answer: 20, explanation: "(60−48) ÷ 60 × 100 = 20%" },
  { question: "R15,300 pool. 9 equal shares. How much each (R)?", answer: 1700, explanation: "15,300 ÷ 9 = R1,700" },
  { question: "Attendance 39, then 30. Percentage decrease?", answer: 23.08, explanation: "(39−30) ÷ 39 × 100 ≈ 23.08%" }
];

// EXTREME – Workforce Strategy (multi-step, participation, behaviour trends)
const extremeQuestions: HRDirectorQuestion[] = [
  { question: "Town has 48 workers. 32 completed tasks. If 8 more complete tasks next week, what is the new participation rate (%)?", answer: 83.33, explanation: "(32+8) ÷ 48 × 100 ≈ 83.33%" },
  { question: "Absenteeism starts at 11%. It increases 5% per week. What is absenteeism in week 2 (%)?", answer: 16, explanation: "11% + 5% = 16%" },
  { question: "40 workers. 28 completed. If 4 more complete, new participation rate (%)?", answer: 80, explanation: "(28+4) ÷ 40 × 100 = 80%" },
  { question: "Absenteeism 15% week 1, +4% per week. Week 2 absenteeism (%)?", answer: 19, explanation: "15 + 4 = 19%" },
  { question: "60 workers. 42 completed. 6 more complete next week. New participation rate (%)?", answer: 80, explanation: "(42+6) ÷ 60 × 100 = 80%" },
  { question: "Absenteeism 9% week 1, +3% per week. Week 2 (%)?", answer: 12, explanation: "9 + 3 = 12%" },
  { question: "35 workers. 21 completed. 7 more complete. New participation rate (%)?", answer: 80, explanation: "(21+7) ÷ 35 × 100 = 80%" },
  { question: "Absenteeism 16% week 1, +2% per week. Week 2 (%)?", answer: 18, explanation: "16 + 2 = 18%" },
  { question: "44 workers. 33 completed. 5 more complete. New participation rate (%)?", answer: 86.36, explanation: "(33+5) ÷ 44 × 100 ≈ 86.36%" },
  { question: "Absenteeism 20% week 1, +4% per week. Week 2 (%)?", answer: 24, explanation: "20 + 4 = 24%" },
  { question: "32 workers. 20 completed. 4 more complete. New participation rate (%)?", answer: 75, explanation: "(20+4) ÷ 32 × 100 = 75%" },
  { question: "Absenteeism 5% week 1, +7% per week. Week 2 (%)?", answer: 12, explanation: "5 + 7 = 12%" },
  { question: "56 workers. 42 completed. 7 more complete. New participation rate (%)?", answer: 87.5, explanation: "(42+7) ÷ 56 × 100 = 87.5%" },
  { question: "Absenteeism 11% week 1, +6% per week. Week 2 (%)?", answer: 17, explanation: "11 + 6 = 17%" },
  { question: "30 workers. 18 completed. 6 more complete. New participation rate (%)?", answer: 80, explanation: "(18+6) ÷ 30 × 100 = 80%" },
  { question: "Absenteeism 19% week 1, +3% per week. Week 2 (%)?", answer: 22, explanation: "19 + 3 = 22%" },
  { question: "46 workers. 34 completed. 5 more complete. New participation rate (%)?", answer: 84.78, explanation: "(34+5) ÷ 46 × 100 ≈ 84.78%" },
  { question: "Absenteeism 8% week 1, +4% per week. Week 2 (%)?", answer: 12, explanation: "8 + 4 = 12%" },
  { question: "54 workers. 41 completed. 4 more complete. New participation rate (%)?", answer: 83.33, explanation: "(41+4) ÷ 54 × 100 ≈ 83.33%" },
  { question: "Absenteeism 17% week 1, +5% per week. Week 2 (%)?", answer: 22, explanation: "17 + 5 = 22%" }
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
