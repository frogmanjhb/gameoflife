// Principal – School Leadership Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface PrincipalQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Time & Timetable (lesson allocation, classes per week)
const easyQuestions: PrincipalQuestion[] = [
  { question: "School day = 7 hours. Each lesson = 35 minutes. How many lessons fit?", answer: 12, explanation: "7 × 60 = 420 min; 420 ÷ 35 = 12 lessons" },
  { question: "A teacher teaches 5 classes per day for 4 days. Total classes per week?", answer: 20, explanation: "5 × 4 = 20 classes" },
  { question: "School day 5.5 hours. Each lesson 55 minutes. How many lessons?", answer: 6, explanation: "330 ÷ 55 = 6" },
  { question: "Teacher teaches 4 classes per day for 3 days. Total classes per week?", answer: 12, explanation: "4 × 3 = 12 classes" },
  { question: "6 hours in a day. Lessons 45 minutes each. How many lessons?", answer: 8, explanation: "360 ÷ 45 = 8" },
  { question: "6 classes per day, 4 days. Total classes per week?", answer: 24, explanation: "6 × 4 = 24" },
  { question: "School day 4.5 hours. Lessons 45 minutes. How many lessons?", answer: 6, explanation: "270 ÷ 45 = 6" },
  { question: "3 classes per day for 5 days. Total classes per week?", answer: 15, explanation: "3 × 5 = 15" },
  { question: "8 hours in a day. Lessons 40 minutes. How many lessons?", answer: 12, explanation: "480 ÷ 40 = 12" },
  { question: "2 classes per day for 5 days. Total classes per week?", answer: 10, explanation: "2 × 5 = 10" },
  { question: "School day 5 hours. Lessons 50 minutes. How many lessons?", answer: 6, explanation: "300 ÷ 50 = 6" },
  { question: "7 classes per day for 3 days. Total classes per week?", answer: 21, explanation: "7 × 3 = 21" },
  { question: "4.5 hours in a day. Lessons 30 minutes. How many lessons?", answer: 9, explanation: "270 ÷ 30 = 9" },
  { question: "5 classes per day for 5 days. Total classes per week?", answer: 25, explanation: "5 × 5 = 25" },
  { question: "6.5 hours in a day. Lessons 65 minutes. How many lessons?", answer: 6, explanation: "390 ÷ 65 = 6" },
  { question: "4 classes per day for 6 days. Total classes per week?", answer: 24, explanation: "4 × 6 = 24" },
  { question: "School day 3 hours. Lessons 30 minutes. How many lessons?", answer: 6, explanation: "180 ÷ 30 = 6" },
  { question: "8 classes per day for 2 days. Total classes per week?", answer: 16, explanation: "8 × 2 = 16" },
  { question: "7.5 hours in a day. Lessons 50 minutes. How many lessons?", answer: 9, explanation: "450 ÷ 50 = 9" },
  { question: "3 classes per day for 4 days. Total classes per week?", answer: 12, explanation: "3 × 4 = 12" }
];

