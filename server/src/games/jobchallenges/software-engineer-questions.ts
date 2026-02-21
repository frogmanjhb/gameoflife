// Software Engineer – Logic & Systems Challenge
// 20 questions per difficulty tier. Numeric answers; True=1, False=0 where needed.

export interface SoftwareEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Pattern & Sequence Logic (number patterns, basic ops, simple logic)
export const easyQuestions: SoftwareEngineerQuestion[] = [
  { question: "What comes next: 2, 4, 8, 16, ___?", answer: 32, explanation: "Each term ×2: 16×2 = 32" },
  { question: "If input = 5 and the rule is \"×2 + 1\", what is the output?", answer: 11, explanation: "5×2 + 1 = 11" },
  { question: "True or False: 7 is divisible by 3? (1=True, 0=False)", answer: 0, explanation: "7÷3 is not whole; False = 0" },
  { question: "What comes next: 3, 6, 9, 12, ___?", answer: 15, explanation: "Add 3 each time: 12+3 = 15" },
  { question: "Rule: double the input. Input = 7. Output?", answer: 14, explanation: "7×2 = 14" },
  { question: "True or False: 10 is divisible by 5? (1=True, 0=False)", answer: 1, explanation: "10÷5 = 2; True = 1" },
  { question: "What comes next: 1, 2, 4, 8, ___?", answer: 16, explanation: "Each ×2: 8×2 = 16" },
  { question: "Input = 4, rule \"+3\". Output?", answer: 7, explanation: "4+3 = 7" },
  { question: "True or False: 9 is divisible by 3? (1=True, 0=False)", answer: 1, explanation: "9÷3 = 3; True = 1" },
  { question: "What comes next: 5, 10, 15, 20, ___?", answer: 25, explanation: "Add 5: 20+5 = 25" },
  { question: "Rule: input − 2. Input = 9. Output?", answer: 7, explanation: "9−2 = 7" },
  { question: "True or False: 8 is divisible by 4? (1=True, 0=False)", answer: 1, explanation: "8÷4 = 2; True = 1" },
  { question: "What comes next: 1, 3, 5, 7, ___?", answer: 9, explanation: "Odd numbers; next is 9" },
  { question: "Input = 6, rule \"×2 − 1\". Output?", answer: 11, explanation: "6×2−1 = 11" },
  { question: "True or False: 6 is divisible by 3? (1=True, 0=False)", answer: 1, explanation: "6÷3 = 2; True = 1" },
  { question: "What comes next: 10, 20, 30, 40, ___?", answer: 50, explanation: "Add 10: 40+10 = 50" },
  { question: "Rule: input + 10. Input = 12. Output?", answer: 22, explanation: "12+10 = 22" },
  { question: "True or False: 11 is divisible by 2? (1=True, 0=False)", answer: 0, explanation: "11÷2 is not whole; False = 0" },
  { question: "What comes next: 100, 90, 80, 70, ___?", answer: 60, explanation: "Subtract 10: 70−10 = 60" },
  { question: "Input = 3, rule \"×3 + 2\". Output?", answer: 11, explanation: "3×3+2 = 11" }
];

