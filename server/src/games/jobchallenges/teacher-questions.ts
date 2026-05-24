// Teacher – Learning Support Challenge (Teaching Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface TeacherQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Marking & Totals (percentage from score, averages)
export const easyQuestions: TeacherQuestion[] = [
  { question: "A test is out of 40. Learner scores 34. What percentage is that?", answer: 85, explanation: "34 ÷ 40 × 100 = 85%" },
  { question: "5 learners scored: 52, 48, 44, 56, 40. What is the average?", answer: 48, explanation: "(52+48+44+56+40) ÷ 5 = 48" },
  { question: "Test out of 35. Learner scores 28. What percentage?", answer: 80, explanation: "28 ÷ 35 × 100 = 80%" },
  { question: "4 learners scored: 65, 75, 85, 95. What is the average?", answer: 80, explanation: "(65+75+85+95) ÷ 4 = 80" },
  { question: "Test out of 55. Learner scores 44. What percentage?", answer: 80, explanation: "44 ÷ 55 × 100 = 80%" },
  { question: "6 learners scored: 58, 62, 66, 70, 74, 78. What is the average?", answer: 68, explanation: "408 ÷ 6 = 68" },
  { question: "Test out of 75. Learner scores 60. What percentage?", answer: 80, explanation: "60 ÷ 75 × 100 = 80%" },
  { question: "3 learners scored: 72, 78, 84. What is the average?", answer: 78, explanation: "234 ÷ 3 = 78" },
  { question: "Test out of 24. Learner scores 21. What percentage?", answer: 87.5, explanation: "21 ÷ 24 × 100 = 87.5%" },
  { question: "5 learners scored: 68, 71, 74, 77, 80. What is the average?", answer: 74, explanation: "370 ÷ 5 = 74" },
  { question: "Test out of 90. Learner scores 72. What percentage?", answer: 80, explanation: "72 ÷ 90 × 100 = 80%" },
  { question: "4 learners scored: 28, 32, 36, 40. What is the average?", answer: 34, explanation: "136 ÷ 4 = 34" },
  { question: "Test out of 32. Learner scores 28. What percentage?", answer: 87.5, explanation: "28 ÷ 32 × 100 = 87.5%" },
  { question: "5 learners scored: 15, 25, 35, 45, 55. What is the average?", answer: 35, explanation: "175 ÷ 5 = 35" },
  { question: "Test out of 64. Learner scores 48. What percentage?", answer: 75, explanation: "48 ÷ 64 × 100 = 75%" },
  { question: "6 learners scored: 46, 49, 52, 55, 58, 61. What is the average?", answer: 53.5, explanation: "321 ÷ 6 = 53.5" },
  { question: "Test out of 48. Learner scores 42. What percentage?", answer: 87.5, explanation: "42 ÷ 48 × 100 = 87.5%" },
  { question: "3 learners scored: 55, 65, 75. What is the average?", answer: 65, explanation: "195 ÷ 3 = 65" },
  { question: "Test out of 18. Learner scores 15. What percentage?", answer: 83.33, explanation: "15 ÷ 18 × 100 ≈ 83.33%" },
  { question: "4 learners scored: 62, 68, 74, 80. What is the average?", answer: 71, explanation: "284 ÷ 4 = 71" }
];

