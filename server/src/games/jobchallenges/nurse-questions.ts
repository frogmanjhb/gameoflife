// Nurse – Health Support Challenge (Health Check Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface NurseQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Counting & Recording (totals, addition, basic %)
export const easyQuestions: NurseQuestion[] = [
  { question: "5 students visit the clinic in the morning. 3 visit in the afternoon. Total visits?", answer: 8, explanation: "5 + 3 = 8" },
  { question: "Out of 20 students, 4 report feeling unwell. What percentage is that?", answer: 20, explanation: "4 ÷ 20 × 100 = 20%" },
  { question: "4 students in the morning, 6 in the afternoon. Total clinic visits?", answer: 10, explanation: "4 + 6 = 10" },
  { question: "Out of 25 students, 5 feel unwell. What percentage?", answer: 20, explanation: "5 ÷ 25 × 100 = 20%" },
  { question: "7 morning visits, 2 afternoon visits. Total visits?", answer: 9, explanation: "7 + 2 = 9" },
  { question: "Out of 30 students, 6 report unwell. What percentage?", answer: 20, explanation: "6 ÷ 30 × 100 = 20%" },
  { question: "3 morning, 5 afternoon. Total clinic visits?", answer: 8, explanation: "3 + 5 = 8" },
  { question: "Out of 15 students, 3 feel unwell. What percentage?", answer: 20, explanation: "3 ÷ 15 × 100 = 20%" },
  { question: "6 morning visits, 4 afternoon visits. Total?", answer: 10, explanation: "6 + 4 = 10" },
  { question: "Out of 40 students, 8 report unwell. What percentage?", answer: 20, explanation: "8 ÷ 40 × 100 = 20%" },
  { question: "2 morning, 7 afternoon. Total clinic visits?", answer: 9, explanation: "2 + 7 = 9" },
  { question: "Out of 50 students, 10 feel unwell. What percentage?", answer: 20, explanation: "10 ÷ 50 × 100 = 20%" },
  { question: "8 morning visits, 1 afternoon visit. Total visits?", answer: 9, explanation: "8 + 1 = 9" },
  { question: "Out of 10 students, 2 report unwell. What percentage?", answer: 20, explanation: "2 ÷ 10 × 100 = 20%" },
  { question: "1 morning, 9 afternoon. Total clinic visits?", answer: 10, explanation: "1 + 9 = 10" },
  { question: "Out of 35 students, 7 feel unwell. What percentage?", answer: 20, explanation: "7 ÷ 35 × 100 = 20%" },
  { question: "9 morning visits, 3 afternoon visits. Total?", answer: 12, explanation: "9 + 3 = 12" },
  { question: "Out of 45 students, 9 report unwell. What percentage?", answer: 20, explanation: "9 ÷ 45 × 100 = 20%" },
  { question: "5 morning, 5 afternoon. Total clinic visits?", answer: 10, explanation: "5 + 5 = 10" },
  { question: "Out of 60 students, 12 feel unwell. What percentage?", answer: 20, explanation: "12 ÷ 60 × 100 = 20%" }
];

