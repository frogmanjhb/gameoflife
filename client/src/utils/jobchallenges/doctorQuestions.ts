// Doctor – Public Health & Biome Challenge (Health Investigation) – client, same as server
// 20 questions per difficulty tier. All numeric answers.

export interface DoctorQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: DoctorQuestion[] = [
  { question: "In a class of 30 learners, 6 have flu. What percentage is affected?", answer: 20, explanation: "6 ÷ 30 × 100 = 20%" },
  { question: "4 learners report dehydration symptoms. 2 more the next day. Total cases?", answer: 6, explanation: "4 + 2 = 6" },
  { question: "In a class of 25, 5 have gastro. What percentage is affected?", answer: 20, explanation: "5 ÷ 25 × 100 = 20%" },
  { question: "3 learners with allergies. 4 more report symptoms. Total cases?", answer: 7, explanation: "3 + 4 = 7" },
  { question: "In a class of 40, 8 have flu. What percentage?", answer: 20, explanation: "8 ÷ 40 × 100 = 20%" },
  { question: "5 dehydration cases Monday. 3 Tuesday. Total cases?", answer: 8, explanation: "5 + 3 = 8" },
  { question: "In a class of 20, 4 have asthma. What percentage is affected?", answer: 20, explanation: "4 ÷ 20 × 100 = 20%" },
  { question: "2 flu cases. 6 more the next day. Total cases?", answer: 8, explanation: "2 + 6 = 8" },
  { question: "In a class of 35, 7 report gastro. What percentage?", answer: 20, explanation: "7 ÷ 35 × 100 = 20%" },
  { question: "6 allergy cases. 2 dehydration. Total illness reports?", answer: 8, explanation: "6 + 2 = 8" },
  { question: "In a class of 50, 10 have flu. What percentage is affected?", answer: 20, explanation: "10 ÷ 50 × 100 = 20%" },
  { question: "1 asthma case. 5 flu cases. Total cases?", answer: 6, explanation: "1 + 5 = 6" },
  { question: "In a class of 15, 3 have dehydration symptoms. What percentage?", answer: 20, explanation: "3 ÷ 15 × 100 = 20%" },
  { question: "7 gastro cases. 1 more. Total cases?", answer: 8, explanation: "7 + 1 = 8" },
  { question: "In a class of 45, 9 have allergies. What percentage is affected?", answer: 20, explanation: "9 ÷ 45 × 100 = 20%" },
  { question: "3 dehydration. 4 flu. Total cases?", answer: 7, explanation: "3 + 4 = 7" },
  { question: "In a class of 60, 12 report illness. What percentage?", answer: 20, explanation: "12 ÷ 60 × 100 = 20%" },
  { question: "5 asthma. 3 gastro. Total cases?", answer: 8, explanation: "5 + 3 = 8" },
  { question: "In a class of 10, 2 have flu. What percentage is affected?", answer: 20, explanation: "2 ÷ 10 × 100 = 20%" },
  { question: "0 dehydration Monday. 8 Tuesday. Total cases?", answer: 8, explanation: "0 + 8 = 8" }
];