// MEDIUM – Grouping & Planning (groups, % of lesson time)
export const mediumQuestions: TeacherQuestion[] = [
  { question: "28 learners. Teacher wants groups of 7. How many groups?", answer: 4, explanation: "28 ÷ 7 = 4 groups" },
  { question: "Lesson = 50 minutes. 8 minutes intro, 32 minutes activity. What percentage of lesson is activity?", answer: 64, explanation: "32 ÷ 50 × 100 = 64%" },
  { question: "33 learners. Groups of 11. How many groups?", answer: 3, explanation: "33 ÷ 11 = 3" },
  { question: "55-minute lesson. 10 min intro, 35 min activity. What percentage is activity?", answer: 63.64, explanation: "35 ÷ 55 × 100 ≈ 63.64%" },
  { question: "22 learners. Groups of 11. How many groups?", answer: 2, explanation: "22 ÷ 11 = 2" },
  { question: "48-minute lesson. 8 min intro, 32 min activity. What percentage is activity?", answer: 66.67, explanation: "32 ÷ 48 × 100 ≈ 66.67%" },
  { question: "35 learners. Groups of 5. How many groups?", answer: 7, explanation: "35 ÷ 5 = 7" },
  { question: "42-minute lesson. 7 min intro, 28 min activity. What percentage is activity?", answer: 66.67, explanation: "28 ÷ 42 × 100 ≈ 66.67%" },
  { question: "26 learners. Groups of 13. How many groups?", answer: 2, explanation: "26 ÷ 13 = 2" },
  { question: "54-minute lesson. 9 min intro, 36 min activity. What percentage is activity?", answer: 66.67, explanation: "36 ÷ 54 × 100 ≈ 66.67%" },
  { question: "40 learners. Groups of 10. How many groups?", answer: 4, explanation: "40 ÷ 10 = 4" },
  { question: "36-minute lesson. 6 min intro, 24 min activity. What percentage is activity?", answer: 66.67, explanation: "24 ÷ 36 × 100 ≈ 66.67%" },
  { question: "39 learners. Groups of 13. How many groups?", answer: 3, explanation: "39 ÷ 13 = 3" },
  { question: "45-minute lesson. 5 min intro, 30 min activity. What percentage is activity?", answer: 66.67, explanation: "30 ÷ 45 × 100 ≈ 66.67%" },
  { question: "44 learners. Groups of 4. How many groups?", answer: 11, explanation: "44 ÷ 4 = 11" },
  { question: "52-minute lesson. 13 min intro, 26 min activity. What percentage is activity?", answer: 50, explanation: "26 ÷ 52 × 100 = 50%" },
  { question: "30 learners. Groups of 6. How many groups?", answer: 5, explanation: "30 ÷ 6 = 5" },
  { question: "58-minute lesson. 8 min intro, 40 min activity. What percentage is activity?", answer: 68.97, explanation: "40 ÷ 58 × 100 ≈ 68.97%" },
  { question: "18 learners. Groups of 6. How many groups?", answer: 3, explanation: "18 ÷ 6 = 3" },
  { question: "60-minute lesson. 12 min intro, 42 min activity. What percentage is activity?", answer: 70, explanation: "42 ÷ 60 × 100 = 70%" }
];

// HARD – Improvement Tracking (% improvement, total increase)
export const hardQuestions: TeacherQuestion[] = [
  { question: "Learner scored 52% in Term 1. Now 65%. What is percentage improvement?", answer: 25, explanation: "(65-52)/52 × 100 = 25%" },
  { question: "Class average increased from 68% to 76%. How much total increase (percentage points)?", answer: 8, explanation: "76 - 68 = 8 percentage points" },
  { question: "Learner scored 45% in Term 1. Now 54%. What is percentage improvement?", answer: 20, explanation: "(54-45)/45 × 100 = 20%" },
  { question: "Class average went from 62% to 71%. Total increase in percentage points?", answer: 9, explanation: "71 - 62 = 9" },
  { question: "Learner scored 38% in Term 1. Now 47.5%. What is percentage improvement?", answer: 25, explanation: "(47.5-38)/38 × 100 = 25%" },
  { question: "Class average increased from 54% to 64.8%. Total increase?", answer: 10.8, explanation: "64.8 - 54 = 10.8" },
  { question: "Learner scored 76% in Term 1. Now 85.6%. What is percentage improvement?", answer: 12.63, explanation: "(85.6-76)/76 × 100 = 12.63%" },
  { question: "Class average went from 58% to 69.6%. Total increase?", answer: 11.6, explanation: "69.6 - 58 = 11.6" },
  { question: "Learner scored 48% in Term 1. Now 60%. What is percentage improvement?", answer: 25, explanation: "(60-48)/48 × 100 = 25%" },
  { question: "Class average increased from 71% to 78%. Total increase?", answer: 7, explanation: "78 - 71 = 7" },
  { question: "Learner scored 64% in Term 1. Now 76.8%. What is percentage improvement?", answer: 20, explanation: "(76.8-64)/64 × 100 = 20%" },
  { question: "Class average went from 66% to 79.2%. Total increase?", answer: 13.2, explanation: "79.2 - 66 = 13.2" },
  { question: "Learner scored 42% in Term 1. Now 52.5%. What is percentage improvement?", answer: 25, explanation: "(52.5-42)/42 × 100 = 25%" },
  { question: "Class average increased from 73% to 82%. Total increase?", answer: 9, explanation: "82 - 73 = 9" },
  { question: "Learner scored 28% in Term 1. Now 35%. What is percentage improvement?", answer: 25, explanation: "(35-28)/28 × 100 = 25%" },
  { question: "Class average went from 47% to 56.4%. Total increase?", answer: 9.4, explanation: "56.4 - 47 = 9.4" },
  { question: "Learner scored 82% in Term 1. Now 90.2%. What is percentage improvement?", answer: 10, explanation: "(90.2-82)/82 × 100 = 10%" },
  { question: "Class average increased from 43% to 51.6%. Total increase?", answer: 8.6, explanation: "51.6 - 43 = 8.6" },
  { question: "Learner scored 36% in Term 1. Now 43.2%. What is percentage improvement?", answer: 20, explanation: "(43.2-36)/36 × 100 = 20%" },
  { question: "Class average went from 79% to 87%. Total increase?", answer: 8, explanation: "87 - 79 = 8" }
];

