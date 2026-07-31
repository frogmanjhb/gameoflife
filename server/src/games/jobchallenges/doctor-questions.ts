// Doctor – Public Health & Biome Challenge (Health Investigation)
// 20 questions per difficulty tier. All numeric answers.

export interface DoctorQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Common Illness Tracking (%, totals, basic rates)
export const easyQuestions: DoctorQuestion[] = [
  { question: "Grade 6B has 36 learners. 9 report measles symptoms. What percentage is affected?", answer: 25, explanation: "9 ÷ 36 × 100 = 25%" },
  { question: "4 learners with conjunctivitis on Monday. 6 more on Tuesday. Total cases?", answer: 10, explanation: "4 + 6 = 10" },
  { question: "In a hostel of 28 boarders, 7 have chickenpox. What percentage is affected?", answer: 25, explanation: "7 ÷ 28 × 100 = 25%" },
  { question: "After cross-country, 3 learners show heat exhaustion. 5 more the next morning. Total cases?", answer: 8, explanation: "3 + 5 = 8" },
  { question: "Class 4A has 40 learners. 10 have sore throats. What percentage?", answer: 25, explanation: "10 ÷ 40 × 100 = 25%" },
  { question: "6 gastro cases on Tuesday. 4 on Wednesday. Total cases?", answer: 10, explanation: "6 + 4 = 10" },
  { question: "In a class of 44, 11 learners have hay fever during spring. What percentage?", answer: 25, explanation: "11 ÷ 44 × 100 = 25%" },
  { question: "2 flu cases Monday. 6 more by Friday. Total flu cases?", answer: 8, explanation: "2 + 6 = 8" },
  { question: "Grade 7D has 38 learners. 19 report head lice. What percentage is affected?", answer: 50, explanation: "19 ÷ 38 × 100 = 50%" },
  { question: "7 allergy cases and 4 skin rashes logged today. Total illness reports?", answer: 11, explanation: "7 + 4 = 11" },
  { question: "During assembly, 15 of 60 learners start coughing. What percentage?", answer: 25, explanation: "15 ÷ 60 × 100 = 25%" },
  { question: "3 asthma flare-ups plus 5 flu cases this week. Total cases?", answer: 8, explanation: "3 + 5 = 8" },
  { question: "In a class of 20, 5 learners have ringworm. What percentage is affected?", answer: 25, explanation: "5 ÷ 20 × 100 = 25%" },
  { question: "8 dehydration cases Monday. 3 more Tuesday. Total cases?", answer: 11, explanation: "8 + 3 = 11" },
  { question: "Grade 10 has 60 learners. 12 report migraines. What percentage?", answer: 20, explanation: "12 ÷ 60 × 100 = 20%" },
  { question: "4 food-poisoning cases plus 7 gastro cases. Total reports?", answer: 11, explanation: "4 + 7 = 11" },
  { question: "In a class of 80, 20 have a stomach bug. What percentage is affected?", answer: 25, explanation: "20 ÷ 80 × 100 = 25%" },
  { question: "5 learners with ear infections. 7 more over the week. Total cases?", answer: 12, explanation: "5 + 7 = 12" },
  { question: "A small class of 16 learners. 4 have mumps. What percentage is affected?", answer: 25, explanation: "4 ÷ 16 × 100 = 25%" },
  { question: "1 heat-stroke case Monday. 9 reported Tuesday. Total cases?", answer: 10, explanation: "1 + 9 = 10" }
];

