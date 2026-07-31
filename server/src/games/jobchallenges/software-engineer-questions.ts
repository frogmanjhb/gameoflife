// Software Engineer – Logic & Systems Challenge
// 20 questions per difficulty tier. Numeric answers; True=1, False=0 where needed.

export interface SoftwareEngineerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Pattern & Sequence Logic (number patterns, basic ops, simple logic)
export const easyQuestions: SoftwareEngineerQuestion[] = [
  { question: "What comes next: 5, 10, 20, 40, ___?", answer: 80, explanation: "Each term ×2: 40×2 = 80" },
  { question: "If input = 10 and the rule is \"×2 + 3\", what is the output?", answer: 23, explanation: "10×2 + 3 = 23" },
  { question: "True or False: 20 is divisible by 5? (1=True, 0=False)", answer: 1, explanation: "20÷5 = 4; True = 1" },
  { question: "What comes next: 6, 11, 16, 21, ___?", answer: 26, explanation: "Add 5 each time: 21+5 = 26" },
  { question: "Rule: triple the input. Input = 7. Output?", answer: 21, explanation: "7×3 = 21" },
  { question: "True or False: 22 is divisible by 4? (1=True, 0=False)", answer: 0, explanation: "22÷4 is not whole; False = 0" },
  { question: "What comes next: 3, 9, 27, 81, ___?", answer: 243, explanation: "Each ×3: 81×3 = 243" },
  { question: "Input = 14, rule \"−8\". Output?", answer: 6, explanation: "14−8 = 6" },
  { question: "True or False: 28 is divisible by 7? (1=True, 0=False)", answer: 1, explanation: "28÷7 = 4; True = 1" },
  { question: "What comes next: 8, 16, 24, 32, ___?", answer: 40, explanation: "Add 8: 32+8 = 40" },
  { question: "Rule: input + 12. Input = 6. Output?", answer: 18, explanation: "6+12 = 18" },
  { question: "True or False: 19 is divisible by 6? (1=True, 0=False)", answer: 0, explanation: "19÷6 is not whole; False = 0" },
  { question: "What comes next: 3, 8, 13, 18, ___?", answer: 23, explanation: "Add 5: 18+5 = 23" },
  { question: "Input = 6, rule \"×5 − 4\". Output?", answer: 26, explanation: "6×5−4 = 26" },
  { question: "True or False: 32 is divisible by 8? (1=True, 0=False)", answer: 1, explanation: "32÷8 = 4; True = 1" },
  { question: "What comes next: 60, 54, 48, 42, ___?", answer: 36, explanation: "Subtract 6: 42−6 = 36" },
  { question: "Rule: halve the input. Input = 24. Output?", answer: 12, explanation: "24÷2 = 12" },
  { question: "True or False: 23 is divisible by 3? (1=True, 0=False)", answer: 0, explanation: "23÷3 is not whole; False = 0" },
  { question: "What comes next: 2, 6, 12, 20, ___?", answer: 30, explanation: "Pattern n×(n+1): 5×6 = 30" },
  { question: "Input = 9, rule \"×3 − 7\". Output?", answer: 20, explanation: "9×3−7 = 20" }
];

