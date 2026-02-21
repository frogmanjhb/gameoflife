// Principal – School Leadership Challenge (School Review Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface PrincipalQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Time & Timetable (lesson allocation, classes per week)
export const easyQuestions: PrincipalQuestion[] = [
  { question: "School day = 6 hours. Each lesson = 45 minutes. How many lessons fit?", answer: 8, explanation: "6 × 60 = 360 min; 360 ÷ 45 = 8 lessons" },
  { question: "A teacher teaches 4 classes per day for 5 days. Total classes per week?", answer: 20, explanation: "4 × 5 = 20 classes" },
  { question: "School day 5 hours. Each lesson 50 minutes. How many lessons?", answer: 6, explanation: "5 × 60 = 300 min; 300 ÷ 50 = 6" },
  { question: "Teacher teaches 3 classes per day for 4 days. Total classes per week?", answer: 12, explanation: "3 × 4 = 12 classes" },
  { question: "7 hours in a day. Lessons 60 minutes each. How many lessons?", answer: 7, explanation: "7 × 60 ÷ 60 = 7" },
  { question: "5 classes per day, 5 days. Total classes per week?", answer: 25, explanation: "5 × 5 = 25" },
  { question: "School day 4 hours. Lessons 40 minutes. How many lessons?", answer: 6, explanation: "240 ÷ 40 = 6" },
  { question: "2 classes per day for 6 days. Total classes per week?", answer: 12, explanation: "2 × 6 = 12" },
  { question: "8 hours in a day. Lessons 48 minutes. How many lessons?", answer: 10, explanation: "480 ÷ 48 = 10" },
  { question: "6 classes per day for 4 days. Total classes per week?", answer: 24, explanation: "6 × 4 = 24" },
  { question: "School day 4.5 hours. Lessons 45 minutes. How many lessons?", answer: 6, explanation: "270 ÷ 45 = 6" },
  { question: "3 classes per day, 5 days. Total classes per week?", answer: 15, explanation: "3 × 5 = 15" },
  { question: "5.5 hours in a day. Lessons 55 minutes. How many lessons?", answer: 6, explanation: "330 ÷ 55 = 6" },
  { question: "4 classes per day for 4 days. Total classes per week?", answer: 16, explanation: "4 × 4 = 16" },
  { question: "6 hours in a day. Lessons 40 minutes. How many lessons?", answer: 9, explanation: "360 ÷ 40 = 9" },
  { question: "5 classes per day, 3 days. Total classes per week?", answer: 15, explanation: "5 × 3 = 15" },
  { question: "School day 3.5 hours. Lessons 30 minutes. How many lessons?", answer: 7, explanation: "210 ÷ 30 = 7" },
  { question: "2 classes per day for 5 days. Total classes per week?", answer: 10, explanation: "2 × 5 = 10" },
  { question: "4 hours in a day. Lessons 30 minutes. How many lessons?", answer: 8, explanation: "240 ÷ 30 = 8" },
  { question: "3 classes per day for 6 days. Total classes per week?", answer: 18, explanation: "3 × 6 = 18" }
];

