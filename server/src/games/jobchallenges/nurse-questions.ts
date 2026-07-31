// Nurse – Health Support Challenge (Health Check Cycle)
// 20 questions per difficulty tier. All numeric answers.

export interface NurseQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Counting & Recording (totals, addition, basic %)
export const easyQuestions: NurseQuestion[] = [
  { question: "5 learners visit the sick bay before assembly. 6 visit after assembly. Total visits?", answer: 11, explanation: "5 + 6 = 11" },
  { question: "Out of 48 learners in Grade 5, 12 report feeling nauseous. What percentage is that?", answer: 25, explanation: "12 ÷ 48 × 100 = 25%" },
  { question: "4 first-aid visits in the morning. 9 in the afternoon. Total visits?", answer: 13, explanation: "4 + 9 = 13" },
  { question: "Out of 35 hostel boarders, 7 feel unwell. What percentage?", answer: 20, explanation: "7 ÷ 35 × 100 = 20%" },
  { question: "8 learners with headaches before break. 3 after break. Total visits?", answer: 11, explanation: "8 + 3 = 11" },
  { question: "Out of 30 learners, 6 report stomach cramps. What percentage?", answer: 20, explanation: "6 ÷ 30 × 100 = 20%" },
  { question: "3 sprained wrists logged Monday. 7 minor scrapes logged Tuesday. Total injury reports?", answer: 10, explanation: "3 + 7 = 10" },
  { question: "Out of 55 learners on a field trip, 11 feel unwell. What percentage?", answer: 20, explanation: "11 ÷ 55 × 100 = 20%" },
  { question: "6 clinic visits during first period. 4 during last period. Total visits?", answer: 10, explanation: "6 + 4 = 10" },
  { question: "Out of 40 learners in the art club, 8 report sore throats. What percentage?", answer: 20, explanation: "8 ÷ 40 × 100 = 20%" },
  { question: "5 allergy cases and 6 hay-fever cases today. Total health logs?", answer: 11, explanation: "5 + 6 = 11" },
  { question: "Out of 32 learners in music class, 8 feel dizzy. What percentage?", answer: 25, explanation: "8 ÷ 32 × 100 = 25%" },
  { question: "7 morning check-ins at the clinic. 5 afternoon check-ins. Total visits?", answer: 12, explanation: "7 + 5 = 12" },
  { question: "Out of 25 learners in the debate club, 5 report fatigue. What percentage?", answer: 20, explanation: "5 ÷ 25 × 100 = 20%" },
  { question: "9 learners with blisters from camp. 3 with sunburn. Total cases?", answer: 12, explanation: "9 + 3 = 12" },
  { question: "Out of 50 learners, 10 report anxiety before tests. What percentage?", answer: 20, explanation: "10 ÷ 50 × 100 = 20%" },
  { question: "2 learners faint during PE. 8 more report feeling faint later. Total cases?", answer: 10, explanation: "2 + 8 = 10" },
  { question: "Out of 64 learners in the hall, 16 cough during assembly. What percentage?", answer: 25, explanation: "16 ÷ 64 × 100 = 25%" },
  { question: "12 learners need ice packs. 3 need bandages. Total treatments logged?", answer: 15, explanation: "12 + 3 = 15" },
  { question: "Out of 30 learners in the choir, 6 miss practice due to illness. What percentage?", answer: 20, explanation: "6 ÷ 30 × 100 = 20%" }
];

