// Software Engineer – Logic & Systems Challenge (client, same as server)
// 20 questions per difficulty tier. Numeric answers; True=1, False=0 where needed.

export interface SoftwareEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: SoftwareEngineerQuestion[] = [
  { question: "What comes next: 3, 6, 12, 24, ___?", answer: 48, explanation: "Each term ×2: 24×2 = 48" },
  { question: "If input = 8 and the rule is \"×3 − 4\", what is the output?", answer: 20, explanation: "8×3 − 4 = 20" },
  { question: "True or False: 15 is divisible by 4? (1=True, 0=False)", answer: 0, explanation: "15÷4 is not whole; False = 0" },
  { question: "What comes next: 4, 7, 10, 13, ___?", answer: 16, explanation: "Add 3 each time: 13+3 = 16" },
  { question: "Rule: triple the input. Input = 5. Output?", answer: 15, explanation: "5×3 = 15" },
  { question: "True or False: 18 is divisible by 6? (1=True, 0=False)", answer: 1, explanation: "18÷6 = 3; True = 1" },
  { question: "What comes next: 2, 6, 18, 54, ___?", answer: 162, explanation: "Each ×3: 54×3 = 162" },
  { question: "Input = 11, rule \"−5\". Output?", answer: 6, explanation: "11−5 = 6" },
  { question: "True or False: 21 is divisible by 7? (1=True, 0=False)", answer: 1, explanation: "21÷7 = 3; True = 1" },
  { question: "What comes next: 7, 14, 21, 28, ___?", answer: 35, explanation: "Add 7: 28+7 = 35" },
  { question: "Rule: input + 15. Input = 9. Output?", answer: 24, explanation: "9+15 = 24" },
  { question: "True or False: 13 is divisible by 5? (1=True, 0=False)", answer: 0, explanation: "13÷5 is not whole; False = 0" },
  { question: "What comes next: 2, 5, 8, 11, ___?", answer: 14, explanation: "Add 3: 11+3 = 14" },
  { question: "Input = 7, rule \"×4 + 1\". Output?", answer: 29, explanation: "7×4+1 = 29" },
  { question: "True or False: 24 is divisible by 8? (1=True, 0=False)", answer: 1, explanation: "24÷8 = 3; True = 1" },
  { question: "What comes next: 50, 45, 40, 35, ___?", answer: 30, explanation: "Subtract 5: 35−5 = 30" },
  { question: "Rule: halve the input. Input = 16. Output?", answer: 8, explanation: "16÷2 = 8" },
  { question: "True or False: 17 is divisible by 3? (1=True, 0=False)", answer: 0, explanation: "17÷3 is not whole; False = 0" },
  { question: "What comes next: 1, 4, 9, 16, ___?", answer: 25, explanation: "Perfect squares: 5² = 25" },
  { question: "Input = 4, rule \"×5 − 6\". Output?", answer: 14, explanation: "4×5−6 = 14" }
];