const mediumQuestions: DoctorQuestion[] = [
  { question: "Week 1: 5 flu cases. Week 2: 8 cases. What is percentage increase?", answer: 60, explanation: "(8-5)/5 × 100 = 60%" },
  { question: "Asthma cases rise from 3 to 6 during pollen season. What is percentage increase?", answer: 100, explanation: "(6-3)/3 × 100 = 100%" },
  { question: "Week 1: 4 flu cases. Week 2: 7 cases. What is percentage increase?", answer: 75, explanation: "(7-4)/4 × 100 = 75%" },
  { question: "Gastro cases rise from 2 to 5. What is percentage increase?", answer: 150, explanation: "(5-2)/2 × 100 = 150%" },
  { question: "Week 1: 10 flu cases. Week 2: 14 cases. What is percentage increase?", answer: 40, explanation: "(14-10)/10 × 100 = 40%" },
  { question: "Dehydration cases rise from 4 to 6. What is percentage increase?", answer: 50, explanation: "(6-4)/4 × 100 = 50%" },
  { question: "Week 1: 6 flu cases. Week 2: 9 cases. What is percentage increase?", answer: 50, explanation: "(9-6)/6 × 100 = 50%" },
  { question: "Allergy cases rise from 5 to 10. What is percentage increase?", answer: 100, explanation: "(10-5)/5 × 100 = 100%" },
  { question: "Week 1: 8 flu cases. Week 2: 12 cases. What is percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" },
  { question: "Asthma cases rise from 2 to 4. What is percentage increase?", answer: 100, explanation: "(4-2)/2 × 100 = 100%" },
  { question: "Week 1: 3 flu cases. Week 2: 6 cases. What is percentage increase?", answer: 100, explanation: "(6-3)/3 × 100 = 100%" },
  { question: "Gastro cases rise from 6 to 9. What is percentage increase?", answer: 50, explanation: "(9-6)/6 × 100 = 50%" },
  { question: "Week 1: 7 flu cases. Week 2: 11 cases. What is percentage increase?", answer: 57.14, explanation: "(11-7)/7 × 100 ≈ 57.14%" },
  { question: "Dehydration cases rise from 3 to 5. What is percentage increase?", answer: 66.67, explanation: "(5-3)/3 × 100 ≈ 66.67%" },
  { question: "Week 1: 12 flu cases. Week 2: 18 cases. What is percentage increase?", answer: 50, explanation: "(18-12)/12 × 100 = 50%" },
  { question: "Allergy cases rise from 4 to 7. What is percentage increase?", answer: 75, explanation: "(7-4)/4 × 100 = 75%" },
  { question: "Week 1: 9 flu cases. Week 2: 15 cases. What is percentage increase?", answer: 66.67, explanation: "(15-9)/9 × 100 ≈ 66.67%" },
  { question: "Asthma cases rise from 5 to 8. What is percentage increase?", answer: 60, explanation: "(8-5)/5 × 100 = 60%" },
  { question: "Week 1: 11 flu cases. Week 2: 16 cases. What is percentage increase?", answer: 45.45, explanation: "(16-11)/11 × 100 ≈ 45.45%" },
  { question: "Gastro cases rise from 8 to 12. What is percentage increase?", answer: 50, explanation: "(12-8)/8 × 100 = 50%" }
];

const hardQuestions: DoctorQuestion[] = [
  { question: "Clinic has 50 rehydration sachets. Each patient needs 2. How many patients can be treated?", answer: 25, explanation: "50 ÷ 2 = 25" },
  { question: "Town population = 100. 15% infected. How many infected?", answer: 15, explanation: "100 × 0.15 = 15" },
  { question: "Clinic has 60 sachets. Each patient needs 3. How many patients?", answer: 20, explanation: "60 ÷ 3 = 20" },
  { question: "Town population = 80. 25% infected. How many infected?", answer: 20, explanation: "80 × 0.25 = 20" },
  { question: "Clinic has 40 rehydration sachets. Each patient needs 2. How many patients?", answer: 20, explanation: "40 ÷ 2 = 20" },
  { question: "Town population = 120. 10% infected. How many infected?", answer: 12, explanation: "120 × 0.10 = 12" },
  { question: "Clinic has 36 sachets. Each patient needs 4. How many patients?", answer: 9, explanation: "36 ÷ 4 = 9" },
  { question: "Town population = 50. 20% infected. How many infected?", answer: 10, explanation: "50 × 0.20 = 10" },
  { question: "Clinic has 45 sachets. Each patient needs 5. How many patients?", answer: 9, explanation: "45 ÷ 5 = 9" },
  { question: "Town population = 200. 15% infected. How many infected?", answer: 30, explanation: "200 × 0.15 = 30" },
  { question: "Clinic has 24 rehydration sachets. Each patient needs 2. How many patients?", answer: 12, explanation: "24 ÷ 2 = 12" },
  { question: "Town population = 150. 20% infected. How many infected?", answer: 30, explanation: "150 × 0.20 = 30" },
  { question: "Clinic has 70 sachets. Each patient needs 2. How many patients?", answer: 35, explanation: "70 ÷ 2 = 35" },
  { question: "Town population = 90. 10% infected. How many infected?", answer: 9, explanation: "90 × 0.10 = 9" },
  { question: "Clinic has 48 sachets. Each patient needs 4. How many patients?", answer: 12, explanation: "48 ÷ 4 = 12" },
  { question: "Town population = 60. 25% infected. How many infected?", answer: 15, explanation: "60 × 0.25 = 15" },
  { question: "Clinic has 30 rehydration sachets. Each patient needs 3. How many patients?", answer: 10, explanation: "30 ÷ 3 = 10" },
  { question: "Town population = 40. 15% infected. How many infected?", answer: 6, explanation: "40 × 0.15 = 6" },
  { question: "Clinic has 56 sachets. Each patient needs 7. How many patients?", answer: 8, explanation: "56 ÷ 7 = 8" },
  { question: "Town population = 250. 12% infected. How many infected?", answer: 30, explanation: "250 × 0.12 = 30" }
];