// MEDIUM – Conditional Logic (if/else rules, balance fines, parity)
export const mediumQuestions: SoftwareEngineerQuestion[] = [
  { question: "If balance < R450 apply R45 fine, else no fine. Balance = R430. Final balance?", answer: 385, explanation: "430−45 = R385" },
  { question: "If number divisible by 5 add 10, else subtract 5. Input = 15. Output?", answer: 25, explanation: "15÷5 ok; 15+10 = 25" },
  { question: "If balance < R450 apply R45 fine. Balance = R460. Final balance?", answer: 460, explanation: "No fine; 460" },
  { question: "If even add 8, if odd subtract 4. Input = 13. Output?", answer: 9, explanation: "13 odd; 13−4 = 9" },
  { question: "If balance < R450 apply R45 fine. Balance = R380. Final balance?", answer: 335, explanation: "380−45 = R335" },
  { question: "If divisible by 5 add 10, else subtract 5. Input = 11. Output?", answer: 6, explanation: "11 not div by 5; 11−5 = 6" },
  { question: "If score ≥ 18 add 4, else add 0. Score = 20. New score?", answer: 24, explanation: "20≥18; 20+4 = 24" },
  { question: "If x > 10 then x×2, else x+5. x = 11. Output?", answer: 22, explanation: "11>10; 11×2 = 22" },
  { question: "If balance < R450 apply R45 fine. Balance = R450. Final balance?", answer: 450, explanation: "Not <450; no fine" },
  { question: "If divisible by 5 add 10, else subtract 5. Input = 20. Output?", answer: 30, explanation: "20÷5 ok; 20+10 = 30" },
  { question: "If even add 8, if odd subtract 4. Input = 16. Output?", answer: 24, explanation: "16 even; 16+8 = 24" },
  { question: "If balance < R300 apply R30 fine. Balance = R275. Final balance?", answer: 245, explanation: "275−30 = R245" },
  { question: "If divisible by 6 add 15, else subtract 6. Input = 24. Output?", answer: 39, explanation: "24÷6 ok; 24+15 = 39" },
  { question: "If x > 10 then x×2, else x+5. x = 8. Output?", answer: 13, explanation: "8 not >10; 8+5 = 13" },
  { question: "If score ≥ 18 add 4, else add 0. Score = 15. New score?", answer: 15, explanation: "15<18; 15+0 = 15" },
  { question: "If balance < R450 apply R45 fine. Balance = R445. Final balance?", answer: 400, explanation: "445−45 = R400" },
  { question: "If divisible by 5 add 10, else subtract 5. Input = 10. Output?", answer: 20, explanation: "10÷5 ok; 10+10 = 20" },
  { question: "If n mod 2 = 0 then n/2, else n×4. n = 16. Output?", answer: 8, explanation: "16 even; 16/2 = 8" },
  { question: "If n mod 2 = 0 then n/2, else n×4. n = 7. Output?", answer: 28, explanation: "7 odd; 7×4 = 28" },
  { question: "If divisible by 6 add 15, else subtract 6. Input = 13. Output?", answer: 7, explanation: "13 not div by 6; 13−6 = 7" }
];

// HARD – Multi-Step Programs & Capacity Planning
export const hardQuestions: SoftwareEngineerQuestion[] = [
  { question: "Program: multiply by 2, subtract 6, divide by 2. Input = 16. Output?", answer: 13, explanation: "(16×2−6)/2 = 26/2 = 13" },
  { question: "1,680 users; each server handles 210 users. How many servers required?", answer: 8, explanation: "1680÷210 = 8" },
  { question: "Steps: add 5, multiply by 3, subtract 8. Input = 7. Output?", answer: 28, explanation: "(7+5)×3−8 = 36−8 = 28" },
  { question: "1,260 requests; each worker handles 84. How many workers?", answer: 15, explanation: "1260÷84 = 15" },
  { question: "Program: divide by 5, add 7, multiply by 4. Input = 20. Output?", answer: 44, explanation: "(20/5+7)×4 = 11×4 = 44" },
  { question: "3,300 items; batch size 132. How many batches?", answer: 25, explanation: "3300÷132 = 25" },
  { question: "Steps: ×4, +6, ÷2. Input = 8. Output?", answer: 19, explanation: "(8×4+6)/2 = 38/2 = 19" },
  { question: "975 users; 65 per server. How many servers?", answer: 15, explanation: "975÷65 = 15" },
  { question: "Program: subtract 4, multiply by 6, add 3. Input = 9. Output?", answer: 33, explanation: "(9−4)×6+3 = 30+3 = 33" },
  { question: "5,040 records; 168 per batch. How many batches?", answer: 30, explanation: "5040÷168 = 30" },
  { question: "Steps: +8, ×2, −12. Input = 10. Output?", answer: 24, explanation: "(10+8)×2−12 = 36−12 = 24" },
  { question: "810 tasks; 54 per worker. How many workers?", answer: 15, explanation: "810÷54 = 15" },
  { question: "Program: ×3, +3, ÷2. Input = 11. Output?", answer: 18, explanation: "(11×3+3)/2 = 36/2 = 18" },
  { question: "2,160 minutes of data; 90 per slot. How many slots?", answer: 24, explanation: "2160÷90 = 24" },
  { question: "Steps: −7, ×5, +10. Input = 12. Output?", answer: 35, explanation: "(12−7)×5+10 = 25+10 = 35" },
  { question: "4,480 users; 160 per server. How many servers?", answer: 28, explanation: "4480÷160 = 28" },
  { question: "Program: ÷4, ×9, −1. Input = 12. Output?", answer: 26, explanation: "12/4×9−1 = 27−1 = 26" },
  { question: "1,152 items; 48 per box. How many boxes?", answer: 24, explanation: "1152÷48 = 24" },
  { question: "Steps: ×6, −18, ÷3. Input = 8. Output?", answer: 10, explanation: "(8×6−18)/3 = 30/3 = 10" },
  { question: "2,520 requests; 84 per handler. How many handlers?", answer: 30, explanation: "2520÷84 = 30" }
];