// MEDIUM – Ratios & Participation (student-teacher ratio, % completed)
export const mediumQuestions: PrincipalQuestion[] = [
  { question: "Class has 30 learners. 2 teachers assist. Student-teacher ratio (learners per teacher)?", answer: 15, explanation: "30 ÷ 2 = 15" },
  { question: "20 of 25 learners completed homework. What percentage completed it?", answer: 80, explanation: "20 ÷ 25 × 100 = 80%" },
  { question: "24 learners, 1 teacher. Student-teacher ratio?", answer: 24, explanation: "24 ÷ 1 = 24" },
  { question: "18 of 20 learners completed homework. Percentage completed?", answer: 90, explanation: "18 ÷ 20 × 100 = 90%" },
  { question: "36 learners, 2 teachers. Student-teacher ratio?", answer: 18, explanation: "36 ÷ 2 = 18" },
  { question: "15 of 25 learners completed. Percentage completed?", answer: 60, explanation: "15 ÷ 25 × 100 = 60%" },
  { question: "40 learners, 2 teachers. Student-teacher ratio?", answer: 20, explanation: "40 ÷ 2 = 20" },
  { question: "22 of 25 learners completed homework. Percentage?", answer: 88, explanation: "22 ÷ 25 × 100 = 88%" },
  { question: "27 learners, 1 teacher. Ratio (learners per teacher)?", answer: 27, explanation: "27 ÷ 1 = 27" },
  { question: "21 of 30 learners completed. Percentage completed?", answer: 70, explanation: "21 ÷ 30 × 100 = 70%" },
  { question: "32 learners, 2 teachers. Student-teacher ratio?", answer: 16, explanation: "32 ÷ 2 = 16" },
  { question: "24 of 30 learners completed. Percentage?", answer: 80, explanation: "24 ÷ 30 × 100 = 80%" },
  { question: "45 learners, 3 teachers. Student-teacher ratio?", answer: 15, explanation: "45 ÷ 3 = 15" },
  { question: "19 of 20 learners completed homework. Percentage?", answer: 95, explanation: "19 ÷ 20 × 100 = 95%" },
  { question: "28 learners, 2 teachers. Ratio?", answer: 14, explanation: "28 ÷ 2 = 14" },
  { question: "16 of 20 learners completed. Percentage completed?", answer: 80, explanation: "16 ÷ 20 × 100 = 80%" },
  { question: "33 learners, 1 teacher. Student-teacher ratio?", answer: 33, explanation: "33 ÷ 1 = 33" },
  { question: "23 of 25 learners completed. Percentage?", answer: 92, explanation: "23 ÷ 25 × 100 = 92%" },
  { question: "42 learners, 3 teachers. Ratio?", answer: 14, explanation: "42 ÷ 3 = 14" },
  { question: "17 of 25 learners completed. Percentage completed?", answer: 68, explanation: "17 ÷ 25 × 100 = 68%" }
];

// HARD – Performance Analysis (% improvement, total improvement in marks)
export const hardQuestions: PrincipalQuestion[] = [
  { question: "Class average Term 1 = 65%, Term 2 = 72%. What is percentage improvement (to 2 d.p.)?", answer: 10.77, explanation: "(72-65)/65 × 100 ≈ 10.77%" },
  { question: "5 learners improve by 10 marks each. Total improvement in marks?", answer: 50, explanation: "5 × 10 = 50" },
  { question: "Term 1 average 50%, Term 2 = 60%. Percentage improvement?", answer: 20, explanation: "(60-50)/50 × 100 = 20%" },
  { question: "4 learners improve by 15 marks each. Total improvement?", answer: 60, explanation: "4 × 15 = 60" },
  { question: "Term 1 = 70%, Term 2 = 77%. Percentage improvement?", answer: 10, explanation: "(77-70)/70 × 100 = 10%" },
  { question: "6 learners improve by 5 marks each. Total improvement?", answer: 30, explanation: "6 × 5 = 30" },
  { question: "Term 1 = 55%, Term 2 = 66%. Percentage improvement?", answer: 20, explanation: "(66-55)/55 × 100 = 20%" },
  { question: "3 learners improve by 20 marks each. Total improvement?", answer: 60, explanation: "3 × 20 = 60" },
  { question: "Term 1 = 80%, Term 2 = 88%. Percentage improvement?", answer: 10, explanation: "(88-80)/80 × 100 = 10%" },
  { question: "8 learners improve by 10 marks each. Total improvement?", answer: 80, explanation: "8 × 10 = 80" },
  { question: "Term 1 = 40%, Term 2 = 52%. Percentage improvement?", answer: 30, explanation: "(52-40)/40 × 100 = 30%" },
  { question: "5 learners improve by 12 marks each. Total improvement?", answer: 60, explanation: "5 × 12 = 60" },
  { question: "Term 1 = 75%, Term 2 = 82.5%. Percentage improvement?", answer: 10, explanation: "(82.5-75)/75 × 100 = 10%" },
  { question: "7 learners improve by 8 marks each. Total improvement?", answer: 56, explanation: "7 × 8 = 56" },
  { question: "Term 1 = 60%, Term 2 = 72%. Percentage improvement?", answer: 20, explanation: "(72-60)/60 × 100 = 20%" },
  { question: "4 learners improve by 25 marks each. Total improvement?", answer: 100, explanation: "4 × 25 = 100" },
  { question: "Term 1 = 45%, Term 2 = 54%. Percentage improvement?", answer: 20, explanation: "(54-45)/45 × 100 = 20%" },
  { question: "6 learners improve by 15 marks each. Total improvement?", answer: 90, explanation: "6 × 15 = 90" },
  { question: "Term 1 = 90%, Term 2 = 99%. Percentage improvement?", answer: 10, explanation: "(99-90)/90 × 100 = 10%" },
  { question: "5 learners improve by 20 marks each. Total improvement?", answer: 100, explanation: "5 × 20 = 100" }
];