// MEDIUM – Ratios & Participation (student-teacher ratio, % completed)
const mediumQuestions: PrincipalQuestion[] = [
  { question: "Class has 35 learners. 2 teachers assist. Student-teacher ratio (learners per teacher)?", answer: 17.5, explanation: "35 ÷ 2 = 17.5" },
  { question: "22 of 28 learners completed homework. What percentage completed it?", answer: 78.57, explanation: "22 ÷ 28 × 100 ≈ 78.57%" },
  { question: "28 learners, 1 teacher. Student-teacher ratio?", answer: 28, explanation: "28 ÷ 1 = 28" },
  { question: "19 of 25 learners completed homework. Percentage completed?", answer: 76, explanation: "19 ÷ 25 × 100 = 76%" },
  { question: "39 learners, 3 teachers. Student-teacher ratio?", answer: 13, explanation: "39 ÷ 3 = 13" },
  { question: "17 of 34 learners completed. Percentage completed?", answer: 50, explanation: "17 ÷ 34 × 100 = 50%" },
  { question: "44 learners, 2 teachers. Student-teacher ratio?", answer: 22, explanation: "44 ÷ 2 = 22" },
  { question: "24 of 30 learners completed homework. Percentage?", answer: 80, explanation: "24 ÷ 30 × 100 = 80%" },
  { question: "31 learners, 1 teacher. Ratio (learners per teacher)?", answer: 31, explanation: "31 ÷ 1 = 31" },
  { question: "26 of 40 learners completed. Percentage completed?", answer: 65, explanation: "26 ÷ 40 × 100 = 65%" },
  { question: "34 learners, 2 teachers. Student-teacher ratio?", answer: 17, explanation: "34 ÷ 2 = 17" },
  { question: "27 of 36 learners completed. Percentage?", answer: 75, explanation: "27 ÷ 36 × 100 = 75%" },
  { question: "48 learners, 4 teachers. Student-teacher ratio?", answer: 12, explanation: "48 ÷ 4 = 12" },
  { question: "21 of 24 learners completed homework. Percentage?", answer: 87.5, explanation: "21 ÷ 24 × 100 = 87.5%" },
  { question: "29 learners, 2 teachers. Ratio?", answer: 14.5, explanation: "29 ÷ 2 = 14.5" },
  { question: "14 of 20 learners completed. Percentage completed?", answer: 70, explanation: "14 ÷ 20 × 100 = 70%" },
  { question: "37 learners, 1 teacher. Student-teacher ratio?", answer: 37, explanation: "37 ÷ 1 = 37" },
  { question: "33 of 44 learners completed. Percentage?", answer: 75, explanation: "33 ÷ 44 × 100 = 75%" },
  { question: "51 learners, 3 teachers. Ratio?", answer: 17, explanation: "51 ÷ 3 = 17" },
  { question: "18 of 24 learners completed. Percentage completed?", answer: 75, explanation: "18 ÷ 24 × 100 = 75%" }
];

// HARD – Performance Analysis (% improvement, total improvement in marks)
const hardQuestions: PrincipalQuestion[] = [
  { question: "Class average Term 1 = 58%, Term 2 = 67%. What is percentage improvement (to 2 d.p.)?", answer: 15.52, explanation: "(67-58)/58 × 100 ≈ 15.52%" },
  { question: "6 learners improve by 8 marks each. Total improvement in marks?", answer: 48, explanation: "6 × 8 = 48" },
  { question: "Term 1 average 48%, Term 2 = 60%. Percentage improvement?", answer: 25, explanation: "(60-48)/48 × 100 = 25%" },
  { question: "5 learners improve by 14 marks each. Total improvement?", answer: 70, explanation: "5 × 14 = 70" },
  { question: "Term 1 = 72%, Term 2 = 81%. Percentage improvement?", answer: 12.5, explanation: "(81-72)/72 × 100 = 12.5%" },
  { question: "4 learners improve by 11 marks each. Total improvement?", answer: 44, explanation: "4 × 11 = 44" },
  { question: "Term 1 = 52%, Term 2 = 65%. Percentage improvement?", answer: 25, explanation: "(65-52)/52 × 100 = 25%" },
  { question: "7 learners improve by 9 marks each. Total improvement?", answer: 63, explanation: "7 × 9 = 63" },
  { question: "Term 1 = 84%, Term 2 = 92.4%. Percentage improvement?", answer: 10, explanation: "(92.4-84)/84 × 100 = 10%" },
  { question: "8 learners improve by 6 marks each. Total improvement?", answer: 48, explanation: "8 × 6 = 48" },
  { question: "Term 1 = 44%, Term 2 = 55%. Percentage improvement?", answer: 25, explanation: "(55-44)/44 × 100 = 25%" },
  { question: "3 learners improve by 18 marks each. Total improvement?", answer: 54, explanation: "3 × 18 = 54" },
  { question: "Term 1 = 68%, Term 2 = 78.2%. Percentage improvement?", answer: 15, explanation: "(78.2-68)/68 × 100 = 15%" },
  { question: "9 learners improve by 7 marks each. Total improvement?", answer: 63, explanation: "9 × 7 = 63" },
  { question: "Term 1 = 62%, Term 2 = 74.4%. Percentage improvement?", answer: 20, explanation: "(74.4-62)/62 × 100 = 20%" },
  { question: "5 learners improve by 16 marks each. Total improvement?", answer: 80, explanation: "5 × 16 = 80" },
  { question: "Term 1 = 38%, Term 2 = 49.4%. Percentage improvement?", answer: 30, explanation: "(49.4-38)/38 × 100 = 30%" },
  { question: "6 learners improve by 13 marks each. Total improvement?", answer: 78, explanation: "6 × 13 = 78" },
  { question: "Term 1 = 88%, Term 2 = 96.8%. Percentage improvement?", answer: 10, explanation: "(96.8-88)/88 × 100 = 10%" },
  { question: "4 learners improve by 22 marks each. Total improvement?", answer: 88, explanation: "4 × 22 = 88" }
];

