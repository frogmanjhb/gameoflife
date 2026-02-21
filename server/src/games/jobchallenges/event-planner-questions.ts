// Event Planner – Event Budget Challenge (Event Proposal)
// 20 questions per difficulty tier. All numeric answers.

export interface EventPlannerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Capacity & Basic Revenue (multiplication, total revenue, simple subtraction)
export const easyQuestions: EventPlannerQuestion[] = [
  { question: "Hall capacity = 120 people. Ticket price = R50. If sold out, total revenue (R)?", answer: 6000, explanation: "120 × 50 = R6,000" },
  { question: "You sell 80 tickets at R60 each. Revenue (R)?", answer: 4800, explanation: "80 × 60 = R4,800" },
  { question: "Capacity 200. Ticket R40. Sold out. Total revenue (R)?", answer: 8000, explanation: "200 × 40 = R8,000" },
  { question: "70 tickets at R75 each. Revenue (R)?", answer: 5250, explanation: "70 × 75 = R5,250" },
  { question: "Venue holds 150. Tickets R30. Full house. Revenue (R)?", answer: 4500, explanation: "150 × 30 = R4,500" },
  { question: "Sell 90 tickets at R55. Revenue (R)?", answer: 4950, explanation: "90 × 55 = R4,950" },
  { question: "Capacity 100, price R80. Sold out. Revenue (R)?", answer: 8000, explanation: "100 × 80 = R8,000" },
  { question: "60 tickets at R45 each. Revenue (R)?", answer: 2700, explanation: "60 × 45 = R2,700" },
  { question: "Hall 250 people. Ticket R24. Full. Revenue (R)?", answer: 6000, explanation: "250 × 24 = R6,000" },
  { question: "Revenue R5,000. Cost R2,800. Profit (R)?", answer: 2200, explanation: "5,000 − 2,800 = R2,200" },
  { question: "50 tickets at R100. Revenue (R)?", answer: 5000, explanation: "50 × 100 = R5,000" },
  { question: "Capacity 80. Ticket R65. Sold out. Revenue (R)?", answer: 5200, explanation: "80 × 65 = R5,200" },
  { question: "Revenue R9,000. Expenses R5,200. Profit (R)?", answer: 3800, explanation: "9,000 − 5,200 = R3,800" },
  { question: "110 tickets at R40. Revenue (R)?", answer: 4400, explanation: "110 × 40 = R4,400" },
  { question: "Room 60 people. R90 per ticket. Full. Revenue (R)?", answer: 5400, explanation: "60 × 90 = R5,400" },
  { question: "Revenue R7,500. Costs R4,100. Profit (R)?", answer: 3400, explanation: "7,500 − 4,100 = R3,400" },
  { question: "95 tickets at R50. Revenue (R)?", answer: 4750, explanation: "95 × 50 = R4,750" },
  { question: "Capacity 180. Ticket R35. Sold out. Revenue (R)?", answer: 6300, explanation: "180 × 35 = R6,300" },
  { question: "Revenue R6,200. Costs R3,600. Profit (R)?", answer: 2600, explanation: "6,200 − 3,600 = R2,600" },
  { question: "75 tickets at R72. Revenue (R)?", answer: 5400, explanation: "75 × 72 = R5,400" }
];

