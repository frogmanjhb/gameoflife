// Lawyer – Legal Reasoning Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface LawyerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Fair Distribution (equal sharing, simple fine reductions)
const easyQuestions: LawyerQuestion[] = [
  { question: 'R1,000 shared equally by 2 people. How much each (R)?', answer: 500, explanation: '1,000 ÷ 2 = R500' },
  { question: 'R600 shared equally by 3 people. How much each (R)?', answer: 200, explanation: '600 ÷ 3 = R200' },
  { question: 'R800 shared equally by 4 people. How much each (R)?', answer: 200, explanation: '800 ÷ 4 = R200' },
  { question: 'R1,000 shared equally by 5 people. How much each (R)?', answer: 200, explanation: '1,000 ÷ 5 = R200' },
  { question: 'R2,000 shared equally by 4 people. How much each (R)?', answer: 500, explanation: '2,000 ÷ 4 = R500' },
  { question: 'A fine of R500 is reduced by 10%. What is the new fine (R)?', answer: 450, explanation: '500 × 0.90 = R450' },
  { question: 'A fine of R1,000 is reduced by 10%. What is the new fine (R)?', answer: 900, explanation: '1,000 × 0.90 = R900' },
  { question: 'A fine of R200 is reduced by 50%. What is the new fine (R)?', answer: 100, explanation: '200 × 0.50 = R100' },
  { question: 'A fine of R400 is reduced by 25%. What is the new fine (R)?', answer: 300, explanation: '400 × 0.75 = R300' },
  { question: 'A fine of R1,000 is reduced by 20%. What is the new fine (R)?', answer: 800, explanation: '1,000 × 0.80 = R800' },
  { question: 'R900 shared equally by 3 people. How much each (R)?', answer: 300, explanation: '900 ÷ 3 = R300' },
  { question: 'R1,200 shared equally by 6 people. How much each (R)?', answer: 200, explanation: '1,200 ÷ 6 = R200' },
  { question: 'R2,500 shared equally by 5 people. How much each (R)?', answer: 500, explanation: '2,500 ÷ 5 = R500' },
  { question: 'A fine of R300 is reduced by 10%. What is the new fine (R)?', answer: 270, explanation: '300 × 0.90 = R270' },
  { question: 'A fine of R600 is reduced by 20%. What is the new fine (R)?', answer: 480, explanation: '600 × 0.80 = R480' },
  { question: 'R4,000 shared equally by 8 people. How much each (R)?', answer: 500, explanation: '4,000 ÷ 8 = R500' },
  { question: 'R1,500 shared equally by 3 people. How much each (R)?', answer: 500, explanation: '1,500 ÷ 3 = R500' },
  { question: 'A fine of R100 is reduced by 50%. What is the new fine (R)?', answer: 50, explanation: '100 × 0.50 = R50' },
  { question: 'R3,000 shared equally by 10 people. How much each (R)?', answer: 300, explanation: '3,000 ÷ 10 = R300' },
  { question: 'A fine of R800 is reduced by 25%. What is the new fine (R)?', answer: 600, explanation: '800 × 0.75 = R600' }
];