// EXTREME – Resource Allocation (teachers needed, absenteeism change)
export const extremeQuestions: PrincipalQuestion[] = [
  { question: "School has 120 learners. Each teacher can manage 30 learners. How many teachers needed?", answer: 4, explanation: "120 ÷ 30 = 4" },
  { question: "Absenteeism drops from 15% to 10%. Class of 40. How many more learners attend?", answer: 2, explanation: "15% of 40 = 6 absent, 10% = 4 absent; 2 more attend" },
  { question: "90 learners. 30 per teacher. How many teachers needed?", answer: 3, explanation: "90 ÷ 30 = 3" },
  { question: "Absenteeism 20% to 12%. Class of 50. How many more attend?", answer: 4, explanation: "10 absent → 6 absent; 4 more attend" },
  { question: "150 learners. 25 per teacher. How many teachers needed?", answer: 6, explanation: "150 ÷ 25 = 6" },
  { question: "Absenteeism 10% to 5%. Class of 60. How many more attend?", answer: 3, explanation: "6 absent → 3 absent; 3 more attend" },
  { question: "80 learners. 20 per teacher. How many teachers needed?", answer: 4, explanation: "80 ÷ 20 = 4" },
  { question: "Absenteeism 25% to 15%. Class of 40. How many more attend?", answer: 4, explanation: "10 absent → 6 absent; 4 more attend" },
  { question: "200 learners. 40 per teacher. How many teachers needed?", answer: 5, explanation: "200 ÷ 40 = 5" },
  { question: "Absenteeism 18% to 10%. Class of 50. How many more attend?", answer: 4, explanation: "9 absent → 5 absent; 4 more attend" },
  { question: "60 learners. 15 per teacher. How many teachers needed?", answer: 4, explanation: "60 ÷ 15 = 4" },
  { question: "Absenteeism 20% to 8%. Class of 25. How many more attend?", answer: 3, explanation: "5 absent → 2 absent; 3 more attend" },
  { question: "180 learners. 36 per teacher. How many teachers needed?", answer: 5, explanation: "180 ÷ 36 = 5" },
  { question: "Absenteeism 12% to 6%. Class of 50. How many more attend?", answer: 3, explanation: "6 absent → 3 absent; 3 more attend" },
  { question: "100 learners. 25 per teacher. How many teachers needed?", answer: 4, explanation: "100 ÷ 25 = 4" },
  { question: "Absenteeism 15% to 5%. Class of 60. How many more attend?", answer: 6, explanation: "9 absent → 3 absent; 6 more attend" },
  { question: "140 learners. 28 per teacher. How many teachers needed?", answer: 5, explanation: "140 ÷ 28 = 5" },
  { question: "Absenteeism 22% to 14%. Class of 50. How many more attend?", answer: 4, explanation: "11 absent → 7 absent; 4 more attend" },
  { question: "75 learners. 25 per teacher. How many teachers needed?", answer: 3, explanation: "75 ÷ 25 = 3" },
  { question: "Absenteeism 20% to 10%. Class of 30. How many more learners attend?", answer: 3, explanation: "6 absent → 3 absent; 3 more attend" }
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