const mediumQuestions: SoftwareEngineerQuestion[] = [
  { question: "If balance < R400 apply R40 fine, else no fine. Balance = R385. Final balance?", answer: 345, explanation: "385−40 = R345" },
  { question: "If number divisible by 4 add 8, else subtract 3. Input = 12. Output?", answer: 20, explanation: "12÷4 ok; 12+8 = 20" },
  { question: "If balance < R400 apply R40 fine. Balance = R420. Final balance?", answer: 420, explanation: "No fine; 420" },
  { question: "If even add 6, if odd subtract 2. Input = 11. Output?", answer: 9, explanation: "11 odd; 11−2 = 9" },
  { question: "If balance < R400 apply R40 fine. Balance = R350. Final balance?", answer: 310, explanation: "350−40 = R310" },
  { question: "If divisible by 4 add 8, else subtract 3. Input = 9. Output?", answer: 6, explanation: "9 not div by 4; 9−3 = 6" },
  { question: "If score ≥ 15 add 3, else add 0. Score = 18. New score?", answer: 21, explanation: "18≥15; 18+3 = 21" },
  { question: "If x > 8 then x×2, else x+4. x = 9. Output?", answer: 18, explanation: "9>8; 9×2 = 18" },
  { question: "If balance < R400 apply R40 fine. Balance = R400. Final balance?", answer: 400, explanation: "Not <400; no fine" },
  { question: "If divisible by 4 add 8, else subtract 3. Input = 16. Output?", answer: 24, explanation: "16÷4 ok; 16+8 = 24" },
  { question: "If even add 6, if odd subtract 2. Input = 14. Output?", answer: 20, explanation: "14 even; 14+6 = 20" },
  { question: "If balance < R250 apply R25 fine. Balance = R220. Final balance?", answer: 195, explanation: "220−25 = R195" },
  { question: "If divisible by 6 add 12, else subtract 4. Input = 18. Output?", answer: 30, explanation: "18÷6 ok; 18+12 = 30" },
  { question: "If x > 8 then x×2, else x+4. x = 6. Output?", answer: 10, explanation: "6 not >8; 6+4 = 10" },
  { question: "If score ≥ 15 add 3, else add 0. Score = 12. New score?", answer: 12, explanation: "12<15; 12+0 = 12" },
  { question: "If balance < R400 apply R40 fine. Balance = R390. Final balance?", answer: 350, explanation: "390−40 = R350" },
  { question: "If divisible by 4 add 8, else subtract 3. Input = 8. Output?", answer: 16, explanation: "8÷4 ok; 8+8 = 16" },
  { question: "If n mod 2 = 0 then n/2, else n×3. n = 12. Output?", answer: 6, explanation: "12 even; 12/2 = 6" },
  { question: "If n mod 2 = 0 then n/2, else n×3. n = 5. Output?", answer: 15, explanation: "5 odd; 5×3 = 15" },
  { question: "If divisible by 6 add 12, else subtract 4. Input = 11. Output?", answer: 7, explanation: "11 not div by 6; 11−4 = 7" }
];

const hardQuestions: SoftwareEngineerQuestion[] = [
  { question: "Program: multiply by 2, subtract 4, divide by 2. Input = 14. Output?", answer: 12, explanation: "(14×2−4)/2 = 24/2 = 12" },
  { question: "1,440 users; each server handles 180 users. How many servers required?", answer: 8, explanation: "1,440÷180 = 8" },
  { question: "Steps: add 4, multiply by 3, subtract 5. Input = 6. Output?", answer: 25, explanation: "(6+4)×3−5 = 30−5 = 25" },
  { question: "1,050 requests; each worker handles 70. How many workers?", answer: 15, explanation: "1,050÷70 = 15" },
  { question: "Program: divide by 4, add 6, multiply by 5. Input = 16. Output?", answer: 50, explanation: "(16/4+6)×5 = 10×5 = 50" },
  { question: "2,750 items; batch size 110. How many batches?", answer: 25, explanation: "2,750÷110 = 25" },
  { question: "Steps: ×3, +9, ÷2. Input = 7. Output?", answer: 15, explanation: "(7×3+9)/2 = 30/2 = 15" },
  { question: "840 users; 60 per server. How many servers?", answer: 14, explanation: "840÷60 = 14" },
  { question: "Program: subtract 3, multiply by 5, add 2. Input = 8. Output?", answer: 27, explanation: "(8−3)×5+2 = 25+2 = 27" },
  { question: "4,200 records; 140 per batch. How many batches?", answer: 30, explanation: "4,200÷140 = 30" },
  { question: "Steps: +6, ×2, −10. Input = 9. Output?", answer: 20, explanation: "(9+6)×2−10 = 30−10 = 20" },
  { question: "675 tasks; 45 per worker. How many workers?", answer: 15, explanation: "675÷45 = 15" },
  { question: "Program: ×4, +2, ÷3. Input = 10. Output?", answer: 14, explanation: "(10×4+2)/3 = 42/3 = 14" },
  { question: "1,920 minutes of data; 80 per slot. How many slots?", answer: 24, explanation: "1,920÷80 = 24" },
  { question: "Steps: −6, ×4, +5. Input = 11. Output?", answer: 25, explanation: "(11−6)×4+5 = 20+5 = 25" },
  { question: "3,200 users; 128 per server. How many servers?", answer: 25, explanation: "3,200÷128 = 25" },
  { question: "Program: ÷3, ×7, −2. Input = 15. Output?", answer: 33, explanation: "15/3×7−2 = 35−2 = 33" },
  { question: "960 items; 48 per box. How many boxes?", answer: 20, explanation: "960÷48 = 20" },
  { question: "Steps: ×5, −15, ÷2. Input = 9. Output?", answer: 15, explanation: "(9×5−15)/2 = 30/2 = 15" },
  { question: "2,160 requests; 72 per handler. How many handlers?", answer: 30, explanation: "2,160÷72 = 30" }
];