// MEDIUM – Costs & Profit (multi-step budgeting, revenue − expenses, per guest × guests)
export const mediumQuestions: EventPlannerQuestion[] = [
  { question: "Revenue = R10,000. Costs: Venue R3,000, Catering R4,000, Equipment R1,500. Profit (R)?", answer: 1500, explanation: "10,000 − 3,000 − 4,000 − 1,500 = R1,500" },
  { question: "Each guest costs R40 for catering. 100 guests attend. Total catering cost (R)?", answer: 4000, explanation: "40 × 100 = R4,000" },
  { question: "Revenue R15,000. Venue R4,000, Catering R5,000, Staff R2,000. Profit (R)?", answer: 4000, explanation: "15,000 − 4,000 − 5,000 − 2,000 = R4,000" },
  { question: "Catering R55 per person. 80 guests. Catering cost (R)?", answer: 4400, explanation: "55 × 80 = R4,400" },
  { question: "Revenue R12,000. Venue R3,500, Catering R4,500, Decor R1,200. Profit (R)?", answer: 2800, explanation: "12,000 − 3,500 − 4,500 − 1,200 = R2,800" },
  { question: "R35 per guest for food. 120 guests. Total food cost (R)?", answer: 4200, explanation: "35 × 120 = R4,200" },
  { question: "Revenue R8,000. Venue R2,500, Catering R3,000, Equipment R800. Profit (R)?", answer: 1700, explanation: "8,000 − 2,500 − 3,000 − 800 = R1,700" },
  { question: "R50 per head catering. 90 attendees. Catering total (R)?", answer: 4500, explanation: "50 × 90 = R4,500" },
  { question: "Revenue R18,000. Venue R5,000, Catering R7,000, Other R2,500. Profit (R)?", answer: 3500, explanation: "18,000 − 5,000 − 7,000 − 2,500 = R3,500" },
  { question: "R45 per guest. 70 guests. Catering cost (R)?", answer: 3150, explanation: "45 × 70 = R3,150" },
  { question: "Revenue R9,500. Venue R2,800, Catering R3,200, Staff R1,000. Profit (R)?", answer: 2500, explanation: "9,500 − 2,800 − 3,200 − 1,000 = R2,500" },
  { question: "R60 per person. 50 guests. Total per-person cost (R)?", answer: 3000, explanation: "60 × 50 = R3,000" },
  { question: "Revenue R14,000. Venue R4,200, Catering R5,800, Decor R1,500. Profit (R)?", answer: 2500, explanation: "14,000 − 4,200 − 5,800 − 1,500 = R2,500" },
  { question: "Catering R38 per guest. 95 guests. Catering total (R)?", answer: 3610, explanation: "38 × 95 = R3,610" },
  { question: "Revenue R11,000. Venue R3,200, Catering R4,300, Equipment R1,200. Profit (R)?", answer: 2300, explanation: "11,000 − 3,200 − 4,300 − 1,200 = R2,300" },
  { question: "R42 per head. 85 guests. Catering (R)?", answer: 3570, explanation: "42 × 85 = R3,570" },
  { question: "Revenue R16,000. Venue R5,500, Catering R6,000, Other R2,000. Profit (R)?", answer: 2500, explanation: "16,000 − 5,500 − 6,000 − 2,000 = R2,500" },
  { question: "R48 per guest. 75 attendees. Catering cost (R)?", answer: 3600, explanation: "48 × 75 = R3,600" },
  { question: "Revenue R7,200. Venue R2,000, Catering R2,800, Staff R600. Profit (R)?", answer: 1800, explanation: "7,200 − 2,000 − 2,800 − 600 = R1,800" },
  { question: "R52 per person. 110 guests. Catering total (R)?", answer: 5720, explanation: "52 × 110 = R5,720" }
];

// HARD – Pricing Strategy (break-even: total costs ÷ capacity or ÷ expected guests)
export const hardQuestions: EventPlannerQuestion[] = [
  { question: "Total fixed costs = R8,000. Hall capacity = 200. What ticket price (R) is needed to break even if full?", answer: 40, explanation: "8,000 ÷ 200 = R40" },
  { question: "You expect 150 guests. What ticket price (R) covers R9,000 costs?", answer: 60, explanation: "9,000 ÷ 150 = R60" },
  { question: "Fixed costs R12,000. Capacity 300. Break-even price per ticket (R) if sold out?", answer: 40, explanation: "12,000 ÷ 300 = R40" },
  { question: "Expected attendance 100. Costs R5,000. Break-even ticket price (R)?", answer: 50, explanation: "5,000 ÷ 100 = R50" },
  { question: "Total costs R15,000. Capacity 250. Break-even price (R)?", answer: 60, explanation: "15,000 ÷ 250 = R60" },
  { question: "80 guests expected. R6,400 costs. Ticket price to break even (R)?", answer: 80, explanation: "6,400 ÷ 80 = R80" },
  { question: "Fixed costs R10,000. Hall holds 200. Break-even ticket (R)?", answer: 50, explanation: "10,000 ÷ 200 = R50" },
  { question: "120 guests. Costs R7,200. Break-even price (R)?", answer: 60, explanation: "7,200 ÷ 120 = R60" },
  { question: "Costs R14,000. Capacity 175. Break-even per ticket (R)?", answer: 80, explanation: "14,000 ÷ 175 = R80" },
  { question: "90 expected. R5,400 costs. Break-even ticket (R)?", answer: 60, explanation: "5,400 ÷ 90 = R60" },
  { question: "Fixed R9,000. Capacity 180. Break-even price (R)?", answer: 50, explanation: "9,000 ÷ 180 = R50" },
  { question: "200 guests. R10,000 costs. Break-even ticket (R)?", answer: 50, explanation: "10,000 ÷ 200 = R50" },
  { question: "Costs R11,000. Capacity 220. Break-even (R per ticket)?", answer: 50, explanation: "11,000 ÷ 220 = R50" },
  { question: "Expected 75. R4,500 costs. Break-even price (R)?", answer: 60, explanation: "4,500 ÷ 75 = R60" },
  { question: "Fixed R13,000. Capacity 260. Break-even ticket (R)?", answer: 50, explanation: "13,000 ÷ 260 = R50" },
  { question: "160 guests. R8,000 costs. Break-even (R)?", answer: 50, explanation: "8,000 ÷ 160 = R50" },
  { question: "Costs R6,000. Capacity 120. Break-even price (R)?", answer: 50, explanation: "6,000 ÷ 120 = R50" },
  { question: "100 expected. R7,500 costs. Break-even ticket (R)?", answer: 75, explanation: "7,500 ÷ 100 = R75" },
  { question: "Fixed R16,000. Capacity 320. Break-even (R per ticket)?", answer: 50, explanation: "16,000 ÷ 320 = R50" },
  { question: "Expected 125. R6,250 costs. Break-even price (R)?", answer: 50, explanation: "6,250 ÷ 125 = R50" }
];