// MEDIUM – Conditional Logic (if/then, multi-step, modular)
export const mediumQuestions: SoftwareEngineerQuestion[] = [
  { question: "If balance < R500 apply R50 fine, else no fine. Balance = R480. Final balance?", answer: 430, explanation: "480−50 = R430" },
  { question: "If number divisible by 3 add 5, else subtract 2. Input = 9. Output?", answer: 14, explanation: "9÷3 ok; 9+5 = 14" },
  { question: "If balance < R500 apply R50 fine. Balance = R600. Final balance?", answer: 600, explanation: "No fine; 600" },
  { question: "If even add 4, if odd subtract 1. Input = 8. Output?", answer: 12, explanation: "8 even; 8+4 = 12" },
  { question: "If balance < R500 apply R50 fine. Balance = R400. Final balance?", answer: 350, explanation: "400−50 = R350" },
  { question: "If divisible by 3 add 5, else subtract 2. Input = 7. Output?", answer: 5, explanation: "7 not div by 3; 7−2 = 5" },
  { question: "If score ≥ 10 add 2, else add 0. Score = 12. New score?", answer: 14, explanation: "12≥10; 12+2 = 14" },
  { question: "If x > 5 then x×2, else x+5. x = 6. Output?", answer: 12, explanation: "6>5; 6×2 = 12" },
  { question: "If balance < R500 apply R50 fine. Balance = R500. Final balance?", answer: 500, explanation: "Not <500; no fine" },
  { question: "If divisible by 3 add 5, else subtract 2. Input = 12. Output?", answer: 17, explanation: "12÷3 ok; 12+5 = 17" },
  { question: "If even add 4, if odd subtract 1. Input = 7. Output?", answer: 6, explanation: "7 odd; 7−1 = 6" },
  { question: "If balance < R300 apply R30 fine. Balance = R250. Final balance?", answer: 220, explanation: "250−30 = R220" },
  { question: "If divisible by 5 add 10, else subtract 3. Input = 15. Output?", answer: 25, explanation: "15÷5 ok; 15+10 = 25" },
  { question: "If x > 5 then x×2, else x+5. x = 4. Output?", answer: 9, explanation: "4 not >5; 4+5 = 9" },
  { question: "If score ≥ 10 add 2, else add 0. Score = 8. New score?", answer: 8, explanation: "8<10; 8+0 = 8" },
  { question: "If balance < R500 apply R50 fine. Balance = R450. Final balance?", answer: 400, explanation: "450−50 = R400" },
  { question: "If divisible by 3 add 5, else subtract 2. Input = 6. Output?", answer: 11, explanation: "6÷3 ok; 6+5 = 11" },
  { question: "If n mod 2 = 0 then n/2, else n×2. n = 10. Output?", answer: 5, explanation: "10 even; 10/2 = 5" },
  { question: "If n mod 2 = 0 then n/2, else n×2. n = 7. Output?", answer: 14, explanation: "7 odd; 7×2 = 14" },
  { question: "If divisible by 5 add 10, else subtract 3. Input = 8. Output?", answer: 5, explanation: "8 not div by 5; 8−3 = 5" }
];

// HARD – Algorithmic Thinking (multi-step, optimisation, multiple rules)
export const hardQuestions: SoftwareEngineerQuestion[] = [
  { question: "Program: multiply by 3, subtract 4, divide by 2. Input = 10. Output?", answer: 13, explanation: "(10×3−4)/2 = 26/2 = 13" },
  { question: "1,200 users; each server handles 150 users. How many servers required?", answer: 8, explanation: "1200÷150 = 8" },
  { question: "Steps: add 5, multiply by 2, subtract 3. Input = 4. Output?", answer: 15, explanation: "(4+5)×2−3 = 18−3 = 15" },
  { question: "900 requests; each worker handles 75. How many workers?", answer: 12, explanation: "900÷75 = 12" },
  { question: "Program: divide by 2, add 10, multiply by 3. Input = 20. Output?", answer: 60, explanation: "(20/2+10)×3 = 20×3 = 60" },
  { question: "2,000 items; batch size 125. How many batches?", answer: 16, explanation: "2000÷125 = 16" },
  { question: "Steps: ×2, +6, ÷2. Input = 8. Output?", answer: 11, explanation: "(8×2+6)/2 = 22/2 = 11" },
  { question: "600 users; 50 per server. How many servers?", answer: 12, explanation: "600÷50 = 12" },
  { question: "Program: subtract 2, multiply by 4, add 1. Input = 5. Output?", answer: 13, explanation: "(5−2)×4+1 = 12+1 = 13" },
  { question: "3,600 records; 120 per batch. How many batches?", answer: 30, explanation: "3600÷120 = 30" },
  { question: "Steps: +3, ×2, −5. Input = 6. Output?", answer: 13, explanation: "(6+3)×2−5 = 18−5 = 13" },
  { question: "500 tasks; 25 per worker. How many workers?", answer: 20, explanation: "500÷25 = 20" },
  { question: "Program: ×3, +1, ÷2. Input = 7. Output?", answer: 11, explanation: "(7×3+1)/2 = 22/2 = 11" },
  { question: "1,440 minutes of data; 60 per slot. How many slots?", answer: 24, explanation: "1440÷60 = 24" },
  { question: "Steps: −4, ×3, +2. Input = 10. Output?", answer: 20, explanation: "(10−4)×3+2 = 18+2 = 20" },
  { question: "2,500 users; 100 per server. How many servers?", answer: 25, explanation: "2500÷100 = 25" },
  { question: "Program: ÷2, ×5, −1. Input = 12. Output?", answer: 29, explanation: "12/2×5−1 = 30−1 = 29" },
  { question: "800 items; 40 per box. How many boxes?", answer: 20, explanation: "800÷40 = 20" },
  { question: "Steps: ×4, −8, ÷2. Input = 6. Output?", answer: 8, explanation: "(6×4−8)/2 = 16/2 = 8" },
  { question: "1,800 requests; 90 per handler. How many handlers?", answer: 20, explanation: "1800÷90 = 20" }
];