// EXTREME – Resource Allocation (teachers needed, absenteeism change)
const extremeQuestions: PrincipalQuestion[] = [
  { question: "School has 135 learners. Each teacher can manage 27 learners. How many teachers needed?", answer: 5, explanation: "135 ÷ 27 = 5" },
  { question: "Absenteeism drops from 18% to 12%. Class of 50. How many more learners attend?", answer: 3, explanation: "9 absent → 6 absent; 3 more attend" },
  { question: "96 learners. 24 per teacher. How many teachers needed?", answer: 4, explanation: "96 ÷ 24 = 4" },
  { question: "Absenteeism 22% to 14%. Class of 50. How many more attend?", answer: 4, explanation: "11 absent → 7 absent; 4 more attend" },
  { question: "168 learners. 28 per teacher. How many teachers needed?", answer: 6, explanation: "168 ÷ 28 = 6" },
  { question: "Absenteeism 16% to 8%. Class of 50. How many more attend?", answer: 4, explanation: "8 absent → 4 absent; 4 more attend" },
  { question: "88 learners. 22 per teacher. How many teachers needed?", answer: 4, explanation: "88 ÷ 22 = 4" },
  { question: "Absenteeism 24% to 16%. Class of 50. How many more attend?", answer: 4, explanation: "12 absent → 8 absent; 4 more attend" },
  { question: "210 learners. 35 per teacher. How many teachers needed?", answer: 6, explanation: "210 ÷ 35 = 6" },
  { question: "Absenteeism 20% to 12%. Class of 50. How many more attend?", answer: 4, explanation: "10 absent → 6 absent; 4 more attend" },
  { question: "72 learners. 18 per teacher. How many teachers needed?", answer: 4, explanation: "72 ÷ 18 = 4" },
  { question: "Absenteeism 25% to 15%. Class of 40. How many more attend?", answer: 4, explanation: "10 absent → 6 absent; 4 more attend" },
  { question: "195 learners. 39 per teacher. How many teachers needed?", answer: 5, explanation: "195 ÷ 39 = 5" },
  { question: "Absenteeism 12% to 6%. Class of 50. How many more attend?", answer: 3, explanation: "6 absent → 3 absent; 3 more attend" },
  { question: "126 learners. 21 per teacher. How many teachers needed?", answer: 6, explanation: "126 ÷ 21 = 6" },
  { question: "Absenteeism 26% to 18%. Class of 50. How many more attend?", answer: 4, explanation: "13 absent → 9 absent; 4 more attend" },
  { question: "110 learners. 22 per teacher. How many teachers needed?", answer: 5, explanation: "110 ÷ 22 = 5" },
  { question: "Absenteeism 15% to 5%. Class of 60. How many more attend?", answer: 6, explanation: "9 absent → 3 absent; 6 more attend" },
  { question: "154 learners. 22 per teacher. How many teachers needed?", answer: 7, explanation: "154 ÷ 22 = 7" },
  { question: "Absenteeism 20% to 10%. Class of 40. How many more learners attend?", answer: 4, explanation: "8 absent → 4 absent; 4 more attend" }
];

export function getPrincipalQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): PrincipalQuestion {
  let questions: PrincipalQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