// MEDIUM – Spread & Growth (% increase)
export const mediumQuestions: DoctorQuestion[] = [
  { question: "Week 1: 8 flu cases at the clinic. Week 2: 12 cases. What is percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" },
  { question: "Conjunctivitis cases rise from 5 to 12 after dusty winds. What is percentage increase?", answer: 140, explanation: "(12-5)/5 × 100 = 140%" },
  { question: "Week 1: 9 sore-throat cases. Week 2: 14 cases. What is percentage increase?", answer: 55.56, explanation: "(14-9)/9 × 100 ≈ 55.56%" },
  { question: "Heat-exhaustion cases rise from 4 to 12 after a heatwave. What is percentage increase?", answer: 200, explanation: "(12-4)/4 × 100 = 200%" },
  { question: "Week 1: 18 gastro cases. Week 2: 27 cases. What is percentage increase?", answer: 50, explanation: "(27-18)/18 × 100 = 50%" },
  { question: "Hay-fever cases rise from 10 to 15 during peak pollen. What is percentage increase?", answer: 50, explanation: "(15-10)/10 × 100 = 50%" },
  { question: "Week 1: 10 flu cases. Week 2: 16 cases. What is percentage increase?", answer: 60, explanation: "(16-10)/10 × 100 = 60%" },
  { question: "Chickenpox cases rise from 6 to 18 in one dormitory. What is percentage increase?", answer: 200, explanation: "(18-6)/6 × 100 = 200%" },
  { question: "Week 1: 14 measles cases. Week 2: 21 cases. What is percentage increase?", answer: 50, explanation: "(21-14)/14 × 100 = 50%" },
  { question: "Asthma cases rise from 8 to 12 after cold weather. What is percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" },
  { question: "Week 1: 5 flu cases. Week 2: 11 cases. What is percentage increase?", answer: 120, explanation: "(11-5)/5 × 100 = 120%" },
  { question: "Lice cases rise from 12 to 20 after a school camp. What is percentage increase?", answer: 66.67, explanation: "(20-12)/12 × 100 ≈ 66.67%" },
  { question: "Week 1: 10 gastro cases. Week 2: 16 cases. What is percentage increase?", answer: 60, explanation: "(16-10)/10 × 100 = 60%" },
  { question: "Dehydration cases rise from 7 to 12 after athletics day. What is percentage increase?", answer: 71.43, explanation: "(12-7)/7 × 100 ≈ 71.43%" },
  { question: "Week 1: 22 flu cases. Week 2: 33 cases. What is percentage increase?", answer: 50, explanation: "(33-22)/22 × 100 = 50%" },
  { question: "Allergy cases rise from 9 to 14 after a field trip. What is percentage increase?", answer: 55.56, explanation: "(14-9)/9 × 100 ≈ 55.56%" },
  { question: "Week 1: 13 flu cases. Week 2: 20 cases. What is percentage increase?", answer: 53.85, explanation: "(20-13)/13 × 100 ≈ 53.85%" },
  { question: "Ringworm cases rise from 4 to 11 in the hockey team. What is percentage increase?", answer: 175, explanation: "(11-4)/4 × 100 = 175%" },
  { question: "Week 1: 16 gastro cases. Week 2: 24 cases. What is percentage increase?", answer: 50, explanation: "(24-16)/16 × 100 = 50%" },
  { question: "Migraine cases rise from 6 to 11 during exam week. What is percentage increase?", answer: 83.33, explanation: "(11-6)/6 × 100 ≈ 83.33%" }
];

// HARD – Resource Allocation (sachets per patient, % infected → count)
export const hardQuestions: DoctorQuestion[] = [
  { question: "The clinic received 96 oral rehydration sachets. Each patient needs 4 sachets. How many patients can be treated?", answer: 24, explanation: "96 ÷ 4 = 24" },
  { question: "A town of 160 residents. 15% show flu symptoms. How many are infected?", answer: 24, explanation: "160 × 0.15 = 24" },
  { question: "Mobile clinic has 96 fever-relief packs. Each patient needs 3 packs. How many patients?", answer: 32, explanation: "96 ÷ 3 = 32" },
  { question: "Town population = 250. 12% report gastro. How many affected?", answer: 30, explanation: "250 × 0.12 = 30" },
  { question: "60 antibiotic doses available. Each patient needs 4 doses. How many patients can be treated?", answer: 15, explanation: "60 ÷ 4 = 15" },
  { question: "A village of 150 people. 14% have measles. How many infected?", answer: 21, explanation: "150 × 0.14 = 21" },
  { question: "Clinic stock: 108 vitamin C tablets. Each patient gets 9 tablets. How many patients?", answer: 12, explanation: "108 ÷ 9 = 12" },
  { question: "Town population = 200. 18% show allergy symptoms. How many affected?", answer: 36, explanation: "200 × 0.18 = 36" },
  { question: "70 cough-syrup bottles. Each patient needs 7 bottles. How many patients?", answer: 10, explanation: "70 ÷ 7 = 10" },
  { question: "A township of 260 residents. 10% have TB symptoms. How many cases?", answer: 26, explanation: "260 × 0.10 = 26" },
  { question: "120 rehydration sachets delivered. Each patient needs 4. How many patients?", answer: 30, explanation: "120 ÷ 4 = 30" },
  { question: "Town population = 160. 25% report a stomach bug. How many affected?", answer: 40, explanation: "160 × 0.25 = 40" },
  { question: "96 antiseptic wipes. Each wound needs 6 wipes. How many wounds can be treated?", answer: 16, explanation: "96 ÷ 6 = 16" },
  { question: "A farm community of 90 workers. 20% have heat exhaustion. How many cases?", answer: 18, explanation: "90 × 0.20 = 18" },
  { question: "54 malaria test kits. Each patient needs 3 kits. How many patients can be tested?", answer: 18, explanation: "54 ÷ 3 = 18" },
  { question: "Town population = 350. 8% show chickenpox. How many infected?", answer: 28, explanation: "350 × 0.08 = 28" },
  { question: "72 pain-relief tablets. Each patient gets 9 tablets. How many patients?", answer: 8, explanation: "72 ÷ 9 = 8" },
  { question: "A school town of 105 learners. 20% have conjunctivitis. How many cases?", answer: 21, explanation: "105 × 0.20 = 21" },
  { question: "100 electrolyte sachets. Each athlete needs 5 sachets. How many athletes can be treated?", answer: 20, explanation: "100 ÷ 5 = 20" },
  { question: "Town population = 280. 14% report flu. How many infected?", answer: 39.2, explanation: "280 × 0.14 = 39.2" }
];