// EXTREME – Timing, Pagination & Algorithm Complexity
export const extremeQuestions: SoftwareEngineerQuestion[] = [
  { question: "App refreshes every 5 seconds. How many refreshes in 2.5 minutes?", answer: 30, explanation: "150÷5 = 30" },
  { question: "Database: 50 records per page. 923 records. How many pages?", answer: 19, explanation: "ceil(923/50) = 19" },
  { question: "Algorithm steps = n×4. n = 38. How many steps?", answer: 152, explanation: "38×4 = 152" },
  { question: "Poll every 6 seconds. How many polls in 5 minutes?", answer: 50, explanation: "300÷6 = 50" },
  { question: "52 bytes per row. 580 rows. Total bytes?", answer: 30160, explanation: "52×580 = 30,160" },
  { question: "Refresh every 4 seconds. How many refreshes in 2 minutes?", answer: 30, explanation: "120÷4 = 30" },
  { question: "55 records per page. 1,047 records. How many pages?", answer: 20, explanation: "ceil(1047/55) = 20" },
  { question: "Steps = n×7. n = 24. How many steps?", answer: 168, explanation: "24×7 = 168" },
  { question: "Cache clears every 15 seconds. How many clears in 1 minute?", answer: 4, explanation: "60÷15 = 4" },
  { question: "30 items per page. 587 items. How many pages?", answer: 20, explanation: "ceil(587/30) = 20" },
  { question: "App refreshes every 6 seconds. How many refreshes in 4 minutes?", answer: 40, explanation: "240÷6 = 40" },
  { question: "80 records per page. 2,003 records. How many pages?", answer: 26, explanation: "ceil(2003/80) = 26" },
  { question: "Algorithm: n² steps. n = 11. How many steps?", answer: 121, explanation: "11² = 121" },
  { question: "Sync every 25 seconds. How many syncs in 12.5 minutes?", answer: 30, explanation: "750÷25 = 30" },
  { question: "40 records per page. 1,240 records. How many pages?", answer: 31, explanation: "1240÷40 = 31" },
  { question: "Steps = n×8. n = 19. How many steps?", answer: 152, explanation: "19×8 = 152" },
  { question: "Refresh every 5 seconds. How many refreshes in 5 minutes?", answer: 60, explanation: "300÷5 = 60" },
  { question: "64 bytes per record. 375 records. Total bytes?", answer: 24000, explanation: "64×375 = 24,000" },
  { question: "Algorithm: 2^n steps. n = 7. How many steps? (evaluate 2^7)", answer: 128, explanation: "2^7 = 128" },
  { question: "35 records per page. 721 records. How many pages?", answer: 21, explanation: "ceil(721/35) = 21" }
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