// EXTREME – Differentiation & Support (% need support, total support time)
export const extremeQuestions: TeacherQuestion[] = [
  { question: "32 learners. 24 passed. 8 need support. What percentage need support?", answer: 25, explanation: "8 ÷ 32 × 100 = 25%" },
  { question: "Teacher spends 12 minutes per struggling learner. 9 learners need support. How long total support time (minutes)?", answer: 108, explanation: "12 × 9 = 108 minutes" },
  { question: "28 learners. 7 need support. What percentage need support?", answer: 25, explanation: "7 ÷ 28 × 100 = 25%" },
  { question: "14 minutes per learner. 5 learners need support. Total support time (minutes)?", answer: 70, explanation: "14 × 5 = 70" },
  { question: "44 learners. 11 need support. What percentage need support?", answer: 25, explanation: "11 ÷ 44 × 100 = 25%" },
  { question: "18 minutes per learner. 4 learners need support. Total support time (minutes)?", answer: 72, explanation: "18 × 4 = 72" },
  { question: "38 learners. 9 need support. What percentage need support?", answer: 23.68, explanation: "9 ÷ 38 × 100 ≈ 23.68%" },
  { question: "16 minutes per learner. 7 learners need support. Total support time (minutes)?", answer: 112, explanation: "16 × 7 = 112" },
  { question: "52 learners. 13 need support. What percentage need support?", answer: 25, explanation: "13 ÷ 52 × 100 = 25%" },
  { question: "22 minutes per learner. 3 learners need support. Total support time (minutes)?", answer: 66, explanation: "22 × 3 = 66" },
  { question: "26 learners. 13 need support. What percentage need support?", answer: 50, explanation: "13 ÷ 26 × 100 = 50%" },
  { question: "20 minutes per learner. 6 learners need support. Total support time (minutes)?", answer: 120, explanation: "20 × 6 = 120" },
  { question: "34 learners. 8 need support. What percentage need support?", answer: 23.53, explanation: "8 ÷ 34 × 100 ≈ 23.53%" },
  { question: "11 minutes per learner. 8 learners need support. Total support time (minutes)?", answer: 88, explanation: "11 × 8 = 88" },
  { question: "48 learners. 12 need support. What percentage need support?", answer: 25, explanation: "12 ÷ 48 × 100 = 25%" },
  { question: "25 minutes per learner. 4 learners need support. Total support time (minutes)?", answer: 100, explanation: "25 × 4 = 100" },
  { question: "22 learners. 5 need support. What percentage need support?", answer: 22.73, explanation: "5 ÷ 22 × 100 ≈ 22.73%" },
  { question: "9 minutes per learner. 10 learners need support. Total support time (minutes)?", answer: 90, explanation: "9 × 10 = 90" },
  { question: "40 learners. 10 need support. What percentage need support?", answer: 25, explanation: "10 ÷ 40 × 100 = 25%" },
  { question: "Teacher spends 13 minutes per struggling learner. There are 6 learners. How long total support time (minutes)?", answer: 78, explanation: "13 × 6 = 78" }
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