// MEDIUM – Time & Monitoring (time intervals, frequency, ratio/groups)
export const mediumQuestions: NurseQuestion[] = [
  { question: "A diabetic learner needs glucose checks every 20 minutes. Clinic open for 2 hours. How many checks?", answer: 6, explanation: "120 ÷ 20 = 6" },
  { question: "15 learners need wound care. Nurse can treat 3 at a time. How many groups?", answer: 5, explanation: "15 ÷ 3 = 5 groups" },
  { question: "Temperature checks every 20 minutes during a 1-hour exam. How many checks?", answer: 3, explanation: "60 ÷ 20 = 3" },
  { question: "18 learners queue for medication. Nurse dispenses to 6 at a time. How many groups?", answer: 3, explanation: "18 ÷ 6 = 3 groups" },
  { question: "A learner on observation needs checks every 15 minutes. Shift = 2 hours. How many checks?", answer: 8, explanation: "120 ÷ 15 = 8" },
  { question: "10 learners need ice-bath rotation. Nurse handles 2 at a time. How many groups?", answer: 5, explanation: "10 ÷ 2 = 5 groups" },
  { question: "Blood-pressure readings every 30 minutes. Clinic open for 3 hours. How many readings?", answer: 6, explanation: "180 ÷ 30 = 6" },
  { question: "20 learners need eye drops. Nurse assists 5 at a time. How many groups?", answer: 4, explanation: "20 ÷ 5 = 4 groups" },
  { question: "Vital signs checked every 30 minutes during a 2-hour sports match. How many checks?", answer: 4, explanation: "120 ÷ 30 = 4" },
  { question: "16 learners need splints fitted. Nurse can fit 4 at a time. How many groups?", answer: 4, explanation: "16 ÷ 4 = 4 groups" },
  { question: "Asthma inhaler checks every 15 minutes. After-school care = 3 hours. How many checks?", answer: 12, explanation: "180 ÷ 15 = 12" },
  { question: "24 learners need hearing tests. Nurse tests 6 at a time. How many groups?", answer: 4, explanation: "24 ÷ 6 = 4 groups" },
  { question: "Hydration checks every 20 minutes during a 2-hour hike. How many checks?", answer: 6, explanation: "120 ÷ 20 = 6" },
  { question: "28 learners need vaccination forms. Nurse processes 7 at a time. How many groups?", answer: 4, explanation: "28 ÷ 7 = 4 groups" },
  { question: "Pulse checks every 15 minutes during a 2-hour rehearsal. How many checks?", answer: 8, explanation: "120 ÷ 15 = 8" },
  { question: "14 learners need crutch training. Nurse trains 2 at a time. How many groups?", answer: 7, explanation: "14 ÷ 2 = 7 groups" },
  { question: "Allergy spot-checks every 30 minutes. Field trip = 5 hours. How many checks?", answer: 10, explanation: "300 ÷ 30 = 10" },
  { question: "27 learners need height-and-weight recording. Nurse records 9 at a time. How many groups?", answer: 3, explanation: "27 ÷ 9 = 3 groups" },
  { question: "Breathing exercises every 15 minutes during a 1-hour session. How many sessions?", answer: 4, explanation: "60 ÷ 15 = 4" },
  { question: "25 learners need dental screening. Nurse screens 5 at a time. How many groups?", answer: 5, explanation: "25 ÷ 5 = 5 groups" }
];

// HARD – Dosage-Style & Resource Use (ml per student, stock remaining)
export const hardQuestions: NurseQuestion[] = [
  { question: "Each learner needs 5 ml of cough syrup. 8 learners need treatment. Total ml needed?", answer: 40, explanation: "5 × 8 = 40 ml" },
  { question: "Clinic has 135 plasters. 33 used during athletics. How many remain?", answer: 102, explanation: "135 - 33 = 102" },
  { question: "Each learner needs 7 ml of antihistamine. 6 learners treated. Total ml?", answer: 42, explanation: "7 × 6 = 42 ml" },
  { question: "Clinic has 110 gauze pads. 24 used on wounds. How many remain?", answer: 86, explanation: "110 - 24 = 86" },
  { question: "Each learner needs 6 ml of pain relief. 7 learners need doses. Total ml needed?", answer: 42, explanation: "6 × 7 = 42 ml" },
  { question: "Clinic has 88 thermometer covers. 31 used this week. How many remain?", answer: 57, explanation: "88 - 31 = 57" },
  { question: "Each learner needs 10 ml of rehydration fluid. 5 learners treated. Total ml?", answer: 50, explanation: "10 × 5 = 50 ml" },
  { question: "Clinic has 175 gloves. 47 pairs used. How many remain?", answer: 128, explanation: "175 - 47 = 128" },
  { question: "Each learner needs 4 ml of eye drops. 12 learners treated. Total ml needed?", answer: 48, explanation: "4 × 12 = 48 ml" },
  { question: "Clinic has 92 cotton swabs. 28 used. How many remain?", answer: 64, explanation: "92 - 28 = 64" },
  { question: "Each learner needs 9 ml of vitamin supplement. 5 learners treated. Total ml?", answer: 45, explanation: "9 × 5 = 45 ml" },
  { question: "Clinic has 68 ice packs. 19 used at rugby. How many remain?", answer: 49, explanation: "68 - 19 = 49" },
  { question: "Each learner needs 8 ml of throat spray. 6 learners treated. Total ml needed?", answer: 48, explanation: "8 × 6 = 48 ml" },
  { question: "Clinic has 145 face masks. 57 used during flu season. How many remain?", answer: 88, explanation: "145 - 57 = 88" },
  { question: "Each learner needs 3 ml of nasal spray. 14 learners treated. Total ml?", answer: 42, explanation: "3 × 14 = 42 ml" },
  { question: "Clinic has 240 bandages. 68 used after a camp trip. How many remain?", answer: 172, explanation: "240 - 68 = 172" },
  { question: "Each learner needs 6 ml of antacid. 9 learners treated. Total ml needed?", answer: 54, explanation: "6 × 9 = 54 ml" },
  { question: "Clinic has 56 sanitiser bottles. 14 emptied. How many remain?", answer: 42, explanation: "56 - 14 = 42" },
  { question: "Each learner needs 15 ml of electrolyte drink. 4 learners treated. Total ml?", answer: 60, explanation: "15 × 4 = 60 ml" },
  { question: "Clinic has 118 tongue depressors. 43 used. How many remain?", answer: 75, explanation: "118 - 43 = 75" }
];