// EXTREME – Time & Resource Management (scheduling, time intervals, budget optimisation)
export const extremeQuestions: EventPlannerQuestion[] = [
  { question: "Event runs 3 hours. Each performance lasts 20 minutes. How many performances fit?", answer: 9, explanation: "3 × 60 = 180 min; 180 ÷ 20 = 9" },
  { question: "Budget R15,000. Band R6,000, Decor R3,500. Catering R50 per person. How many guests can you afford?", answer: 110, explanation: "15,000 − 6,000 − 3,500 = 5,500; 5,500 ÷ 50 = 110" },
  { question: "Event 4 hours. Each act 30 minutes. How many acts?", answer: 8, explanation: "240 ÷ 30 = 8" },
  { question: "Budget R20,000. Venue R8,000, Band R5,000. Catering R70 per person. Max guests?", answer: 100, explanation: "20,000 − 8,000 − 5,000 = 7,000; 7,000 ÷ 70 = 100" },
  { question: "2.5 hour event. Slots of 15 minutes. How many slots?", answer: 10, explanation: "150 ÷ 15 = 10" },
  { question: "R12,000 budget. Venue R4,000, Decor R2,000. R40 per guest catering. Max guests?", answer: 150, explanation: "12,000 − 4,000 − 2,000 = 6,000; 6,000 ÷ 40 = 150" },
  { question: "Event 5 hours. Each segment 25 minutes. How many segments?", answer: 12, explanation: "300 ÷ 25 = 12" },
  { question: "Budget R18,000. Venue R6,500, Band R4,000. R55 per person. How many guests?", answer: 136, explanation: "18,000 − 6,500 − 4,000 = 7,500; 7,500 ÷ 55 ≈ 136.36 → 136" },
  { question: "90-minute event. 10-minute slots. How many slots?", answer: 9, explanation: "90 ÷ 10 = 9" },
  { question: "R14,000. Venue R5,000, Equipment R2,500. R50 per guest. Max guests?", answer: 130, explanation: "14,000 − 5,000 − 2,500 = 6,500; 6,500 ÷ 50 = 130" },
  { question: "Event 2 hours. Performances 15 min each. How many performances?", answer: 8, explanation: "120 ÷ 15 = 8" },
  { question: "Budget R25,000. Venue R10,000, Catering fixed R3,000. R60 per head extra. 150 guests. Extra catering cost (R)?", answer: 9000, explanation: "150 × 60 = R9,000" },
  { question: "3.5 hour event. 20-minute sessions. How many sessions?", answer: 10, explanation: "210 ÷ 20 = 10.5 → 10 full sessions" },
  { question: "R16,000 budget. Venue R5,500, Decor R2,000. R45 per person. Max guests?", answer: 188, explanation: "16,000 − 5,500 − 2,000 = 8,500; 8,500 ÷ 45 ≈ 188.89 → 188" },
  { question: "Event 6 hours. Breaks 20 min each. 4 breaks. Total break time (minutes)?", answer: 80, explanation: "4 × 20 = 80 min" },
  { question: "Budget R22,000. Venue R7,000, Band R6,000. R75 per guest. How many guests?", answer: 120, explanation: "22,000 − 7,000 − 6,000 = 9,000; 9,000 ÷ 75 = 120" },
  { question: "4-hour event. 25-minute slots. How many full slots?", answer: 9, explanation: "240 ÷ 25 = 9.6 → 9" },
  { question: "R10,000. Venue R3,500, Equipment R1,500. R40 per person. Max guests?", answer: 125, explanation: "10,000 − 3,500 − 1,500 = 5,000; 5,000 ÷ 40 = 125" },
  { question: "Event 1.5 hours. 10-minute activities. How many activities?", answer: 9, explanation: "90 ÷ 10 = 9" },
  { question: "Budget R30,000. Venue R12,000, Band R8,000. R80 per guest. Max guests?", answer: 125, explanation: "30,000 − 12,000 − 8,000 = 10,000; 10,000 ÷ 80 = 125" }
];

export function getEventPlannerQuestion(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): EventPlannerQuestion {
  let questions: EventPlannerQuestion[];
  switch (difficulty) {
    case 'easy': questions = easyQuestions; break;
    case 'medium': questions = mediumQuestions; break;
    case 'hard': questions = hardQuestions; break;
    case 'extreme': questions = extremeQuestions; break;
  }
  return questions[Math.floor(Math.random() * questions.length)];
}
