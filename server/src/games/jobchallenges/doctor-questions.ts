// Doctor – Public Health & Biome Challenge (Health Investigation)
// 20 questions per difficulty tier. All numeric answers.

export interface DoctorQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Common Illness Tracking (%, totals, basic rates)
export const easyQuestions: DoctorQuestion[] = [
  { question: "Grade 7A has 28 learners. 7 report measles symptoms. What percentage is affected?", answer: 25, explanation: "7 ÷ 28 × 100 = 25%" },
  { question: "3 learners with conjunctivitis on Monday. 5 more on Tuesday. Total cases?", answer: 8, explanation: "3 + 5 = 8" },
  { question: "In a hostel of 24 boarders, 6 have chickenpox. What percentage is affected?", answer: 25, explanation: "6 ÷ 24 × 100 = 25%" },
  { question: "After sports day, 2 learners show heat exhaustion. 6 more the next morning. Total cases?", answer: 8, explanation: "2 + 6 = 8" },
  { question: "Class 5B has 32 learners. 8 have sore throats. What percentage?", answer: 25, explanation: "8 ÷ 32 × 100 = 25%" },
  { question: "4 gastro cases on Wednesday. 5 on Thursday. Total cases?", answer: 9, explanation: "4 + 5 = 9" },
  { question: "In a class of 36, 9 learners have hay fever during spring. What percentage?", answer: 25, explanation: "9 ÷ 36 × 100 = 25%" },
  { question: "1 flu case Monday. 7 more by Friday. Total flu cases?", answer: 8, explanation: "1 + 7 = 8" },
  { question: "Grade 8C has 42 learners. 21 report head lice. What percentage is affected?", answer: 50, explanation: "21 ÷ 42 × 100 = 50%" },
  { question: "8 allergy cases and 3 skin rashes logged today. Total illness reports?", answer: 11, explanation: "8 + 3 = 11" },
  { question: "During assembly, 12 of 48 learners start coughing. What percentage?", answer: 25, explanation: "12 ÷ 48 × 100 = 25%" },
  { question: "2 asthma flare-ups plus 4 flu cases this week. Total cases?", answer: 6, explanation: "2 + 4 = 6" },
  { question: "In a class of 16, 4 learners have ringworm. What percentage is affected?", answer: 25, explanation: "4 ÷ 16 × 100 = 25%" },
  { question: "9 dehydration cases Monday. 2 more Tuesday. Total cases?", answer: 11, explanation: "9 + 2 = 11" },
  { question: "Grade 9 has 55 learners. 11 report migraines. What percentage?", answer: 20, explanation: "11 ÷ 55 × 100 = 20%" },
  { question: "5 food-poisoning cases plus 6 gastro cases. Total reports?", answer: 11, explanation: "5 + 6 = 11" },
  { question: "In a class of 72, 18 have a stomach bug. What percentage is affected?", answer: 25, explanation: "18 ÷ 72 × 100 = 25%" },
  { question: "3 learners with ear infections. 9 more over the week. Total cases?", answer: 12, explanation: "3 + 9 = 12" },
  { question: "A small class of 12 learners. 3 have mumps. What percentage is affected?", answer: 25, explanation: "3 ÷ 12 × 100 = 25%" },
  { question: "No heat-stroke cases Monday. 11 reported Tuesday. Total cases?", answer: 11, explanation: "0 + 11 = 11" }
];