// EXTREME – Health Trend Analysis (% increase in sick, % decrease in absenteeism)
export const extremeQuestions: NurseQuestion[] = [
  { question: "Week 1: 10 sick learners. Week 2: 15 sick learners. What percentage increase?", answer: 50, explanation: "(15-10)/10 × 100 = 50%" },
  { question: "Absenteeism dropped from 20% to 12%. What is percentage decrease?", answer: 40, explanation: "(20-12)/20 × 100 = 40%" },
  { question: "Week 1: 7 sick. Week 2: 11 sick. What percentage increase?", answer: 57.14, explanation: "(11-7)/7 × 100 ≈ 57.14%" },
  { question: "Absenteeism dropped from 15% to 9%. What is percentage decrease?", answer: 40, explanation: "(15-9)/15 × 100 = 40%" },
  { question: "Week 1: 12 sick. Week 2: 18 sick. What percentage increase?", answer: 50, explanation: "(18-12)/12 × 100 = 50%" },
  { question: "Absenteeism dropped from 28% to 21%. What is percentage decrease?", answer: 25, explanation: "(28-21)/28 × 100 = 25%" },
  { question: "Week 1: 8 sick. Week 2: 13 sick. What percentage increase?", answer: 62.5, explanation: "(13-8)/8 × 100 = 62.5%" },
  { question: "Absenteeism dropped from 24% to 18%. What is percentage decrease?", answer: 25, explanation: "(24-18)/24 × 100 = 25%" },
  { question: "Week 1: 15 sick. Week 2: 22 sick. What percentage increase?", answer: 46.67, explanation: "(22-15)/15 × 100 ≈ 46.67%" },
  { question: "Absenteeism dropped from 18% to 12%. What is percentage decrease?", answer: 33.33, explanation: "(18-12)/18 × 100 ≈ 33.33%" },
  { question: "Week 1: 6 sick. Week 2: 9 sick. What percentage increase?", answer: 50, explanation: "(9-6)/6 × 100 = 50%" },
  { question: "Absenteeism dropped from 32% to 24%. What is percentage decrease?", answer: 25, explanation: "(32-24)/32 × 100 = 25%" },
  { question: "Week 1: 11 sick. Week 2: 18 sick. What percentage increase?", answer: 63.64, explanation: "(18-11)/11 × 100 ≈ 63.64%" },
  { question: "Absenteeism dropped from 26% to 19%. What is percentage decrease?", answer: 26.92, explanation: "(26-19)/26 × 100 ≈ 26.92%" },
  { question: "Week 1: 18 sick. Week 2: 27 sick. What percentage increase?", answer: 50, explanation: "(27-18)/18 × 100 = 50%" },
  { question: "Absenteeism dropped from 16% to 10%. What is percentage decrease?", answer: 37.5, explanation: "(16-10)/16 × 100 = 37.5%" },
  { question: "Week 1: 9 sick. Week 2: 14 sick. What percentage increase?", answer: 55.56, explanation: "(14-9)/9 × 100 ≈ 55.56%" },
  { question: "Absenteeism dropped from 22% to 16%. What is percentage decrease?", answer: 27.27, explanation: "(22-16)/22 × 100 ≈ 27.27%" },
  { question: "Week 1: 20 sick. Week 2: 30 sick. What percentage increase?", answer: 50, explanation: "(30-20)/20 × 100 = 50%" },
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