// EXTREME – Systems & Performance (efficiency, resource limits)
export const extremeQuestions: SoftwareEngineerQuestion[] = [
  { question: "App refreshes every 5 seconds. How many refreshes in 3 minutes?", answer: 36, explanation: "3×60÷5 = 36" },
  { question: "Database: 25 records per page. 620 records. How many pages?", answer: 25, explanation: "ceil(620/25) = 25" },
  { question: "Algorithm steps = n×2. n = 50. How many steps?", answer: 100, explanation: "50×2 = 100" },
  { question: "Poll every 10 seconds. How many polls in 5 minutes?", answer: 30, explanation: "5×60÷10 = 30" },
  { question: "32 bytes per row. 800 rows. Total bytes?", answer: 25600, explanation: "32×800 = 25600" },
  { question: "Refresh every 4 seconds. How many refreshes in 2 minutes?", answer: 30, explanation: "2×60÷4 = 30" },
  { question: "50 records per page. 1,237 records. How many pages?", answer: 25, explanation: "ceil(1237/50) = 25" },
  { question: "Steps = n×3. n = 40. How many steps?", answer: 120, explanation: "40×3 = 120" },
  { question: "Cache clears every 15 seconds. How many clears in 1 minute?", answer: 4, explanation: "60÷15 = 4" },
  { question: "20 items per page. 415 items. How many pages?", answer: 21, explanation: "ceil(415/20) = 21" },
  { question: "App refreshes every 6 seconds. How many refreshes in 2 minutes?", answer: 20, explanation: "2×60÷6 = 20" },
  { question: "100 records per page. 2,550 records. How many pages?", answer: 26, explanation: "ceil(2550/100) = 26" },
  { question: "Algorithm: n² steps. n = 10. How many steps?", answer: 100, explanation: "10² = 100" },
  { question: "Sync every 30 seconds. How many syncs in 10 minutes?", answer: 20, explanation: "10×60÷30 = 20" },
  { question: "40 records per page. 1,000 records. How many pages?", answer: 25, explanation: "1000÷40 = 25" },
  { question: "Steps = n×4. n = 25. How many steps?", answer: 100, explanation: "25×4 = 100" },
  { question: "Refresh every 8 seconds. How many refreshes in 4 minutes?", answer: 30, explanation: "4×60÷8 = 30" },
  { question: "64 bytes per record. 500 records. Total bytes?", answer: 32000, explanation: "64×500 = 32000" },
  { question: "Algorithm: 2^n steps. n = 5. How many steps? (evaluate 2^5)", answer: 32, explanation: "2^5 = 32" },
  { question: "30 records per page. 733 records. How many pages?", answer: 25, explanation: "ceil(733/30) = 25" }
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
