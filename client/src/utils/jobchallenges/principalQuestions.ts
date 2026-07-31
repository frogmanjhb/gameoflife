// Principal – School Leadership Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface PrincipalQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Time & Timetable (lesson allocation, classes per week)
const easyQuestions: PrincipalQuestion[] = [
  { question: "School day = 6.5 hours. Each lesson = 65 minutes. How many lessons fit?", answer: 6, explanation: "6.5 × 60 = 390 min; 390 ÷ 65 = 6 lessons" },
  { question: "A teacher teaches 4 classes per day for 5 days. Total classes per week?", answer: 20, explanation: "4 × 5 = 20 classes" },
  { question: "School day 8 hours. Each lesson 40 minutes. How many lessons?", answer: 12, explanation: "480 ÷ 40 = 12" },
  { question: "Teacher teaches 6 classes per day for 3 days. Total classes per week?", answer: 18, explanation: "6 × 3 = 18 classes" },
  { question: "5 hours in a day. Lessons 60 minutes each. How many lessons?", answer: 5, explanation: "300 ÷ 60 = 5" },
  { question: "3 classes per day for 6 days. Total classes per week?", answer: 18, explanation: "3 × 6 = 18" },
  { question: "School day 7 hours. Lessons 42 minutes. How many lessons?", answer: 10, explanation: "420 ÷ 42 = 10" },
  { question: "5 classes per day for 4 days. Total classes per week?", answer: 20, explanation: "5 × 4 = 20" },
  { question: "4 hours in a day. Lessons 48 minutes. How many lessons?", answer: 5, explanation: "240 ÷ 48 = 5" },
  { question: "8 classes per day for 2 days. Total classes per week?", answer: 16, explanation: "8 × 2 = 16" },
  { question: "School day 9 hours. Lessons 45 minutes. How many lessons?", answer: 12, explanation: "540 ÷ 45 = 12" },
  { question: "7 classes per day for 4 days. Total classes per week?", answer: 28, explanation: "7 × 4 = 28" },
  { question: "School day 5.25 hours. Lessons 35 minutes. How many lessons?", answer: 9, explanation: "315 ÷ 35 = 9" },
  { question: "2 classes per day for 5 days. Total classes per week?", answer: 10, explanation: "2 × 5 = 10" },
  { question: "6 hours in a day. Lessons 36 minutes. How many lessons?", answer: 10, explanation: "360 ÷ 36 = 10" },
  { question: "9 classes per day for 2 days. Total classes per week?", answer: 18, explanation: "9 × 2 = 18" },
  { question: "School day 3.5 hours. Lessons 35 minutes. How many lessons?", answer: 6, explanation: "210 ÷ 35 = 6" },
  { question: "4 classes per day for 5 days. Total classes per week?", answer: 20, explanation: "4 × 5 = 20" },
  { question: "7.5 hours in a day. Lessons 75 minutes. How many lessons?", answer: 6, explanation: "450 ÷ 75 = 6" },
  { question: "6 classes per day for 5 days. Total classes per week?", answer: 30, explanation: "6 × 5 = 30" }
];

