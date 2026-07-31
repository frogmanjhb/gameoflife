// Teacher – Learning Support Challenge (Teaching Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface TeacherQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Marking & Totals (percentage from score, averages)
export const easyQuestions: TeacherQuestion[] = [
  { question: "A test is out of 45. Learner scores 36. What percentage is that?", answer: 80, explanation: "36 ÷ 45 × 100 = 80%" },
  { question: "4 learners scored: 70, 80, 90, 100. What is the average?", answer: 85, explanation: "(70+80+90+100) ÷ 4 = 85" },
  { question: "Test out of 30. Learner scores 27. What percentage?", answer: 90, explanation: "27 ÷ 30 × 100 = 90%" },
  { question: "5 learners scored: 50, 55, 60, 65, 70. What is the average?", answer: 60, explanation: "(50+55+60+65+70) ÷ 5 = 60" },
  { question: "Test out of 44. Learner scores 33. What percentage?", answer: 75, explanation: "33 ÷ 44 × 100 = 75%" },
  { question: "3 learners scored: 82, 86, 90. What is the average?", answer: 86, explanation: "(82+86+90) ÷ 3 = 86" },
  { question: "Test out of 60. Learner scores 54. What percentage?", answer: 90, explanation: "54 ÷ 60 × 100 = 90%" },
  { question: "6 learners scored: 40, 44, 48, 52, 56, 60. What is the average?", answer: 50, explanation: "300 ÷ 6 = 50" },
  { question: "Test out of 52. Learner scores 39. What percentage?", answer: 75, explanation: "39 ÷ 52 × 100 = 75%" },
  { question: "4 learners scored: 63, 67, 71, 75. What is the average?", answer: 69, explanation: "(63+67+71+75) ÷ 4 = 69" },
  { question: "Test out of 50. Learner scores 45. What percentage?", answer: 90, explanation: "45 ÷ 50 × 100 = 90%" },
  { question: "5 learners scored: 30, 35, 40, 45, 50. What is the average?", answer: 40, explanation: "200 ÷ 5 = 40" },
  { question: "Test out of 70. Learner scores 63. What percentage?", answer: 90, explanation: "63 ÷ 70 × 100 = 90%" },
  { question: "4 learners scored: 41, 45, 49, 53. What is the average?", answer: 47, explanation: "(41+45+49+53) ÷ 4 = 47" },
  { question: "Test out of 24. Learner scores 18. What percentage?", answer: 75, explanation: "18 ÷ 24 × 100 = 75%" },
  { question: "6 learners scored: 52, 54, 56, 58, 60, 62. What is the average?", answer: 57, explanation: "342 ÷ 6 = 57" },
  { question: "Test out of 68. Learner scores 51. What percentage?", answer: 75, explanation: "51 ÷ 68 × 100 = 75%" },
  { question: "5 learners scored: 77, 79, 81, 83, 85. What is the average?", answer: 81, explanation: "405 ÷ 5 = 81" },
  { question: "Test out of 36. Learner scores 27. What percentage?", answer: 75, explanation: "27 ÷ 36 × 100 = 75%" },
  { question: "3 learners scored: 88, 92, 96. What is the average?", answer: 92, explanation: "(88+92+96) ÷ 3 = 92" }
];