// MEDIUM – Time & Monitoring (time intervals, frequency, ratio/groups)
export const mediumQuestions: NurseQuestion[] = [
  { question: "A student needs checking every 30 minutes. School day = 3 hours. How many checks?", answer: 6, explanation: "3 × 60 ÷ 30 = 6 checks" },
  { question: "8 students need care. Nurse can assist 2 at a time. How many groups?", answer: 4, explanation: "8 ÷ 2 = 4 groups" },
  { question: "Student needs checking every 20 minutes. School day = 2 hours. How many checks?", answer: 6, explanation: "120 ÷ 20 = 6" },
  { question: "12 students need care. Nurse can assist 3 at a time. How many groups?", answer: 4, explanation: "12 ÷ 3 = 4" },
  { question: "Checking every 15 minutes. School day = 1.5 hours. How many checks?", answer: 6, explanation: "90 ÷ 15 = 6" },
  { question: "6 students need care. Nurse can assist 2 at a time. How many groups?", answer: 3, explanation: "6 ÷ 2 = 3" },
  { question: "Student needs checking every 45 minutes. School day = 3 hours. How many checks?", answer: 4, explanation: "180 ÷ 45 = 4" },
  { question: "10 students need care. Nurse can assist 5 at a time. How many groups?", answer: 2, explanation: "10 ÷ 5 = 2" },
  { question: "Checking every 60 minutes. School day = 4 hours. How many checks?", answer: 4, explanation: "240 ÷ 60 = 4" },
  { question: "9 students need care. Nurse can assist 3 at a time. How many groups?", answer: 3, explanation: "9 ÷ 3 = 3" },
  { question: "Student needs checking every 25 minutes. School day = 2.5 hours. How many checks?", answer: 6, explanation: "150 ÷ 25 = 6" },
  { question: "15 students need care. Nurse can assist 5 at a time. How many groups?", answer: 3, explanation: "15 ÷ 5 = 3" },
  { question: "Checking every 40 minutes. School day = 2 hours. How many checks?", answer: 3, explanation: "120 ÷ 40 = 3" },
  { question: "14 students need care. Nurse can assist 2 at a time. How many groups?", answer: 7, explanation: "14 ÷ 2 = 7" },
  { question: "Student needs checking every 20 minutes. School day = 4 hours. How many checks?", answer: 12, explanation: "240 ÷ 20 = 12" },
  { question: "16 students need care. Nurse can assist 4 at a time. How many groups?", answer: 4, explanation: "16 ÷ 4 = 4" },
  { question: "Checking every 30 minutes. School day = 2.5 hours. How many checks?", answer: 5, explanation: "150 ÷ 30 = 5" },
  { question: "18 students need care. Nurse can assist 6 at a time. How many groups?", answer: 3, explanation: "18 ÷ 6 = 3" },
  { question: "Student needs checking every 45 minutes. School day = 4.5 hours. How many checks?", answer: 6, explanation: "270 ÷ 45 = 6" },
  { question: "20 students need care. Nurse can assist 4 at a time. How many groups?", answer: 5, explanation: "20 ÷ 4 = 5" }
];

// HARD – Dosage-Style & Resource Use (ml per student, stock remaining)
export const hardQuestions: NurseQuestion[] = [
  { question: "Each student needs 5 ml of medicine. 6 students need treatment. Total ml needed?", answer: 30, explanation: "5 × 6 = 30 ml" },
  { question: "Clinic has 100 bandages. 15 used. How many remain?", answer: 85, explanation: "100 - 15 = 85" },
  { question: "Each student needs 10 ml. 4 students need treatment. Total ml?", answer: 40, explanation: "10 × 4 = 40" },
  { question: "Clinic has 80 bandages. 12 used. How many remain?", answer: 68, explanation: "80 - 12 = 68" },
  { question: "Each student needs 3 ml of medicine. 8 students. Total ml needed?", answer: 24, explanation: "3 × 8 = 24" },
  { question: "Clinic has 50 bandages. 20 used. How many remain?", answer: 30, explanation: "50 - 20 = 30" },
  { question: "Each student needs 7 ml. 5 students. Total ml?", answer: 35, explanation: "7 × 5 = 35" },
  { question: "Clinic has 120 bandages. 25 used. How many remain?", answer: 95, explanation: "120 - 25 = 95" },
  { question: "Each student needs 4 ml. 9 students. Total ml needed?", answer: 36, explanation: "4 × 9 = 36" },
  { question: "Clinic has 90 bandages. 18 used. How many remain?", answer: 72, explanation: "90 - 18 = 72" },
  { question: "Each student needs 6 ml. 7 students. Total ml?", answer: 42, explanation: "6 × 7 = 42" },
  { question: "Clinic has 60 bandages. 10 used. How many remain?", answer: 50, explanation: "60 - 10 = 50" },
  { question: "Each student needs 8 ml. 4 students. Total ml needed?", answer: 32, explanation: "8 × 4 = 32" },
  { question: "Clinic has 75 bandages. 30 used. How many remain?", answer: 45, explanation: "75 - 30 = 45" },
  { question: "Each student needs 2 ml. 12 students. Total ml?", answer: 24, explanation: "2 × 12 = 24" },
  { question: "Clinic has 200 bandages. 45 used. How many remain?", answer: 155, explanation: "200 - 45 = 155" },
  { question: "Each student needs 5 ml. 10 students. Total ml needed?", answer: 50, explanation: "5 × 10 = 50" },
  { question: "Clinic has 40 bandages. 8 used. How many remain?", answer: 32, explanation: "40 - 8 = 32" },
  { question: "Each student needs 9 ml. 3 students. Total ml?", answer: 27, explanation: "9 × 3 = 27" },
  { question: "Clinic has 110 bandages. 35 used. How many remain?", answer: 75, explanation: "110 - 35 = 75" }
];

