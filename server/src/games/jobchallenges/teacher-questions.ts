// Teacher – Learning Support Challenge (Teaching Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface TeacherQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Marking & Totals (percentage from score, averages)
export const easyQuestions: TeacherQuestion[] = [
  { question: "A test is out of 50. Learner scores 35. What percentage is that?", answer: 70, explanation: "35 ÷ 50 × 100 = 70%" },
  { question: "5 learners scored: 40, 45, 30, 50, 35. What is the average?", answer: 40, explanation: "(40+45+30+50+35) ÷ 5 = 40" },
  { question: "Test out of 40. Learner scores 32. What percentage?", answer: 80, explanation: "32 ÷ 40 × 100 = 80%" },
  { question: "4 learners scored: 60, 70, 80, 90. What is the average?", answer: 75, explanation: "(60+70+80+90) ÷ 4 = 75" },
  { question: "Test out of 25. Learner scores 20. What percentage?", answer: 80, explanation: "20 ÷ 25 × 100 = 80%" },
  { question: "6 learners scored: 50, 55, 60, 65, 70, 75. What is the average?", answer: 62.5, explanation: "375 ÷ 6 = 62.5" },
  { question: "Test out of 60. Learner scores 45. What percentage?", answer: 75, explanation: "45 ÷ 60 × 100 = 75%" },
  { question: "3 learners scored: 80, 85, 90. What is the average?", answer: 85, explanation: "255 ÷ 3 = 85" },
  { question: "Test out of 20. Learner scores 18. What percentage?", answer: 90, explanation: "18 ÷ 20 × 100 = 90%" },
  { question: "5 learners scored: 70, 72, 74, 76, 78. What is the average?", answer: 74, explanation: "370 ÷ 5 = 74" },
  { question: "Test out of 100. Learner scores 65. What percentage?", answer: 65, explanation: "65 ÷ 100 × 100 = 65%" },
  { question: "4 learners scored: 25, 30, 35, 40. What is the average?", answer: 32.5, explanation: "130 ÷ 4 = 32.5" },
  { question: "Test out of 30. Learner scores 24. What percentage?", answer: 80, explanation: "24 ÷ 30 × 100 = 80%" },
  { question: "5 learners scored: 10, 20, 30, 40, 50. What is the average?", answer: 30, explanation: "150 ÷ 5 = 30" },
  { question: "Test out of 80. Learner scores 56. What percentage?", answer: 70, explanation: "56 ÷ 80 × 100 = 70%" },
  { question: "6 learners scored: 42, 44, 46, 48, 50, 52. What is the average?", answer: 47, explanation: "282 ÷ 6 = 47" },
  { question: "Test out of 45. Learner scores 36. What percentage?", answer: 80, explanation: "36 ÷ 45 × 100 = 80%" },
  { question: "3 learners scored: 60, 70, 80. What is the average?", answer: 70, explanation: "210 ÷ 3 = 70" },
  { question: "Test out of 15. Learner scores 12. What percentage?", answer: 80, explanation: "12 ÷ 15 × 100 = 80%" },
  { question: "4 learners scored: 55, 60, 65, 70. What is the average?", answer: 62.5, explanation: "250 ÷ 4 = 62.5" }
];