// MEDIUM – Grouping & Planning (groups, % of lesson time)
export const mediumQuestions: TeacherQuestion[] = [
  { question: "36 learners. Teacher wants groups of 9. How many groups?", answer: 4, explanation: "36 ÷ 9 = 4 groups" },
  { question: "Lesson = 45 minutes. 5 minutes intro, 30 minutes activity. What percentage is activity?", answer: 66.67, explanation: "30 ÷ 45 × 100 ≈ 66.67%" },
  { question: "24 learners. Groups of 8. How many groups?", answer: 3, explanation: "24 ÷ 8 = 3" },
  { question: "40-minute lesson. 5 min intro, 25 min activity. What percentage is activity?", answer: 62.5, explanation: "25 ÷ 40 × 100 = 62.5%" },
  { question: "42 learners. Groups of 7. How many groups?", answer: 6, explanation: "42 ÷ 7 = 6" },
  { question: "50-minute lesson. 10 min intro, 30 min activity. What percentage is activity?", answer: 60, explanation: "30 ÷ 50 × 100 = 60%" },
  { question: "27 learners. Groups of 9. How many groups?", answer: 3, explanation: "27 ÷ 9 = 3" },
  { question: "56-minute lesson. 8 min intro, 40 min activity. What percentage is activity?", answer: 71.43, explanation: "40 ÷ 56 × 100 ≈ 71.43%" },
  { question: "48 learners. Groups of 12. How many groups?", answer: 4, explanation: "48 ÷ 12 = 4" },
  { question: "38-minute lesson. 6 min intro, 24 min activity. What percentage is activity?", answer: 63.16, explanation: "24 ÷ 38 × 100 ≈ 63.16%" },
  { question: "20 learners. Groups of 5. How many groups?", answer: 4, explanation: "20 ÷ 5 = 4" },
  { question: "64-minute lesson. 12 min intro, 44 min activity. What percentage is activity?", answer: 68.75, explanation: "44 ÷ 64 × 100 = 68.75%" },
  { question: "45 learners. Groups of 9. How many groups?", answer: 5, explanation: "45 ÷ 9 = 5" },
  { question: "42-minute lesson. 7 min intro, 28 min activity. What percentage is activity?", answer: 66.67, explanation: "28 ÷ 42 × 100 ≈ 66.67%" },
  { question: "32 learners. Groups of 8. How many groups?", answer: 4, explanation: "32 ÷ 8 = 4" },
  { question: "52-minute lesson. 13 min intro, 26 min activity. What percentage is activity?", answer: 50, explanation: "26 ÷ 52 × 100 = 50%" },
  { question: "54 learners. Groups of 6. How many groups?", answer: 9, explanation: "54 ÷ 6 = 9" },
  { question: "35-minute lesson. 5 min intro, 25 min activity. What percentage is activity?", answer: 71.43, explanation: "25 ÷ 35 × 100 ≈ 71.43%" },
  { question: "21 learners. Groups of 7. How many groups?", answer: 3, explanation: "21 ÷ 7 = 3" },
  { question: "48-minute lesson. 8 min intro, 32 min activity. What percentage is activity?", answer: 66.67, explanation: "32 ÷ 48 × 100 ≈ 66.67%" }
];

// HARD – Improvement Tracking (% improvement, total increase)
export const hardQuestions: TeacherQuestion[] = [
  { question: "Learner scored 56% in Term 1. Now 70%. What is percentage improvement?", answer: 25, explanation: "(70-56)/56 × 100 = 25%" },
  { question: "Class average increased from 65% to 74%. How much total increase (percentage points)?", answer: 9, explanation: "74 - 65 = 9 percentage points" },
  { question: "Learner scored 40% in Term 1. Now 48%. What is percentage improvement?", answer: 20, explanation: "(48-40)/40 × 100 = 20%" },
  { question: "Class average went from 59% to 68%. Total increase in percentage points?", answer: 9, explanation: "68 - 59 = 9" },
  { question: "Learner scored 35% in Term 1. Now 42%. What is percentage improvement?", answer: 20, explanation: "(42-35)/35 × 100 = 20%" },
  { question: "Class average increased from 72% to 82.8%. Total increase?", answer: 10.8, explanation: "82.8 - 72 = 10.8" },
  { question: "Learner scored 50% in Term 1. Now 62.5%. What is percentage improvement?", answer: 25, explanation: "(62.5-50)/50 × 100 = 25%" },
  { question: "Class average went from 68% to 77%. Total increase?", answer: 9, explanation: "77 - 68 = 9" },
  { question: "Learner scored 44% in Term 1. Now 55%. What is percentage improvement?", answer: 25, explanation: "(55-44)/44 × 100 = 25%" },
  { question: "Class average increased from 81% to 89%. Total increase?", answer: 8, explanation: "89 - 81 = 8" },
  { question: "Learner scored 60% in Term 1. Now 72%. What is percentage improvement?", answer: 20, explanation: "(72-60)/60 × 100 = 20%" },
  { question: "Class average went from 55% to 66%. Total increase?", answer: 11, explanation: "66 - 55 = 11" },
  { question: "Learner scored 32% in Term 1. Now 40%. What is percentage improvement?", answer: 25, explanation: "(40-32)/32 × 100 = 25%" },
  { question: "Class average increased from 74% to 83%. Total increase?", answer: 9, explanation: "83 - 74 = 9" },
  { question: "Learner scored 70% in Term 1. Now 84%. What is percentage improvement?", answer: 20, explanation: "(84-70)/70 × 100 = 20%" },
  { question: "Class average went from 62% to 71.3%. Total increase?", answer: 9.3, explanation: "71.3 - 62 = 9.3" },
  { question: "Learner scored 25% in Term 1. Now 30%. What is percentage improvement?", answer: 20, explanation: "(30-25)/25 × 100 = 20%" },
  { question: "Class average increased from 48% to 57.6%. Total increase?", answer: 9.6, explanation: "57.6 - 48 = 9.6" },
  { question: "Learner scored 80% in Term 1. Now 88%. What is percentage improvement?", answer: 10, explanation: "(88-80)/80 × 100 = 10%" },
  { question: "Class average went from 53% to 61%. Total increase?", answer: 8, explanation: "61 - 53 = 8" }
];