// EXTREME – Outbreak Modelling (spread %, % of workforce)
export const extremeQuestions: DoctorQuestion[] = [
  { question: "16 learners infected with flu. Cases increase by 25% next week. How many cases?", answer: 20, explanation: "16 × 1.25 = 20" },
  { question: "Outbreak affects 28% of workforce. Town has 75 shop workers. How many absent?", answer: 21, explanation: "75 × 0.28 = 21" },
  { question: "8 learners infected. Cases increase by 50% next week. How many cases?", answer: 12, explanation: "8 × 1.50 = 12" },
  { question: "Outbreak affects 20% of workforce. Town has 160 factory workers. How many absent?", answer: 32, explanation: "160 × 0.20 = 32" },
  { question: "20 measles cases. Cases increase by 25% next week. How many cases?", answer: 25, explanation: "20 × 1.25 = 25" },
  { question: "Outbreak affects 35% of workforce. Town has 80 farm workers. How many absent?", answer: 28, explanation: "80 × 0.35 = 28" },
  { question: "12 gastro cases. Cases increase by 25% next week. How many cases?", answer: 15, explanation: "12 × 1.25 = 15" },
  { question: "Outbreak affects 15% of workforce. Town has 220 office workers. How many absent?", answer: 33, explanation: "220 × 0.15 = 33" },
  { question: "15 flu cases. Cases increase by 20% next week. How many cases?", answer: 18, explanation: "15 × 1.20 = 18" },
  { question: "Outbreak affects 22% of workforce. Town has 100 municipal workers. How many absent?", answer: 22, explanation: "100 × 0.22 = 22" },
  { question: "9 learners infected. Cases increase by 33.33% next week. How many cases (round to whole)?", answer: 12, explanation: "9 × 1.333 ≈ 12" },
  { question: "Outbreak affects 45% of workforce. Town has 60 restaurant staff. How many absent?", answer: 27, explanation: "60 × 0.45 = 27" },
  { question: "24 chickenpox cases. Cases increase by 25% next week. How many cases?", answer: 30, explanation: "24 × 1.25 = 30" },
  { question: "Outbreak affects 16% of workforce. Town has 125 teachers. How many absent?", answer: 20, explanation: "125 × 0.16 = 20" },
  { question: "35 flu cases. Cases increase by 20% next week. How many cases?", answer: 42, explanation: "35 × 1.20 = 42" },
  { question: "Outbreak affects 50% of workforce. Town has 48 delivery drivers. How many absent?", answer: 24, explanation: "48 × 0.50 = 24" },
  { question: "10 allergy cases. Cases increase by 60% next week. How many cases?", answer: 16, explanation: "10 × 1.60 = 16" },
  { question: "Outbreak affects 26% of workforce. Town has 150 construction workers. How many absent?", answer: 39, explanation: "150 × 0.26 = 39" },
  { question: "18 gastro cases. Cases increase by 50% next week. How many cases?", answer: 27, explanation: "18 × 1.50 = 27" },
  { question: "Outbreak affects 15% of workforce. Town has 300 retail workers. How many absent?", answer: 45, explanation: "300 × 0.15 = 45" }
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