// MEDIUM – Contract Terms (10%, 20%, 25% on round amounts)
const mediumQuestions: LawyerQuestion[] = [
  { question: 'Late fee is 10% of R1,000 owed. How much is the fee (R)?', answer: 100, explanation: '1,000 × 0.10 = R100' },
  { question: 'A deposit of 10% is needed on R2,000. How much is the deposit (R)?', answer: 200, explanation: '2,000 × 0.10 = R200' },
  { question: 'Late fee is 20% of R500 owed. How much is the fee (R)?', answer: 100, explanation: '500 × 0.20 = R100' },
  { question: 'A deposit of 20% is needed on R1,000. How much is the deposit (R)?', answer: 200, explanation: '1,000 × 0.20 = R200' },
  { question: 'Penalty is 10% of R2,000 owed. How much is the penalty (R)?', answer: 200, explanation: '2,000 × 0.10 = R200' },
  { question: 'A deposit of 50% is needed on R200. How much is the deposit (R)?', answer: 100, explanation: '200 × 0.50 = R100' },
  { question: 'Late fee is 10% of R3,000 owed. How much is the fee (R)?', answer: 300, explanation: '3,000 × 0.10 = R300' },
  { question: 'A deposit of 10% is needed on R5,000. How much is the deposit (R)?', answer: 500, explanation: '5,000 × 0.10 = R500' },
  { question: 'Penalty is 20% of R1,500 owed. How much is the penalty (R)?', answer: 300, explanation: '1,500 × 0.20 = R300' },
  { question: 'A deposit of 25% is needed on R4,000. How much is the deposit (R)?', answer: 1000, explanation: '4,000 × 0.25 = R1,000' },
  { question: 'Penalty is 10% of R4,000 owed. How much is the penalty (R)?', answer: 400, explanation: '4,000 × 0.10 = R400' },
  { question: 'A deposit of 20% is needed on R2,500. How much is the deposit (R)?', answer: 500, explanation: '2,500 × 0.20 = R500' },
  { question: 'Late fee is 25% of R400 owed. How much is the fee (R)?', answer: 100, explanation: '400 × 0.25 = R100' },
  { question: 'A deposit of 10% is needed on R10,000. How much is the deposit (R)?', answer: 1000, explanation: '10,000 × 0.10 = R1,000' },
  { question: 'Penalty is 20% of R2,500 owed. How much is the penalty (R)?', answer: 500, explanation: '2,500 × 0.20 = R500' },
  { question: 'Late fee is 10% of R500 owed. How much is the fee (R)?', answer: 50, explanation: '500 × 0.10 = R50' },
  { question: 'A deposit of 25% is needed on R800. How much is the deposit (R)?', answer: 200, explanation: '800 × 0.25 = R200' },
  { question: 'Penalty is 10% of R600 owed. How much is the penalty (R)?', answer: 60, explanation: '600 × 0.10 = R60' },
  { question: 'A deposit of 20% is needed on R5,000. How much is the deposit (R)?', answer: 1000, explanation: '5,000 × 0.20 = R1,000' },
  { question: 'Late fee is 20% of R250 owed. How much is the fee (R)?', answer: 50, explanation: '250 × 0.20 = R50' }
];

// HARD – Proportional Justice (one penalty step or double/triple fines)
const hardQuestions: LawyerQuestion[] = [
  { question: 'Damage is R1,000. Penalty is 10% of damage. How much is paid (R)?', answer: 100, explanation: '1,000 × 0.10 = R100' },
  { question: 'Damage is R2,000. Penalty is 10% of damage. How much is paid (R)?', answer: 200, explanation: '2,000 × 0.10 = R200' },
  { question: 'Damage is R500. Penalty is 20% of damage. How much is paid (R)?', answer: 100, explanation: '500 × 0.20 = R100' },
  { question: 'First fine is R100. A second offence doubles the fine. Second fine (R)?', answer: 200, explanation: '100 × 2 = R200' },
  { question: 'First fine is R200. A second offence doubles the fine. Second fine (R)?', answer: 400, explanation: '200 × 2 = R400' },
  { question: 'First fine is R50. A second offence doubles the fine. Second fine (R)?', answer: 100, explanation: '50 × 2 = R100' },
  { question: 'Damage is R1,500. Penalty is 20% of damage. How much is paid (R)?', answer: 300, explanation: '1,500 × 0.20 = R300' },
  { question: 'Student A caused R1,000 damage. Penalty is 10%. How much does A pay (R)?', answer: 100, explanation: '1,000 × 0.10 = R100' },
  { question: 'Student B caused R2,000 damage. Penalty is 10%. How much does B pay (R)?', answer: 200, explanation: '2,000 × 0.10 = R200' },
  { question: 'First fine is R300. A second offence doubles the fine. Second fine (R)?', answer: 600, explanation: '300 × 2 = R600' },
  { question: 'Damage is R800. Penalty is 25% of damage. How much is paid (R)?', answer: 200, explanation: '800 × 0.25 = R200' },
  { question: 'A fine triples on the third offence. First fine is R100. Third fine (R)?', answer: 300, explanation: '100 × 3 = R300' },
  { question: 'Damage is R4,000. Penalty is 10% of damage. How much is paid (R)?', answer: 400, explanation: '4,000 × 0.10 = R400' },
  { question: 'First fine is R150. A second offence doubles the fine. Second fine (R)?', answer: 300, explanation: '150 × 2 = R300' },
  { question: 'Student A caused R500 damage. Penalty is 20%. How much does A pay (R)?', answer: 100, explanation: '500 × 0.20 = R100' },
  { question: 'Student B caused R1,000 damage. Penalty is 20%. How much does B pay (R)?', answer: 200, explanation: '1,000 × 0.20 = R200' },
  { question: 'First fine is R250. A second offence doubles the fine. Second fine (R)?', answer: 500, explanation: '250 × 2 = R500' },
  { question: 'Damage is R3,000. Penalty is 20% of damage. How much is paid (R)?', answer: 600, explanation: '3,000 × 0.20 = R600' },
  { question: 'First fine is R400. A second offence doubles the fine. Second fine (R)?', answer: 800, explanation: '400 × 2 = R800' },
  { question: 'A fine triples on the third offence. First fine is R50. Third fine (R)?', answer: 150, explanation: '50 × 3 = R150' }
];