// MEDIUM – Spread & Growth (% increase)
export const mediumQuestions: DoctorQuestion[] = [
  { question: "Week 1: 6 flu cases at the clinic. Week 2: 10 cases. What is percentage increase?", answer: 66.67, explanation: "(10-6)/6 × 100 ≈ 66.67%" },
  { question: "Conjunctivitis cases rise from 4 to 10 after dusty winds. What is percentage increase?", answer: 150, explanation: "(10-4)/4 × 100 = 150%" },
  { question: "Week 1: 7 sore-throat cases. Week 2: 11 cases. What is percentage increase?", answer: 57.14, explanation: "(11-7)/7 × 100 ≈ 57.14%" },
  { question: "Heat-exhaustion cases rise from 3 to 9 after a heatwave. What is percentage increase?", answer: 200, explanation: "(9-3)/3 × 100 = 200%" },
  { question: "Week 1: 15 gastro cases. Week 2: 21 cases. What is percentage increase?", answer: 40, explanation: "(21-15)/15 × 100 = 40%" },
  { question: "Hay-fever cases rise from 8 to 12 during peak pollen. What is percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" },
  { question: "Week 1: 9 flu cases. Week 2: 14 cases. What is percentage increase?", answer: 55.56, explanation: "(14-9)/9 × 100 ≈ 55.56%" },
  { question: "Chickenpox cases rise from 5 to 15 in one dormitory. What is percentage increase?", answer: 200, explanation: "(15-5)/5 × 100 = 200%" },
  { question: "Week 1: 12 measles cases. Week 2: 18 cases. What is percentage increase?", answer: 50, explanation: "(18-12)/12 × 100 = 50%" },
  { question: "Asthma cases rise from 6 to 9 after cold weather. What is percentage increase?", answer: 50, explanation: "(9-6)/6 × 100 = 50%" },
  { question: "Week 1: 4 flu cases. Week 2: 9 cases. What is percentage increase?", answer: 125, explanation: "(9-4)/4 × 100 = 125%" },
  { question: "Lice cases rise from 10 to 16 after a school camp. What is percentage increase?", answer: 60, explanation: "(16-10)/10 × 100 = 60%" },
  { question: "Week 1: 8 gastro cases. Week 2: 13 cases. What is percentage increase?", answer: 62.5, explanation: "(13-8)/8 × 100 = 62.5%" },
  { question: "Dehydration cases rise from 6 to 10 after athletics day. What is percentage increase?", answer: 66.67, explanation: "(10-6)/6 × 100 ≈ 66.67%" },
  { question: "Week 1: 20 flu cases. Week 2: 30 cases. What is percentage increase?", answer: 50, explanation: "(30-20)/20 × 100 = 50%" },
  { question: "Allergy cases rise from 7 to 11 after a field trip. What is percentage increase?", answer: 57.14, explanation: "(11-7)/7 × 100 ≈ 57.14%" },
  { question: "Week 1: 11 flu cases. Week 2: 17 cases. What is percentage increase?", answer: 54.55, explanation: "(17-11)/11 × 100 ≈ 54.55%" },
  { question: "Ringworm cases rise from 3 to 8 in the rugby team. What is percentage increase?", answer: 166.67, explanation: "(8-3)/3 × 100 ≈ 166.67%" },
  { question: "Week 1: 13 gastro cases. Week 2: 19 cases. What is percentage increase?", answer: 46.15, explanation: "(19-13)/13 × 100 ≈ 46.15%" },
  { question: "Migraine cases rise from 4 to 7 during exam week. What is percentage increase?", answer: 75, explanation: "(7-4)/4 × 100 = 75%" }
];

// HARD – Resource Allocation (sachets per patient, % infected → count)
export const hardQuestions: DoctorQuestion[] = [
  { question: "The clinic received 72 oral rehydration sachets. Each patient needs 3 sachets. How many patients can be treated?", answer: 24, explanation: "72 ÷ 3 = 24" },
  { question: "A town of 150 residents. 12% show flu symptoms. How many are infected?", answer: 18, explanation: "150 × 0.12 = 18" },
  { question: "Mobile clinic has 84 fever-relief packs. Each patient needs 4 packs. How many patients?", answer: 21, explanation: "84 ÷ 4 = 21" },
  { question: "Town population = 200. 18% report gastro. How many affected?", answer: 36, explanation: "200 × 0.18 = 36" },
  { question: "55 antibiotic doses available. Each patient needs 5 doses. How many patients can be treated?", answer: 11, explanation: "55 ÷ 5 = 11" },
  { question: "A village of 125 people. 16% have measles. How many infected?", answer: 20, explanation: "125 × 0.16 = 20" },
  { question: "Clinic stock: 96 vitamin C tablets. Each patient gets 6 tablets. How many patients?", answer: 16, explanation: "96 ÷ 6 = 16" },
  { question: "Town population = 180. 15% show allergy symptoms. How many affected?", answer: 27, explanation: "180 × 0.15 = 27" },
  { question: "63 cough-syrup bottles. Each patient needs 7 bottles. How many patients?", answer: 9, explanation: "63 ÷ 7 = 9" },
  { question: "A township of 220 residents. 10% have TB symptoms. How many cases?", answer: 22, explanation: "220 × 0.10 = 22" },
  { question: "108 rehydration sachets delivered. Each patient needs 3. How many patients?", answer: 36, explanation: "108 ÷ 3 = 36" },
  { question: "Town population = 140. 25% report a stomach bug. How many affected?", answer: 35, explanation: "140 × 0.25 = 35" },
  { question: "80 antiseptic wipes. Each wound needs 4 wipes. How many wounds can be treated?", answer: 20, explanation: "80 ÷ 4 = 20" },
  { question: "A farm community of 75 workers. 20% have heat exhaustion. How many cases?", answer: 15, explanation: "75 × 0.20 = 15" },
  { question: "45 malaria test kits. Each patient needs 3 kits. How many patients can be tested?", answer: 15, explanation: "45 ÷ 3 = 15" },
  { question: "Town population = 300. 8% show chickenpox. How many infected?", answer: 24, explanation: "300 × 0.08 = 24" },
  { question: "64 pain-relief tablets. Each patient gets 8 tablets. How many patients?", answer: 8, explanation: "64 ÷ 8 = 8" },
  { question: "A school town of 95 learners. 20% have conjunctivitis. How many cases?", answer: 19, explanation: "95 × 0.20 = 19" },
  { question: "90 electrolyte sachets. Each athlete needs 5 sachets. How many athletes can be treated?", answer: 18, explanation: "90 ÷ 5 = 18" },
  { question: "Town population = 250. 14% report flu. How many infected?", answer: 35, explanation: "250 × 0.14 = 35" }
];

