// Lawyer – Legal Reasoning Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface LawyerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Fair Distribution (equal sharing, simple fine reductions)
const easyQuestions: LawyerQuestion[] = [
  { question: 'R1,400 shared equally by 2 people. How much each (R)?', answer: 700, explanation: '1,400 ÷ 2 = R700' },
  { question: 'R900 shared equally by 3 people. How much each (R)?', answer: 300, explanation: '900 ÷ 3 = R300' },
  { question: 'R1,600 shared equally by 4 people. How much each (R)?', answer: 400, explanation: '1,600 ÷ 4 = R400' },
  { question: 'R1,500 shared equally by 5 people. How much each (R)?', answer: 300, explanation: '1,500 ÷ 5 = R300' },
  { question: 'R3,600 shared equally by 6 people. How much each (R)?', answer: 600, explanation: '3,600 ÷ 6 = R600' },
  { question: 'A fine of R600 is reduced by 10%. What is the new fine (R)?', answer: 540, explanation: '600 × 0.90 = R540' },
  { question: 'A fine of R800 is reduced by 20%. What is the new fine (R)?', answer: 640, explanation: '800 × 0.80 = R640' },
  { question: 'A fine of R300 is reduced by 50%. What is the new fine (R)?', answer: 150, explanation: '300 × 0.50 = R150' },
  { question: 'A fine of R500 is reduced by 25%. What is the new fine (R)?', answer: 375, explanation: '500 × 0.75 = R375' },
  { question: 'A fine of R1,200 is reduced by 10%. What is the new fine (R)?', answer: 1080, explanation: '1,200 × 0.90 = R1,080' },
  { question: 'R2,100 shared equally by 7 people. How much each (R)?', answer: 300, explanation: '2,100 ÷ 7 = R300' },
  { question: 'R3,500 shared equally by 5 people. How much each (R)?', answer: 700, explanation: '3,500 ÷ 5 = R700' },
  { question: 'R4,800 shared equally by 8 people. How much each (R)?', answer: 600, explanation: '4,800 ÷ 8 = R600' },
  { question: 'A fine of R450 is reduced by 10%. What is the new fine (R)?', answer: 405, explanation: '450 × 0.90 = R405' },
  { question: 'A fine of R750 is reduced by 20%. What is the new fine (R)?', answer: 600, explanation: '750 × 0.80 = R600' },
  { question: 'R5,600 shared equally by 7 people. How much each (R)?', answer: 800, explanation: '5,600 ÷ 7 = R800' },
  { question: 'R2,400 shared equally by 4 people. How much each (R)?', answer: 600, explanation: '2,400 ÷ 4 = R600' },
  { question: 'A fine of R250 is reduced by 50%. What is the new fine (R)?', answer: 125, explanation: '250 × 0.50 = R125' },
  { question: 'R3,600 shared equally by 9 people. How much each (R)?', answer: 400, explanation: '3,600 ÷ 9 = R400' },
  { question: 'A fine of R900 is reduced by 25%. What is the new fine (R)?', answer: 675, explanation: '900 × 0.75 = R675' }
];