// EXTREME – Legal Modelling (simple % + fee, or halve/double a rate)
const extremeQuestions: LawyerQuestion[] = [
  { question: 'Breach: 10% of R1,000 damage plus R100 legal fee. Total owed (R)?', answer: 200, explanation: '100 + 100 = R200' },
  { question: 'Breach: 20% of R500 damage plus R50 legal fee. Total owed (R)?', answer: 150, explanation: '100 + 50 = R150' },
  { question: 'At 10% the town collects R10,000 per week. If the rate is halved to 5%, projected collection (R)?', answer: 5000, explanation: '10,000 ÷ 2 = R5,000' },
  { question: 'At 20% the town collects R20,000 per week. If the rate is halved to 10%, projected collection (R)?', answer: 10000, explanation: '20,000 ÷ 2 = R10,000' },
  { question: 'Breach: 10% of R2,000 damage plus R200 legal fee. Total owed (R)?', answer: 400, explanation: '200 + 200 = R400' },
  { question: 'At 8% the town collects R8,000 per week. If the rate is halved to 4%, projected collection (R)?', answer: 4000, explanation: '8,000 ÷ 2 = R4,000' },
  { question: 'Breach: 25% of R400 damage plus R100 legal fee. Total owed (R)?', answer: 200, explanation: '100 + 100 = R200' },
  { question: 'At 10% the town collects R5,000 per week. If the rate is halved to 5%, projected collection (R)?', answer: 2500, explanation: '5,000 ÷ 2 = R2,500' },
  { question: 'Breach: 20% of R1,000 damage plus R100 legal fee. Total owed (R)?', answer: 300, explanation: '200 + 100 = R300' },
  { question: 'At 12% the town collects R12,000 per week. If the rate is halved to 6%, projected collection (R)?', answer: 6000, explanation: '12,000 ÷ 2 = R6,000' },
  { question: 'Breach: 10% of R5,000 damage plus R500 legal fee. Total owed (R)?', answer: 1000, explanation: '500 + 500 = R1,000' },
  { question: 'At 15% the town collects R15,000 per week. If the rate is cut to 5% (one third), projected collection (R)?', answer: 5000, explanation: '15,000 ÷ 3 = R5,000' },
  { question: 'Breach: 50% of R200 damage plus R50 legal fee. Total owed (R)?', answer: 150, explanation: '100 + 50 = R150' },
  { question: 'At 10% the town collects R2,000 per week. If the rate doubles to 20%, projected collection (R)?', answer: 4000, explanation: '2,000 × 2 = R4,000' },
  { question: 'Breach: 15% of R2,000 damage plus R100 legal fee. Total owed (R)?', answer: 400, explanation: '300 + 100 = R400' },
  { question: 'At 20% the town collects R4,000 per week. If the rate is halved to 10%, projected collection (R)?', answer: 2000, explanation: '4,000 ÷ 2 = R2,000' },
  { question: 'Breach: 10% of R3,000 damage plus R150 legal fee. Total owed (R)?', answer: 450, explanation: '300 + 150 = R450' },
  { question: 'At 25% the town collects R10,000 per week. If the rate is cut to 5% (one fifth), projected collection (R)?', answer: 2000, explanation: '10,000 ÷ 5 = R2,000' },
  { question: 'Breach: 20% of R2,500 damage plus R250 legal fee. Total owed (R)?', answer: 750, explanation: '500 + 250 = R750' },
  { question: 'At 10% the town collects R1,000 per week. If the rate is halved to 5%, projected collection (R)?', answer: 500, explanation: '1,000 ÷ 2 = R500' }
];

export function getLawyerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): LawyerQuestion {
  let questions: LawyerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
