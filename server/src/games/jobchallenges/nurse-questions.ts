// Nurse – Health Support Challenge (Health Check Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface NurseQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Counting & Recording (totals, addition, basic %)
export const easyQuestions: NurseQuestion[] = [
  { question: "6 learners visit the sick bay before break. 4 visit after break. Total visits?", answer: 10, explanation: "6 + 4 = 10" },
  { question: "Out of 32 learners in Grade 6, 8 report feeling dizzy. What percentage is that?", answer: 25, explanation: "8 ÷ 32 × 100 = 25%" },
  { question: "3 first-aid visits in the morning. 8 in the afternoon. Total visits?", answer: 11, explanation: "3 + 8 = 11" },
  { question: "Out of 40 hostel boarders, 6 feel unwell. What percentage?", answer: 15, explanation: "6 ÷ 40 × 100 = 15%" },
  { question: "9 learners with headaches before lunch. 2 after lunch. Total visits?", answer: 11, explanation: "9 + 2 = 11" },
  { question: "Out of 28 learners, 7 report stomach cramps. What percentage?", answer: 25, explanation: "7 ÷ 28 × 100 = 25%" },
  { question: "2 sprained ankles logged Monday. 9 minor cuts logged Tuesday. Total injury reports?", answer: 11, explanation: "2 + 9 = 11" },
  { question: "Out of 50 learners on the sports tour, 5 feel unwell. What percentage?", answer: 10, explanation: "5 ÷ 50 × 100 = 10%" },
  { question: "7 clinic visits during first period. 3 during last period. Total visits?", answer: 10, explanation: "7 + 3 = 10" },
  { question: "Out of 36 learners in the drama group, 9 report sore throats. What percentage?", answer: 25, explanation: "9 ÷ 36 × 100 = 25%" },
  { question: "4 allergy cases and 7 hay-fever cases today. Total health logs?", answer: 11, explanation: "4 + 7 = 11" },
  { question: "Out of 24 learners in the science lab, 6 feel nauseous. What percentage?", answer: 25, explanation: "6 ÷ 24 × 100 = 25%" },
  { question: "10 morning check-ins at the clinic. 1 afternoon check-in. Total visits?", answer: 11, explanation: "10 + 1 = 11" },
  { question: "Out of 20 learners in the chess club, 3 report fatigue. What percentage?", answer: 15, explanation: "3 ÷ 20 × 100 = 15%" },
  { question: "8 learners with blisters from hiking. 4 with sunburn. Total cases?", answer: 12, explanation: "8 + 4 = 12" },
  { question: "Out of 45 learners, 9 report anxiety before exams. What percentage?", answer: 20, explanation: "9 ÷ 45 × 100 = 20%" },
  { question: "1 learner faints in assembly. 10 more report feeling faint later. Total cases?", answer: 11, explanation: "1 + 10 = 11" },
  { question: "Out of 60 learners in the hall, 12 cough during the programme. What percentage?", answer: 20, explanation: "12 ÷ 60 × 100 = 20%" },
  { question: "11 learners need ice packs. 2 need bandages. Total treatments logged?", answer: 13, explanation: "11 + 2 = 13" },
  { question: "Out of 25 learners in the choir, 5 miss practice due to illness. What percentage?", answer: 20, explanation: "5 ÷ 25 × 100 = 20%" }
];