// MEDIUM – Grouping & Planning (groups, % of lesson time)
export const mediumQuestions: TeacherQuestion[] = [
  { question: "24 learners. Teacher wants groups of 4. How many groups?", answer: 6, explanation: "24 ÷ 4 = 6 groups" },
  { question: "Lesson = 60 minutes. 10 minutes intro, 40 minutes activity. What percentage of lesson is activity?", answer: 66.67, explanation: "40 ÷ 60 × 100 ≈ 66.67%" },
  { question: "30 learners. Groups of 5. How many groups?", answer: 6, explanation: "30 ÷ 5 = 6" },
  { question: "45-minute lesson. 15 min intro, 25 min activity. What percentage is activity?", answer: 55.56, explanation: "25 ÷ 45 × 100 ≈ 55.56%" },
  { question: "20 learners. Groups of 4. How many groups?", answer: 5, explanation: "20 ÷ 4 = 5" },
  { question: "50-minute lesson. 5 min intro, 35 min activity. What percentage is activity?", answer: 70, explanation: "35 ÷ 50 × 100 = 70%" },
  { question: "28 learners. Groups of 7. How many groups?", answer: 4, explanation: "28 ÷ 7 = 4" },
  { question: "40-minute lesson. 10 min intro, 20 min activity. What percentage is activity?", answer: 50, explanation: "20 ÷ 40 × 100 = 50%" },
  { question: "18 learners. Groups of 3. How many groups?", answer: 6, explanation: "18 ÷ 3 = 6" },
  { question: "60-minute lesson. 12 min intro, 36 min activity. What percentage is activity?", answer: 60, explanation: "36 ÷ 60 × 100 = 60%" },
  { question: "32 learners. Groups of 8. How many groups?", answer: 4, explanation: "32 ÷ 8 = 4" },
  { question: "45-minute lesson. 9 min intro, 27 min activity. What percentage is activity?", answer: 60, explanation: "27 ÷ 45 × 100 = 60%" },
  { question: "27 learners. Groups of 9. How many groups?", answer: 3, explanation: "27 ÷ 9 = 3" },
  { question: "30-minute lesson. 6 min intro, 18 min activity. What percentage is activity?", answer: 60, explanation: "18 ÷ 30 × 100 = 60%" },
  { question: "36 learners. Groups of 6. How many groups?", answer: 6, explanation: "36 ÷ 6 = 6" },
  { question: "55-minute lesson. 10 min intro, 40 min activity. What percentage is activity?", answer: 72.73, explanation: "40 ÷ 55 × 100 ≈ 72.73%" },
  { question: "21 learners. Groups of 7. How many groups?", answer: 3, explanation: "21 ÷ 7 = 3" },
  { question: "50-minute lesson. 5 min intro, 40 min activity. What percentage is activity?", answer: 80, explanation: "40 ÷ 50 × 100 = 80%" },
  { question: "16 learners. Groups of 4. How many groups?", answer: 4, explanation: "16 ÷ 4 = 4" },
  { question: "60-minute lesson. 15 min intro, 30 min activity. What percentage is activity?", answer: 50, explanation: "30 ÷ 60 × 100 = 50%" }
];

// HARD – Improvement Tracking (% improvement, total increase)
export const hardQuestions: TeacherQuestion[] = [
  { question: "Learner scored 60% in Term 1. Now 75%. What is percentage improvement?", answer: 25, explanation: "(75-60)/60 × 100 = 25%" },
  { question: "Class average increased from 65% to 72%. How much total increase (percentage points)?", answer: 7, explanation: "72 - 65 = 7 percentage points" },
  { question: "Learner scored 50% in Term 1. Now 60%. What is percentage improvement?", answer: 20, explanation: "(60-50)/50 × 100 = 20%" },
  { question: "Class average went from 70% to 77%. Total increase in percentage points?", answer: 7, explanation: "77 - 70 = 7" },
  { question: "Learner scored 40% in Term 1. Now 50%. What is percentage improvement?", answer: 25, explanation: "(50-40)/40 × 100 = 25%" },
  { question: "Class average increased from 55% to 66%. Total increase?", answer: 11, explanation: "66 - 55 = 11" },
  { question: "Learner scored 80% in Term 1. Now 88%. What is percentage improvement?", answer: 10, explanation: "(88-80)/80 × 100 = 10%" },
  { question: "Class average went from 60% to 72%. Total increase?", answer: 12, explanation: "72 - 60 = 12" },
  { question: "Learner scored 45% in Term 1. Now 54%. What is percentage improvement?", answer: 20, explanation: "(54-45)/45 × 100 = 20%" },
  { question: "Class average increased from 50% to 60%. Total increase?", answer: 10, explanation: "60 - 50 = 10" },
  { question: "Learner scored 70% in Term 1. Now 84%. What is percentage improvement?", answer: 20, explanation: "(84-70)/70 × 100 = 20%" },
  { question: "Class average went from 65% to 78%. Total increase?", answer: 13, explanation: "78 - 65 = 13" },
  { question: "Learner scored 55% in Term 1. Now 66%. What is percentage improvement?", answer: 20, explanation: "(66-55)/55 × 100 = 20%" },
  { question: "Class average increased from 72% to 81%. Total increase?", answer: 9, explanation: "81 - 72 = 9" },
  { question: "Learner scored 30% in Term 1. Now 39%. What is percentage improvement?", answer: 30, explanation: "(39-30)/30 × 100 = 30%" },
  { question: "Class average went from 58% to 69.6%. Total increase?", answer: 11.6, explanation: "69.6 - 58 = 11.6" },
  { question: "Learner scored 90% in Term 1. Now 99%. What is percentage improvement?", answer: 10, explanation: "(99-90)/90 × 100 = 10%" },
  { question: "Class average increased from 40% to 52%. Total increase?", answer: 12, explanation: "52 - 40 = 12" },
  { question: "Learner scored 35% in Term 1. Now 42%. What is percentage improvement?", answer: 20, explanation: "(42-35)/35 × 100 = 20%" },
  { question: "Class average went from 75% to 84%. Total increase?", answer: 9, explanation: "84 - 75 = 9" }
];