// MEDIUM – Contract Terms (10%, 20%, 25% on round amounts)
const mediumQuestions: LawyerQuestion[] = [
  { question: 'Late fee is 10% of R1,200 owed. How much is the fee (R)?', answer: 120, explanation: '1,200 × 0.10 = R120' },
  { question: 'A deposit of 15% is needed on R2,000. How much is the deposit (R)?', answer: 300, explanation: '2,000 × 0.15 = R300' },
  { question: 'Late fee is 20% of R600 owed. How much is the fee (R)?', answer: 120, explanation: '600 × 0.20 = R120' },
  { question: 'A deposit of 25% is needed on R1,600. How much is the deposit (R)?', answer: 400, explanation: '1,600 × 0.25 = R400' },
  { question: 'Penalty is 10% of R3,500 owed. How much is the penalty (R)?', answer: 350, explanation: '3,500 × 0.10 = R350' },
  { question: 'A deposit of 50% is needed on R300. How much is the deposit (R)?', answer: 150, explanation: '300 × 0.50 = R150' },
  { question: 'Late fee is 10% of R2,500 owed. How much is the fee (R)?', answer: 250, explanation: '2,500 × 0.10 = R250' },
  { question: 'A deposit of 10% is needed on R6,000. How much is the deposit (R)?', answer: 600, explanation: '6,000 × 0.10 = R600' },
  { question: 'Penalty is 20% of R1,800 owed. How much is the penalty (R)?', answer: 360, explanation: '1,800 × 0.20 = R360' },
  { question: 'A deposit of 25% is needed on R3,200. How much is the deposit (R)?', answer: 800, explanation: '3,200 × 0.25 = R800' },
  { question: 'Penalty is 10% of R5,500 owed. How much is the penalty (R)?', answer: 550, explanation: '5,500 × 0.10 = R550' },
  { question: 'A deposit of 20% is needed on R3,000. How much is the deposit (R)?', answer: 600, explanation: '3,000 × 0.20 = R600' },
  { question: 'Late fee is 25% of R800 owed. How much is the fee (R)?', answer: 200, explanation: '800 × 0.25 = R200' },
  { question: 'A deposit of 10% is needed on R12,000. How much is the deposit (R)?', answer: 1200, explanation: '12,000 × 0.10 = R1,200' },
  { question: 'Penalty is 20% of R3,000 owed. How much is the penalty (R)?', answer: 600, explanation: '3,000 × 0.20 = R600' },
  { question: 'Late fee is 10% of R750 owed. How much is the fee (R)?', answer: 75, explanation: '750 × 0.10 = R75' },
  { question: 'A deposit of 25% is needed on R1,200. How much is the deposit (R)?', answer: 300, explanation: '1,200 × 0.25 = R300' },
  { question: 'Penalty is 10% of R850 owed. How much is the penalty (R)?', answer: 85, explanation: '850 × 0.10 = R85' },
  { question: 'A deposit of 20% is needed on R4,500. How much is the deposit (R)?', answer: 900, explanation: '4,500 × 0.20 = R900' },
  { question: 'Late fee is 20% of R350 owed. How much is the fee (R)?', answer: 70, explanation: '350 × 0.20 = R70' }
];

// HARD – Proportional Justice (one penalty step or double/triple fines)
const hardQuestions: LawyerQuestion[] = [
  { question: 'Damage is R1,200. Penalty is 10% of damage. How much is paid (R)?', answer: 120, explanation: '1,200 × 0.10 = R120' },
  { question: 'Damage is R2,500. Penalty is 10% of damage. How much is paid (R)?', answer: 250, explanation: '2,500 × 0.10 = R250' },
  { question: 'Damage is R750. Penalty is 20% of damage. How much is paid (R)?', answer: 150, explanation: '750 × 0.20 = R150' },
  { question: 'First fine is R120. A second offence doubles the fine. Second fine (R)?', answer: 240, explanation: '120 × 2 = R240' },
  { question: 'First fine is R250. A second offence doubles the fine. Second fine (R)?', answer: 500, explanation: '250 × 2 = R500' },
  { question: 'First fine is R75. A second offence doubles the fine. Second fine (R)?', answer: 150, explanation: '75 × 2 = R150' },
  { question: 'Damage is R1,800. Penalty is 20% of damage. How much is paid (R)?', answer: 360, explanation: '1,800 × 0.20 = R360' },
  { question: 'Student A caused R1,500 damage. Penalty is 10%. How much does A pay (R)?', answer: 150, explanation: '1,500 × 0.10 = R150' },
  { question: 'Student B caused R2,400 damage. Penalty is 10%. How much does B pay (R)?', answer: 240, explanation: '2,400 × 0.10 = R240' },
  { question: 'First fine is R350. A second offence doubles the fine. Second fine (R)?', answer: 700, explanation: '350 × 2 = R700' },
  { question: 'Damage is R960. Penalty is 25% of damage. How much is paid (R)?', answer: 240, explanation: '960 × 0.25 = R240' },
  { question: 'A fine triples on the third offence. First fine is R120. Third fine (R)?', answer: 360, explanation: '120 × 3 = R360' },
  { question: 'Damage is R5,000. Penalty is 10% of damage. How much is paid (R)?', answer: 500, explanation: '5,000 × 0.10 = R500' },
  { question: 'First fine is R180. A second offence doubles the fine. Second fine (R)?', answer: 360, explanation: '180 × 2 = R360' },
  { question: 'Student A caused R600 damage. Penalty is 20%. How much does A pay (R)?', answer: 120, explanation: '600 × 0.20 = R120' },
  { question: 'Student B caused R1,250 damage. Penalty is 20%. How much does B pay (R)?', answer: 250, explanation: '1,250 × 0.20 = R250' },
  { question: 'First fine is R275. A second offence doubles the fine. Second fine (R)?', answer: 550, explanation: '275 × 2 = R550' },
  { question: 'Damage is R3,500. Penalty is 20% of damage. How much is paid (R)?', answer: 700, explanation: '3,500 × 0.20 = R700' },
  { question: 'First fine is R450. A second offence doubles the fine. Second fine (R)?', answer: 900, explanation: '450 × 2 = R900' },
  { question: 'A fine triples on the third offence. First fine is R80. Third fine (R)?', answer: 240, explanation: '80 × 3 = R240' }
];