// MEDIUM – Ratios & Participation (student-teacher ratio, % completed)
const mediumQuestions: PrincipalQuestion[] = [
  { question: "Class has 32 learners. 2 teachers assist. Student-teacher ratio (learners per teacher)?", answer: 16, explanation: "32 ÷ 2 = 16" },
  { question: "23 of 32 learners completed homework. What percentage completed it?", answer: 71.875, explanation: "23 ÷ 32 × 100 = 71.875%" },
  { question: "36 learners, 3 teachers. Student-teacher ratio?", answer: 12, explanation: "36 ÷ 3 = 12" },
  { question: "15 of 20 learners completed homework. Percentage completed?", answer: 75, explanation: "15 ÷ 20 × 100 = 75%" },
  { question: "42 learners, 2 teachers. Student-teacher ratio?", answer: 21, explanation: "42 ÷ 2 = 21" },
  { question: "20 of 25 learners completed homework. Percentage?", answer: 80, explanation: "20 ÷ 25 × 100 = 80%" },
  { question: "27 learners, 1 teacher. Ratio (learners per teacher)?", answer: 27, explanation: "27 ÷ 1 = 27" },
  { question: "16 of 32 learners completed. Percentage completed?", answer: 50, explanation: "16 ÷ 32 × 100 = 50%" },
  { question: "45 learners, 3 teachers. Student-teacher ratio?", answer: 15, explanation: "45 ÷ 3 = 15" },
  { question: "28 of 35 learners completed homework. Percentage?", answer: 80, explanation: "28 ÷ 35 × 100 = 80%" },
  { question: "33 learners, 2 teachers. Student-teacher ratio?", answer: 16.5, explanation: "33 ÷ 2 = 16.5" },
  { question: "11 of 44 learners completed. Percentage completed?", answer: 25, explanation: "11 ÷ 44 × 100 = 25%" },
  { question: "52 learners, 4 teachers. Student-teacher ratio?", answer: 13, explanation: "52 ÷ 4 = 13" },
  { question: "30 of 40 learners completed homework. Percentage?", answer: 75, explanation: "30 ÷ 40 × 100 = 75%" },
  { question: "38 learners, 2 teachers. Ratio?", answer: 19, explanation: "38 ÷ 2 = 19" },
  { question: "9 of 12 learners completed. Percentage completed?", answer: 75, explanation: "9 ÷ 12 × 100 = 75%" },
  { question: "25 learners, 1 teacher. Student-teacher ratio?", answer: 25, explanation: "25 ÷ 1 = 25" },
  { question: "13 of 26 learners completed homework. Percentage?", answer: 50, explanation: "13 ÷ 26 × 100 = 50%" },
  { question: "54 learners, 3 teachers. Ratio?", answer: 18, explanation: "54 ÷ 3 = 18" },
  { question: "32 of 40 learners completed. Percentage completed?", answer: 80, explanation: "32 ÷ 40 × 100 = 80%" }
];

// HARD – Performance Analysis (% improvement, total improvement in marks)
const hardQuestions: PrincipalQuestion[] = [
  { question: "Class average Term 1 = 55%, Term 2 = 66%. What is percentage improvement?", answer: 20, explanation: "(66-55)/55 × 100 = 20%" },
  { question: "7 learners improve by 12 marks each. Total improvement in marks?", answer: 84, explanation: "7 × 12 = 84" },
  { question: "Term 1 average 40%, Term 2 = 50%. Percentage improvement?", answer: 25, explanation: "(50-40)/40 × 100 = 25%" },
  { question: "8 learners improve by 9 marks each. Total improvement?", answer: 72, explanation: "8 × 9 = 72" },
  { question: "Term 1 = 80%, Term 2 = 92%. Percentage improvement?", answer: 15, explanation: "(92-80)/80 × 100 = 15%" },
  { question: "5 learners improve by 15 marks each. Total improvement?", answer: 75, explanation: "5 × 15 = 75" },
  { question: "Term 1 = 50%, Term 2 = 62.5%. Percentage improvement?", answer: 25, explanation: "(62.5-50)/50 × 100 = 25%" },
  { question: "6 learners improve by 11 marks each. Total improvement?", answer: 66, explanation: "6 × 11 = 66" },
  { question: "Term 1 = 75%, Term 2 = 90%. Percentage improvement?", answer: 20, explanation: "(90-75)/75 × 100 = 20%" },
  { question: "10 learners improve by 5 marks each. Total improvement?", answer: 50, explanation: "10 × 5 = 50" },
  { question: "Term 1 = 32%, Term 2 = 41.6%. Percentage improvement?", answer: 30, explanation: "(41.6-32)/32 × 100 = 30%" },
  { question: "4 learners improve by 20 marks each. Total improvement?", answer: 80, explanation: "4 × 20 = 80" },
  { question: "Term 1 = 64%, Term 2 = 76.8%. Percentage improvement?", answer: 20, explanation: "(76.8-64)/64 × 100 = 20%" },
  { question: "9 learners improve by 8 marks each. Total improvement?", answer: 72, explanation: "9 × 8 = 72" },
  { question: "Term 1 = 45%, Term 2 = 54%. Percentage improvement?", answer: 20, explanation: "(54-45)/45 × 100 = 20%" },
  { question: "11 learners improve by 7 marks each. Total improvement?", answer: 77, explanation: "11 × 7 = 77" },
  { question: "Term 1 = 70%, Term 2 = 84%. Percentage improvement?", answer: 20, explanation: "(84-70)/70 × 100 = 20%" },
  { question: "3 learners improve by 25 marks each. Total improvement?", answer: 75, explanation: "3 × 25 = 75" },
  { question: "Term 1 = 90%, Term 2 = 99%. Percentage improvement?", answer: 10, explanation: "(99-90)/90 × 100 = 10%" },
  { question: "12 learners improve by 6 marks each. Total improvement?", answer: 72, explanation: "12 × 6 = 72" }
];