// MEDIUM – Time & Monitoring (time intervals, frequency, ratio/groups)
export const mediumQuestions: NurseQuestion[] = [
  { question: "A diabetic learner needs glucose checks every 20 minutes. School day = 2 hours. How many checks?", answer: 6, explanation: "120 ÷ 20 = 6" },
  { question: "12 learners need wound care. Nurse can treat 3 at a time. How many groups?", answer: 4, explanation: "12 ÷ 3 = 4 groups" },
  { question: "Temperature checks every 15 minutes during a 1-hour exam. How many checks?", answer: 4, explanation: "60 ÷ 15 = 4" },
  { question: "15 learners queue for medication. Nurse dispenses to 5 at a time. How many groups?", answer: 3, explanation: "15 ÷ 5 = 3 groups" },
  { question: "A learner on observation needs checks every 30 minutes. Shift = 2 hours. How many checks?", answer: 4, explanation: "120 ÷ 30 = 4" },
  { question: "8 learners need ice-bath rotation. Nurse handles 2 at a time. How many groups?", answer: 4, explanation: "8 ÷ 2 = 4 groups" },
  { question: "Blood-pressure readings every 25 minutes. Clinic open for 2.5 hours. How many readings?", answer: 6, explanation: "150 ÷ 25 = 6" },
  { question: "18 learners need eye drops. Nurse assists 6 at a time. How many groups?", answer: 3, explanation: "18 ÷ 6 = 3 groups" },
  { question: "Vital signs checked every 40 minutes during a 2-hour sports match. How many checks?", answer: 3, explanation: "120 ÷ 40 = 3" },
  { question: "14 learners need splints fitted. Nurse can fit 2 at a time. How many groups?", answer: 7, explanation: "14 ÷ 2 = 7 groups" },
  { question: "Asthma inhaler checks every 20 minutes. After-school care = 4 hours. How many checks?", answer: 12, explanation: "240 ÷ 20 = 12" },
  { question: "16 learners need hearing tests. Nurse tests 4 at a time. How many groups?", answer: 4, explanation: "16 ÷ 4 = 4 groups" },
  { question: "Hydration checks every 30 minutes during a 3-hour hike. How many checks?", answer: 6, explanation: "180 ÷ 30 = 6" },
  { question: "21 learners need vaccination forms. Nurse processes 7 at a time. How many groups?", answer: 3, explanation: "21 ÷ 7 = 3 groups" },
  { question: "Pulse checks every 10 minutes during a 1.5-hour rehearsal. How many checks?", answer: 9, explanation: "90 ÷ 10 = 9" },
  { question: "10 learners need crutch training. Nurse trains 2 at a time. How many groups?", answer: 5, explanation: "10 ÷ 2 = 5 groups" },
  { question: "Allergy spot-checks every 45 minutes. Field trip = 4.5 hours. How many checks?", answer: 6, explanation: "270 ÷ 45 = 6" },
  { question: "24 learners need height-and-weight recording. Nurse records 8 at a time. How many groups?", answer: 3, explanation: "24 ÷ 8 = 3 groups" },
  { question: "Breathing exercises every 12 minutes during a 1-hour session. How many sessions?", answer: 5, explanation: "60 ÷ 12 = 5" },
  { question: "20 learners need dental screening. Nurse screens 4 at a time. How many groups?", answer: 5, explanation: "20 ÷ 4 = 5 groups" }
];

// HARD – Dosage-Style & Resource Use (ml per student, stock remaining)
export const hardQuestions: NurseQuestion[] = [
  { question: "Each learner needs 6 ml of cough syrup. 7 learners need treatment. Total ml needed?", answer: 42, explanation: "6 × 7 = 42 ml" },
  { question: "Clinic has 120 plasters. 28 used during sports day. How many remain?", answer: 92, explanation: "120 - 28 = 92" },
  { question: "Each learner needs 8 ml of antihistamine. 5 learners treated. Total ml?", answer: 40, explanation: "8 × 5 = 40 ml" },
  { question: "Clinic has 95 gauze pads. 17 used on wounds. How many remain?", answer: 78, explanation: "95 - 17 = 78" },
  { question: "Each learner needs 4 ml of pain relief. 9 learners need doses. Total ml needed?", answer: 36, explanation: "4 × 9 = 36 ml" },
  { question: "Clinic has 70 thermometer covers. 22 used this week. How many remain?", answer: 48, explanation: "70 - 22 = 48" },
  { question: "Each learner needs 11 ml of rehydration fluid. 4 learners treated. Total ml?", answer: 44, explanation: "11 × 4 = 44 ml" },
  { question: "Clinic has 150 gloves. 38 pairs used. How many remain?", answer: 112, explanation: "150 - 38 = 112" },
  { question: "Each learner needs 3 ml of eye drops. 11 learners treated. Total ml needed?", answer: 33, explanation: "3 × 11 = 33 ml" },
  { question: "Clinic has 85 cotton swabs. 19 used. How many remain?", answer: 66, explanation: "85 - 19 = 66" },
  { question: "Each learner needs 7 ml of vitamin supplement. 6 learners treated. Total ml?", answer: 42, explanation: "7 × 6 = 42 ml" },
  { question: "Clinic has 55 ice packs. 13 used at athletics. How many remain?", answer: 42, explanation: "55 - 13 = 42" },
  { question: "Each learner needs 9 ml of throat spray. 5 learners treated. Total ml needed?", answer: 45, explanation: "9 × 5 = 45 ml" },
  { question: "Clinic has 130 face masks. 42 used during flu season. How many remain?", answer: 88, explanation: "130 - 42 = 88" },
  { question: "Each learner needs 2 ml of nasal spray. 13 learners treated. Total ml?", answer: 26, explanation: "2 × 13 = 26 ml" },
  { question: "Clinic has 210 bandages. 55 used after a camp trip. How many remain?", answer: 155, explanation: "210 - 55 = 155" },
  { question: "Each learner needs 5 ml of antacid. 10 learners treated. Total ml needed?", answer: 50, explanation: "5 × 10 = 50 ml" },
  { question: "Clinic has 48 sanitiser bottles. 11 emptied. How many remain?", answer: 37, explanation: "48 - 11 = 37" },
  { question: "Each learner needs 12 ml of electrolyte drink. 3 learners treated. Total ml?", answer: 36, explanation: "12 × 3 = 36 ml" },
  { question: "Clinic has 105 tongue depressors. 30 used. How many remain?", answer: 75, explanation: "105 - 30 = 75" }
];