// EXTREME – Legal Modelling (simple % + fee, or halve/double a rate)
const extremeQuestions: LawyerQuestion[] = [
  { question: 'Breach: 10% of R1,500 damage plus R150 legal fee. Total owed (R)?', answer: 300, explanation: '150 + 150 = R300' },
  { question: 'Breach: 20% of R600 damage plus R75 legal fee. Total owed (R)?', answer: 195, explanation: '120 + 75 = R195' },
  { question: 'At 10% the town collects R14,000 per week. If the rate is halved to 5%, projected collection (R)?', answer: 7000, explanation: '14,000 ÷ 2 = R7,000' },
  { question: 'At 20% the town collects R16,000 per week. If the rate is halved to 10%, projected collection (R)?', answer: 8000, explanation: '16,000 ÷ 2 = R8,000' },
  { question: 'Breach: 10% of R3,000 damage plus R250 legal fee. Total owed (R)?', answer: 550, explanation: '300 + 250 = R550' },
  { question: 'At 8% the town collects R6,400 per week. If the rate is halved to 4%, projected collection (R)?', answer: 3200, explanation: '6,400 ÷ 2 = R3,200' },
  { question: 'Breach: 25% of R600 damage plus R120 legal fee. Total owed (R)?', answer: 270, explanation: '150 + 120 = R270' },
  { question: 'At 10% the town collects R7,500 per week. If the rate is halved to 5%, projected collection (R)?', answer: 3750, explanation: '7,500 ÷ 2 = R3,750' },
  { question: 'Breach: 20% of R1,200 damage plus R150 legal fee. Total owed (R)?', answer: 390, explanation: '240 + 150 = R390' },
  { question: 'At 12% the town collects R9,600 per week. If the rate is halved to 6%, projected collection (R)?', answer: 4800, explanation: '9,600 ÷ 2 = R4,800' },
  { question: 'Breach: 10% of R6,000 damage plus R600 legal fee. Total owed (R)?', answer: 1200, explanation: '600 + 600 = R1,200' },
  { question: 'At 15% the town collects R18,000 per week. If the rate is cut to 5% (one third), projected collection (R)?', answer: 6000, explanation: '18,000 ÷ 3 = R6,000' },
  { question: 'Breach: 50% of R300 damage plus R75 legal fee. Total owed (R)?', answer: 225, explanation: '150 + 75 = R225' },
  { question: 'At 10% the town collects R3,000 per week. If the rate doubles to 20%, projected collection (R)?', answer: 6000, explanation: '3,000 × 2 = R6,000' },
  { question: 'Breach: 15% of R2,400 damage plus R120 legal fee. Total owed (R)?', answer: 480, explanation: '360 + 120 = R480' },
  { question: 'At 20% the town collects R6,000 per week. If the rate is halved to 10%, projected collection (R)?', answer: 3000, explanation: '6,000 ÷ 2 = R3,000' },
  { question: 'Breach: 10% of R4,500 damage plus R200 legal fee. Total owed (R)?', answer: 650, explanation: '450 + 200 = R650' },
  { question: 'At 25% the town collects R12,500 per week. If the rate is cut to 5% (one fifth), projected collection (R)?', answer: 2500, explanation: '12,500 ÷ 5 = R2,500' },
  { question: 'Breach: 20% of R3,000 damage plus R300 legal fee. Total owed (R)?', answer: 900, explanation: '600 + 300 = R900' },
  { question: 'At 10% the town collects R2,500 per week. If the rate is halved to 5%, projected collection (R)?', answer: 1250, explanation: '2,500 ÷ 2 = R1,250' }
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