const extremeQuestions: DoctorQuestion[] = [
  { question: "10 learners infected. Cases increase by 20% next week. How many cases?", answer: 12, explanation: "10 × 1.20 = 12" },
  { question: "Outbreak affects 25% of workforce. Town has 80 workers. How many absent?", answer: 20, explanation: "80 × 0.25 = 20" },
  { question: "5 learners infected. Cases increase by 40% next week. How many cases?", answer: 7, explanation: "5 × 1.40 = 7" },
  { question: "Outbreak affects 15% of workforce. Town has 100 workers. How many absent?", answer: 15, explanation: "100 × 0.15 = 15" },
  { question: "20 learners infected. Cases increase by 25% next week. How many cases?", answer: 25, explanation: "20 × 1.25 = 25" },
  { question: "Outbreak affects 30% of workforce. Town has 50 workers. How many absent?", answer: 15, explanation: "50 × 0.30 = 15" },
  { question: "8 learners infected. Cases increase by 50% next week. How many cases?", answer: 12, explanation: "8 × 1.50 = 12" },
  { question: "Outbreak affects 20% of workforce. Town has 120 workers. How many absent?", answer: 24, explanation: "120 × 0.20 = 24" },
  { question: "15 learners infected. Cases increase by 20% next week. How many cases?", answer: 18, explanation: "15 × 1.20 = 18" },
  { question: "Outbreak affects 10% of workforce. Town has 90 workers. How many absent?", answer: 9, explanation: "90 × 0.10 = 9" },
  { question: "6 learners infected. Cases increase by 33.33% next week. How many cases (round to whole)?", answer: 8, explanation: "6 × 1.333 ≈ 8" },
  { question: "Outbreak affects 40% of workforce. Town has 60 workers. How many absent?", answer: 24, explanation: "60 × 0.40 = 24" },
  { question: "12 learners infected. Cases increase by 25% next week. How many cases?", answer: 15, explanation: "12 × 1.25 = 15" },
  { question: "Outbreak affects 35% of workforce. Town has 40 workers. How many absent?", answer: 14, explanation: "40 × 0.35 = 14" },
  { question: "25 learners infected. Cases increase by 20% next week. How many cases?", answer: 30, explanation: "25 × 1.20 = 30" },
  { question: "Outbreak affects 50% of workforce. Town has 30 workers. How many absent?", answer: 15, explanation: "30 × 0.50 = 15" },
  { question: "9 learners infected. Cases increase by 33.33% next week. How many cases (round to whole)?", answer: 12, explanation: "9 × 1.333 ≈ 12" },
  { question: "Outbreak affects 22% of workforce. Town has 100 workers. How many absent?", answer: 22, explanation: "100 × 0.22 = 22" },
  { question: "14 learners infected. Cases increase by 50% next week. How many cases?", answer: 21, explanation: "14 × 1.50 = 21" },
  { question: "Outbreak affects 18% of workforce. Town has 200 workers. How many absent?", answer: 36, explanation: "200 × 0.18 = 36" }
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