// EXTREME – Health Trend Analysis (% increase in sick, % decrease in absenteeism)
export const extremeQuestions: NurseQuestion[] = [
  { question: "Week 1: 8 sick learners. Week 2: 12 sick learners. What percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" },
  { question: "Absenteeism dropped from 16% to 10%. What is percentage decrease?", answer: 37.5, explanation: "(16-10)/16 × 100 = 37.5%" },
  { question: "Week 1: 5 sick. Week 2: 8 sick. What percentage increase?", answer: 60, explanation: "(8-5)/5 × 100 = 60%" },
  { question: "Absenteeism dropped from 20% to 14%. What is percentage decrease?", answer: 30, explanation: "(20-14)/20 × 100 = 30%" },
  { question: "Week 1: 14 sick. Week 2: 21 sick. What percentage increase?", answer: 50, explanation: "(21-14)/14 × 100 = 50%" },
  { question: "Absenteeism dropped from 24% to 16%. What is percentage decrease?", answer: 33.33, explanation: "(24-16)/24 × 100 ≈ 33.33%" },
  { question: "Week 1: 6 sick. Week 2: 10 sick. What percentage increase?", answer: 66.67, explanation: "(10-6)/6 × 100 ≈ 66.67%" },
  { question: "Absenteeism dropped from 12% to 7%. What is percentage decrease?", answer: 41.67, explanation: "(12-7)/12 × 100 ≈ 41.67%" },
  { question: "Week 1: 10 sick. Week 2: 16 sick. What percentage increase?", answer: 60, explanation: "(16-10)/10 × 100 = 60%" },
  { question: "Absenteeism dropped from 18% to 11%. What is percentage decrease?", answer: 38.89, explanation: "(18-11)/18 × 100 ≈ 38.89%" },
  { question: "Week 1: 4 sick. Week 2: 7 sick. What percentage increase?", answer: 75, explanation: "(7-4)/4 × 100 = 75%" },
  { question: "Absenteeism dropped from 30% to 18%. What is percentage decrease?", answer: 40, explanation: "(30-18)/30 × 100 = 40%" },
  { question: "Week 1: 9 sick. Week 2: 14 sick. What percentage increase?", answer: 55.56, explanation: "(14-9)/9 × 100 ≈ 55.56%" },
  { question: "Absenteeism dropped from 22% to 15%. What is percentage decrease?", answer: 31.82, explanation: "(22-15)/22 × 100 ≈ 31.82%" },
  { question: "Week 1: 16 sick. Week 2: 24 sick. What percentage increase?", answer: 50, explanation: "(24-16)/16 × 100 = 50%" },
  { question: "Absenteeism dropped from 14% to 8%. What is percentage decrease?", answer: 42.86, explanation: "(14-8)/14 × 100 ≈ 42.86%" },
  { question: "Week 1: 11 sick. Week 2: 17 sick. What percentage increase?", answer: 54.55, explanation: "(17-11)/11 × 100 ≈ 54.55%" },
  { question: "Absenteeism dropped from 25% to 17%. What is percentage decrease?", answer: 32, explanation: "(25-17)/25 × 100 = 32%" },
  { question: "Week 1: 13 sick. Week 2: 19 sick. What percentage increase?", answer: 46.15, explanation: "(19-13)/13 × 100 ≈ 46.15%" },
  { question: "Absenteeism dropped from 10% to 5%. What is percentage decrease?", answer: 50, explanation: "(10-5)/10 × 100 = 50%" }
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