// EXTREME – Differentiation & Support (% need support, total support time)
export const extremeQuestions: TeacherQuestion[] = [
  { question: "30 learners. 20 passed. 10 need support. What percentage need support?", answer: 33.33, explanation: "10 ÷ 30 × 100 ≈ 33.33%" },
  { question: "Teacher spends 15 minutes per struggling learner. 8 learners need support. How long total support time (minutes)?", answer: 120, explanation: "15 × 8 = 120 minutes" },
  { question: "25 learners. 5 need support. What percentage need support?", answer: 20, explanation: "5 ÷ 25 × 100 = 20%" },
  { question: "10 minutes per learner. 6 learners need support. Total support time (minutes)?", answer: 60, explanation: "10 × 6 = 60" },
  { question: "40 learners. 12 need support. What percentage need support?", answer: 30, explanation: "12 ÷ 40 × 100 = 30%" },
  { question: "20 minutes per learner. 5 learners need support. Total support time (minutes)?", answer: 100, explanation: "20 × 5 = 100" },
  { question: "35 learners. 7 need support. What percentage need support?", answer: 20, explanation: "7 ÷ 35 × 100 = 20%" },
  { question: "12 minutes per learner. 10 learners need support. Total support time (minutes)?", answer: 120, explanation: "12 × 10 = 120" },
  { question: "50 learners. 15 need support. What percentage need support?", answer: 30, explanation: "15 ÷ 50 × 100 = 30%" },
  { question: "18 minutes per learner. 4 learners need support. Total support time (minutes)?", answer: 72, explanation: "18 × 4 = 72" },
  { question: "28 learners. 14 need support. What percentage need support?", answer: 50, explanation: "14 ÷ 28 × 100 = 50%" },
  { question: "25 minutes per learner. 3 learners need support. Total support time (minutes)?", answer: 75, explanation: "25 × 3 = 75" },
  { question: "32 learners. 8 need support. What percentage need support?", answer: 25, explanation: "8 ÷ 32 × 100 = 25%" },
  { question: "15 minutes per learner. 7 learners need support. Total support time (minutes)?", answer: 105, explanation: "15 × 7 = 105" },
  { question: "45 learners. 9 need support. What percentage need support?", answer: 20, explanation: "9 ÷ 45 × 100 = 20%" },
  { question: "20 minutes per learner. 6 learners need support. Total support time (minutes)?", answer: 120, explanation: "20 × 6 = 120" },
  { question: "24 learners. 6 need support. What percentage need support?", answer: 25, explanation: "6 ÷ 24 × 100 = 25%" },
  { question: "8 minutes per learner. 9 learners need support. Total support time (minutes)?", answer: 72, explanation: "8 × 9 = 72" },
  { question: "36 learners. 12 need support. What percentage need support?", answer: 33.33, explanation: "12 ÷ 36 × 100 ≈ 33.33%" },
  { question: "Teacher spends 10 minutes per struggling learner. There are 5 learners. How long total support time (minutes)?", answer: 50, explanation: "10 × 5 = 50" }
];

export function getTeacherQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): TeacherQuestion {
  let questions: TeacherQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