// EXTREME – Differentiation & Support (% need support, total support time)
export const extremeQuestions: TeacherQuestion[] = [
  { question: "36 learners. 9 need support. What percentage need support?", answer: 25, explanation: "9 ÷ 36 × 100 = 25%" },
  { question: "Teacher spends 15 minutes per struggling learner. 8 learners need support. Total support time (minutes)?", answer: 120, explanation: "15 × 8 = 120 minutes" },
  { question: "24 learners. 6 need support. What percentage need support?", answer: 25, explanation: "6 ÷ 24 × 100 = 25%" },
  { question: "10 minutes per learner. 11 learners need support. Total support time (minutes)?", answer: 110, explanation: "10 × 11 = 110" },
  { question: "56 learners. 14 need support. What percentage need support?", answer: 25, explanation: "14 ÷ 56 × 100 = 25%" },
  { question: "17 minutes per learner. 5 learners need support. Total support time (minutes)?", answer: 85, explanation: "17 × 5 = 85" },
  { question: "30 learners. 6 need support. What percentage need support?", answer: 20, explanation: "6 ÷ 30 × 100 = 20%" },
  { question: "12 minutes per learner. 9 learners need support. Total support time (minutes)?", answer: 108, explanation: "12 × 9 = 108" },
  { question: "45 learners. 9 need support. What percentage need support?", answer: 20, explanation: "9 ÷ 45 × 100 = 20%" },
  { question: "20 minutes per learner. 6 learners need support. Total support time (minutes)?", answer: 120, explanation: "20 × 6 = 120" },
  { question: "50 learners. 10 need support. What percentage need support?", answer: 20, explanation: "10 ÷ 50 × 100 = 20%" },
  { question: "8 minutes per learner. 15 learners need support. Total support time (minutes)?", answer: 120, explanation: "8 × 15 = 120" },
  { question: "42 learners. 7 need support. What percentage need support?", answer: 16.67, explanation: "7 ÷ 42 × 100 ≈ 16.67%" },
  { question: "19 minutes per learner. 4 learners need support. Total support time (minutes)?", answer: 76, explanation: "19 × 4 = 76" },
  { question: "60 learners. 15 need support. What percentage need support?", answer: 25, explanation: "15 ÷ 60 × 100 = 25%" },
  { question: "14 minutes per learner. 7 learners need support. Total support time (minutes)?", answer: 98, explanation: "14 × 7 = 98" },
  { question: "27 learners. 9 need support. What percentage need support?", answer: 33.33, explanation: "9 ÷ 27 × 100 ≈ 33.33%" },
  { question: "16 minutes per learner. 6 learners need support. Total support time (minutes)?", answer: 96, explanation: "16 × 6 = 96" },
  { question: "20 learners. 4 need support. What percentage need support?", answer: 20, explanation: "4 ÷ 20 × 100 = 20%" },
  { question: "21 minutes per learner. 5 learners need support. Total support time (minutes)?", answer: 105, explanation: "21 × 5 = 105" }
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