// EXTREME – Health Trend Analysis (% increase in sick, % decrease in absenteeism)
export const extremeQuestions: NurseQuestion[] = [
  { question: "Week 1: 6 sick students. Week 2: 9 sick students. What percentage increase?", answer: 50, explanation: "(9-6)/6 × 100 = 50%" },
  { question: "Absenteeism dropped from 12% to 8%. What is percentage decrease?", answer: 33.33, explanation: "(12-8)/12 × 100 ≈ 33.33%" },
  { question: "Week 1: 4 sick. Week 2: 6 sick. What percentage increase?", answer: 50, explanation: "(6-4)/4 × 100 = 50%" },
  { question: "Absenteeism dropped from 15% to 10%. What is percentage decrease?", answer: 33.33, explanation: "(15-10)/15 × 100 ≈ 33.33%" },
  { question: "Week 1: 10 sick. Week 2: 15 sick. What percentage increase?", answer: 50, explanation: "(15-10)/10 × 100 = 50%" },
  { question: "Absenteeism dropped from 20% to 14%. What is percentage decrease?", answer: 30, explanation: "(20-14)/20 × 100 = 30%" },
  { question: "Week 1: 5 sick. Week 2: 8 sick. What percentage increase?", answer: 60, explanation: "(8-5)/5 × 100 = 60%" },
  { question: "Absenteeism dropped from 18% to 12%. What is percentage decrease?", answer: 33.33, explanation: "(18-12)/18 × 100 ≈ 33.33%" },
  { question: "Week 1: 8 sick. Week 2: 12 sick. What percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" },
  { question: "Absenteeism dropped from 10% to 6%. What is percentage decrease?", answer: 40, explanation: "(10-6)/10 × 100 = 40%" },
  { question: "Week 1: 3 sick. Week 2: 5 sick. What percentage increase?", answer: 66.67, explanation: "(5-3)/3 × 100 ≈ 66.67%" },
  { question: "Absenteeism dropped from 25% to 15%. What is percentage decrease?", answer: 40, explanation: "(25-15)/25 × 100 = 40%" },
  { question: "Week 1: 7 sick. Week 2: 11 sick. What percentage increase?", answer: 57.14, explanation: "(11-7)/7 × 100 ≈ 57.14%" },
  { question: "Absenteeism dropped from 16% to 10%. What is percentage decrease?", answer: 37.5, explanation: "(16-10)/16 × 100 = 37.5%" },
  { question: "Week 1: 12 sick. Week 2: 18 sick. What percentage increase?", answer: 50, explanation: "(18-12)/12 × 100 = 50%" },
  { question: "Absenteeism dropped from 14% to 8%. What is percentage decrease?", answer: 42.86, explanation: "(14-8)/14 × 100 ≈ 42.86%" },
  { question: "Week 1: 9 sick. Week 2: 14 sick. What percentage increase?", answer: 55.56, explanation: "(14-9)/9 × 100 ≈ 55.56%" },
  { question: "Absenteeism dropped from 22% to 16%. What is percentage decrease?", answer: 27.27, explanation: "(22-16)/22 × 100 ≈ 27.27%" },
  { question: "Week 1: 11 sick. Week 2: 16 sick. What percentage increase?", answer: 45.45, explanation: "(16-11)/11 × 100 ≈ 45.45%" },
  { question: "Absenteeism dropped from 8% to 4%. What is percentage decrease?", answer: 50, explanation: "(8-4)/8 × 100 = 50%" }
];

export function getNurseQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): NurseQuestion {
  let questions: NurseQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