// EXTREME – Resource Allocation (teachers needed, absenteeism change)
const extremeQuestions: PrincipalQuestion[] = [
  { question: "School has 144 learners. Each teacher can manage 24 learners. How many teachers needed?", answer: 6, explanation: "144 ÷ 24 = 6" },
  { question: "Absenteeism drops from 20% to 10%. Class of 50. How many more learners attend?", answer: 5, explanation: "10 absent → 5 absent; 5 more attend" },
  { question: "108 learners. 27 per teacher. How many teachers needed?", answer: 4, explanation: "108 ÷ 27 = 4" },
  { question: "Absenteeism 24% to 16%. Class of 50. How many more attend?", answer: 4, explanation: "12 absent → 8 absent; 4 more attend" },
  { question: "182 learners. 26 per teacher. How many teachers needed?", answer: 7, explanation: "182 ÷ 26 = 7" },
  { question: "Absenteeism 16% to 8%. Class of 50. How many more attend?", answer: 4, explanation: "8 absent → 4 absent; 4 more attend" },
  { question: "75 learners. 25 per teacher. How many teachers needed?", answer: 3, explanation: "75 ÷ 25 = 3" },
  { question: "Absenteeism 30% to 20%. Class of 50. How many more attend?", answer: 5, explanation: "15 absent → 10 absent; 5 more attend" },
  { question: "160 learners. 32 per teacher. How many teachers needed?", answer: 5, explanation: "160 ÷ 32 = 5" },
  { question: "Absenteeism 14% to 6%. Class of 50. How many more attend?", answer: 4, explanation: "7 absent → 3 absent; 4 more attend" },
  { question: "117 learners. 39 per teacher. How many teachers needed?", answer: 3, explanation: "117 ÷ 39 = 3" },
  { question: "Absenteeism 18% to 10%. Class of 50. How many more attend?", answer: 4, explanation: "9 absent → 5 absent; 4 more attend" },
  { question: "224 learners. 32 per teacher. How many teachers needed?", answer: 7, explanation: "224 ÷ 32 = 7" },
  { question: "Absenteeism 22% to 14%. Class of 50. How many more attend?", answer: 4, explanation: "11 absent → 7 absent; 4 more attend" },
  { question: "99 learners. 33 per teacher. How many teachers needed?", answer: 3, explanation: "99 ÷ 33 = 3" },
  { question: "Absenteeism 28% to 20%. Class of 50. How many more attend?", answer: 4, explanation: "14 absent → 10 absent; 4 more attend" },
  { question: "138 learners. 23 per teacher. How many teachers needed?", answer: 6, explanation: "138 ÷ 23 = 6" },
  { question: "Absenteeism 10% to 4%. Class of 50. How many more attend?", answer: 3, explanation: "5 absent → 2 absent; 3 more attend" },
  { question: "176 learners. 22 per teacher. How many teachers needed?", answer: 8, explanation: "176 ÷ 22 = 8" },
  { question: "Absenteeism 25% to 15%. Class of 40. How many more learners attend?", answer: 4, explanation: "10 absent → 6 absent; 4 more attend" }
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