// EXTREME – Outbreak Modelling (spread %, % of workforce)
export const extremeQuestions: DoctorQuestion[] = [
  { question: "12 learners infected with flu. Cases increase by 25% next week. How many cases?", answer: 15, explanation: "12 × 1.25 = 15" },
  { question: "Outbreak affects 28% of workforce. Town has 75 shop workers. How many absent?", answer: 21, explanation: "75 × 0.28 = 21" },
  { question: "5 learners infected. Cases increase by 40% next week. How many cases?", answer: 7, explanation: "5 × 1.40 = 7" },
  { question: "Outbreak affects 18% of workforce. Town has 150 factory workers. How many absent?", answer: 27, explanation: "150 × 0.18 = 27" },
  { question: "16 measles cases. Cases increase by 25% next week. How many cases?", answer: 20, explanation: "16 × 1.25 = 20" },
  { question: "Outbreak affects 35% of workforce. Town has 80 farm workers. How many absent?", answer: 28, explanation: "80 × 0.35 = 28" },
  { question: "10 gastro cases. Cases increase by 30% next week. How many cases?", answer: 13, explanation: "10 × 1.30 = 13" },
  { question: "Outbreak affects 12% of workforce. Town has 250 office workers. How many absent?", answer: 30, explanation: "250 × 0.12 = 30" },
  { question: "15 flu cases. Cases increase by 20% next week. How many cases?", answer: 18, explanation: "15 × 1.20 = 18" },
  { question: "Outbreak affects 22% of workforce. Town has 100 municipal workers. How many absent?", answer: 22, explanation: "100 × 0.22 = 22" },
  { question: "9 learners infected. Cases increase by 33.33% next week. How many cases (round to whole)?", answer: 12, explanation: "9 × 1.333 ≈ 12" },
  { question: "Outbreak affects 45% of workforce. Town has 60 restaurant staff. How many absent?", answer: 27, explanation: "60 × 0.45 = 27" },
  { question: "20 chickenpox cases. Cases increase by 25% next week. How many cases?", answer: 25, explanation: "20 × 1.25 = 25" },
  { question: "Outbreak affects 16% of workforce. Town has 125 teachers. How many absent?", answer: 20, explanation: "125 × 0.16 = 20" },
  { question: "30 flu cases. Cases increase by 20% next week. How many cases?", answer: 36, explanation: "30 × 1.20 = 36" },
  { question: "Outbreak affects 50% of workforce. Town has 44 delivery drivers. How many absent?", answer: 22, explanation: "44 × 0.50 = 22" },
  { question: "12 allergy cases. Cases increase by 50% next week. How many cases?", answer: 18, explanation: "12 × 1.50 = 18" },
  { question: "Outbreak affects 24% of workforce. Town has 175 construction workers. How many absent?", answer: 42, explanation: "175 × 0.24 = 42" },
  { question: "14 gastro cases. Cases increase by 50% next week. How many cases?", answer: 21, explanation: "14 × 1.50 = 21" },
  { question: "Outbreak affects 15% of workforce. Town has 280 retail workers. How many absent?", answer: 42, explanation: "280 × 0.15 = 42" }
];

export function getDoctorQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): DoctorQuestion {
  let questions: DoctorQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