const extremeQuestions: SoftwareEngineerQuestion[] = [
  { question: "App refreshes every 4 seconds. How many refreshes in 2 minutes?", answer: 30, explanation: "2×60÷4 = 30" },
  { question: "Database: 40 records per page. 847 records. How many pages?", answer: 22, explanation: "ceil(847/40) = 22" },
  { question: "Algorithm steps = n×3. n = 45. How many steps?", answer: 135, explanation: "45×3 = 135" },
  { question: "Poll every 8 seconds. How many polls in 4 minutes?", answer: 30, explanation: "4×60÷8 = 30" },
  { question: "48 bytes per row. 625 rows. Total bytes?", answer: 30000, explanation: "48×625 = 30,000" },
  { question: "Refresh every 3 seconds. How many refreshes in 1.5 minutes?", answer: 30, explanation: "90÷3 = 30" },
  { question: "60 records per page. 1,089 records. How many pages?", answer: 19, explanation: "ceil(1,089/60) = 19" },
  { question: "Steps = n×5. n = 28. How many steps?", answer: 140, explanation: "28×5 = 140" },
  { question: "Cache clears every 12 seconds. How many clears in 1 minute?", answer: 5, explanation: "60÷12 = 5" },
  { question: "25 items per page. 478 items. How many pages?", answer: 20, explanation: "ceil(478/25) = 20" },
  { question: "App refreshes every 7 seconds. How many refreshes in 3.5 minutes?", answer: 30, explanation: "210÷7 = 30" },
  { question: "75 records per page. 1,876 records. How many pages?", answer: 26, explanation: "ceil(1,876/75) = 26" },
  { question: "Algorithm: n² steps. n = 12. How many steps?", answer: 144, explanation: "12² = 144" },
  { question: "Sync every 20 seconds. How many syncs in 10 minutes?", answer: 30, explanation: "600÷20 = 30" },
  { question: "35 records per page. 1,050 records. How many pages?", answer: 30, explanation: "1,050÷35 = 30" },
  { question: "Steps = n×6. n = 22. How many steps?", answer: 132, explanation: "22×6 = 132" },
  { question: "Refresh every 9 seconds. How many refreshes in 6 minutes?", answer: 40, explanation: "360÷9 = 40" },
  { question: "56 bytes per record. 450 records. Total bytes?", answer: 25200, explanation: "56×450 = 25,200" },
  { question: "Algorithm: 2^n steps. n = 6. How many steps? (evaluate 2^6)", answer: 64, explanation: "2^6 = 64" },
  { question: "45 records per page. 892 records. How many pages?", answer: 20, explanation: "ceil(892/45) = 20" }
];

export function getSoftwareEngineerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): SoftwareEngineerQuestion {
  let questions: SoftwareEngineerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
