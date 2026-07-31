// Event Planner – Event Budget Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface EventPlannerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

// EASY – Ticket Revenue & Profit
const easyQuestions: EventPlannerQuestion[] = [
  { question: "Umhlanga pier deck holds 150 guests. Tickets R92 each. Sold out. Total revenue (R)?", answer: 13800, explanation: "150 × 92 = R13,800" },
  { question: "You sell 72 tickets at R135 each for a Durban jazz night. Revenue (R)?", answer: 9720, explanation: "72 × 135 = R9,720" },
  { question: "Cape Town stadium annex capacity 280. Ticket R52. Full house. Revenue (R)?", answer: 14560, explanation: "280 × 52 = R14,560" },
  { question: "Beachfront tent event: 88 tickets at R75. Revenue (R)?", answer: 6600, explanation: "88 × 75 = R6,600" },
  { question: "Alexandra community hall seats 200. Tickets R45. Sold out. Revenue (R)?", answer: 9000, explanation: "200 × 45 = R9,000" },
  { question: "Revenue R15,200. Expenses R9,800. Profit (R)?", answer: 5200, explanation: "15,200 − 9,800 = R5,200" },
  { question: "48 VIP tickets at R110 each. Revenue (R)?", answer: 5280, explanation: "48 × 110 = R5,280" },
  { question: "Franschhoek wine estate seats 60. Tickets R320. Full. Revenue (R)?", answer: 19200, explanation: "60 × 320 = R19,200" },
  { question: "Revenue R5,600. Costs R3,400. Profit (R)?", answer: 2200, explanation: "5,600 − 3,400 = R2,200" },
  { question: "145 general admission tickets at R38. Revenue (R)?", answer: 5510, explanation: "145 × 38 = R5,510" },
  { question: "Durban ICC room capacity 240. Ticket R35. Sold out. Revenue (R)?", answer: 8400, explanation: "240 × 35 = R8,400" },
  { question: "Revenue R12,800. Expenses R7,900. Profit (R)?", answer: 4900, explanation: "12,800 − 7,900 = R4,900" },
  { question: "36 premium tickets at R180. Revenue (R)?", answer: 6480, explanation: "36 × 180 = R6,480" },
  { question: "Pietermaritzburg gallery seats 95. Tickets R125. Full. Revenue (R)?", answer: 11875, explanation: "95 × 125 = R11,875" },
  { question: "Revenue R7,400. Costs R4,600. Profit (R)?", answer: 2800, explanation: "7,400 − 4,600 = R2,800" },
  { question: "105 tickets at R64 for a school concert. Revenue (R)?", answer: 6720, explanation: "105 × 64 = R6,720" },
  { question: "East London civic centre capacity 175. Ticket R36. Full. Revenue (R)?", answer: 6300, explanation: "175 × 36 = R6,300" },
  { question: "Revenue R10,500. Expenses R6,200. Profit (R)?", answer: 4300, explanation: "10,500 − 6,200 = R4,300" },
  { question: "92 tickets at R78 for a charity gala. Revenue (R)?", answer: 7176, explanation: "92 × 78 = R7,176" },
  { question: "Nelspruit hall seats 190. Tickets R54. Sold out. Revenue (R)?", answer: 10260, explanation: "190 × 54 = R10,260" },
];

// MEDIUM – Multi-Cost Budgets & Per-Person Catering
const mediumQuestions: EventPlannerQuestion[] = [
  { question: "Revenue R25,000. Costs: Venue R8,500, Catering R9,200, Security R2,300. Profit (R)?", answer: 5000, explanation: "25,000 − 8,500 − 9,200 − 2,300 = R5,000" },
  { question: "Youth day braai: R58 per guest for catering. 88 guests. Total catering cost (R)?", answer: 5104, explanation: "58 × 88 = R5,104" },
  { question: "Revenue R18,200. Venue R6,000, Catering R7,800, DJ R2,400. Profit (R)?", answer: 2000, explanation: "18,200 − 6,000 − 7,800 − 2,400 = R2,000" },
  { question: "R52 per person for food. 95 guests attend. Total food cost (R)?", answer: 4940, explanation: "52 × 95 = R4,940" },
  { question: "Revenue R22,500. Venue R7,500, Catering R8,500, Lighting R3,000. Profit (R)?", answer: 3500, explanation: "22,500 − 7,500 − 8,500 − 3,000 = R3,500" },
  { question: "R63 per guest catering at a corporate lunch. 80 guests. Catering cost (R)?", answer: 5040, explanation: "63 × 80 = R5,040" },
  { question: "Revenue R14,600. Venue R4,500, Catering R6,200, Staff R1,400. Profit (R)?", answer: 2500, explanation: "14,600 − 4,500 − 6,200 − 1,400 = R2,500" },
  { question: "R56 per head for a wedding reception. 92 attendees. Catering total (R)?", answer: 5152, explanation: "56 × 92 = R5,152" },
  { question: "Revenue R26,000. Venue R9,000, Catering R10,500, Decor R3,500. Profit (R)?", answer: 3000, explanation: "26,000 − 9,000 − 10,500 − 3,500 = R3,000" },
  { question: "R47 per guest for a youth summit. 130 guests. Catering total (R)?", answer: 6110, explanation: "47 × 130 = R6,110" },
  { question: "Revenue R11,800. Venue R3,500, Catering R5,000, Equipment R950. Profit (R)?", answer: 2350, explanation: "11,800 − 3,500 − 5,000 − 950 = R2,350" },
  { question: "R69 per person for a product launch. 70 guests. Total per-person cost (R)?", answer: 4830, explanation: "69 × 70 = R4,830" },
  { question: "Revenue R23,400. Venue R8,000, Catering R9,600, AV R2,300. Profit (R)?", answer: 3500, explanation: "23,400 − 8,000 − 9,600 − 2,300 = R3,500" },
  { question: "R54 per guest for a graduation dinner. 98 guests. Catering total (R)?", answer: 5292, explanation: "54 × 98 = R5,292" },
  { question: "Revenue R16,300. Venue R5,200, Catering R6,500, Staff R1,600. Profit (R)?", answer: 3000, explanation: "16,300 − 5,200 − 6,500 − 1,600 = R3,000" },
  { question: "R46 per head for a community fundraiser. 108 guests. Catering (R)?", answer: 4968, explanation: "46 × 108 = R4,968" },
  { question: "Revenue R19,600. Venue R6,400, Catering R7,200, Security R1,500. Profit (R)?", answer: 4500, explanation: "19,600 − 6,400 − 7,200 − 1,500 = R4,500" },
  { question: "R57 per guest for a matric farewell. 84 guests. Catering cost (R)?", answer: 4788, explanation: "57 × 84 = R4,788" },
  { question: "Revenue R13,100. Venue R4,000, Catering R5,600, Flowers R900. Profit (R)?", answer: 2600, explanation: "13,100 − 4,000 − 5,600 − 900 = R2,600" },
  { question: "R50 per person for a sports awards night. 122 guests. Catering total (R)?", answer: 6100, explanation: "50 × 122 = R6,100" },
];

// HARD – Break-Even Ticket Pricing
const hardQuestions: EventPlannerQuestion[] = [
  { question: "Total fixed costs R12,000. Hall capacity 240. Break-even ticket price (R) if sold out?", answer: 50, explanation: "12,000 ÷ 240 = R50" },
  { question: "You expect 150 guests at a golf day. Costs R10,500. Break-even ticket price (R)?", answer: 70, explanation: "10,500 ÷ 150 = R70" },
  { question: "Fixed costs R16,000. Capacity 320. Break-even price per ticket (R) if full?", answer: 50, explanation: "16,000 ÷ 320 = R50" },
  { question: "Expected attendance 100 at a craft market. Costs R7,000. Break-even entry fee (R)?", answer: 70, explanation: "7,000 ÷ 100 = R70" },
  { question: "Total costs R18,000. Capacity 360. Break-even price (R)?", answer: 50, explanation: "18,000 ÷ 360 = R50" },
  { question: "120 guests expected for a comedy show. R8,400 costs. Break-even ticket (R)?", answer: 70, explanation: "8,400 ÷ 120 = R70" },
  { question: "Fixed costs R10,500. Hall holds 210. Break-even ticket (R)?", answer: 50, explanation: "10,500 ÷ 210 = R50" },
  { question: "160 guests at a food festival. Costs R11,200. Break-even price (R)?", answer: 70, explanation: "11,200 ÷ 160 = R70" },
  { question: "Costs R15,600. Capacity 260. Break-even per ticket (R)?", answer: 60, explanation: "15,600 ÷ 260 = R60" },
  { question: "110 expected at a poetry slam. R6,050 costs. Break-even ticket (R)?", answer: 55, explanation: "6,050 ÷ 110 = R55" },
  { question: "Fixed R14,400. Capacity 288. Break-even price (R)?", answer: 50, explanation: "14,400 ÷ 288 = R50" },
  { question: "180 guests at a dance recital. R12,600 costs. Break-even (R)?", answer: 70, explanation: "12,600 ÷ 180 = R70" },
  { question: "Costs R13,500. Capacity 225. Break-even price (R)?", answer: 60, explanation: "13,500 ÷ 225 = R60" },
  { question: "95 expected at a film screening. R5,225 costs. Break-even price (R)?", answer: 55, explanation: "5,225 ÷ 95 = R55" },
  { question: "Fixed R19,200. Capacity 384. Break-even ticket (R)?", answer: 50, explanation: "19,200 ÷ 384 = R50" },
  { question: "145 guests at a tech expo. R10,150 costs. Break-even (R)?", answer: 70, explanation: "10,150 ÷ 145 = R70" },
  { question: "Costs R21,000. Capacity 350. Break-even price (R)?", answer: 60, explanation: "21,000 ÷ 350 = R60" },
  { question: "80 expected at a book launch. R4,400 costs. Break-even ticket (R)?", answer: 55, explanation: "4,400 ÷ 80 = R55" },
  { question: "Fixed R17,600. Capacity 352. Break-even (R per ticket)?", answer: 50, explanation: "17,600 ÷ 352 = R50" },
  { question: "125 guests at a farmers market gala. R8,750 costs. Break-even price (R)?", answer: 70, explanation: "8,750 ÷ 125 = R70" },
];

// EXTREME – Scheduling & Budget Constraints
const extremeQuestions: EventPlannerQuestion[] = [
  { question: "Heritage Day festival runs 4 hours. Each act lasts 28 minutes. How many full acts fit?", answer: 8, explanation: "4 × 60 = 240 min; 240 ÷ 28 = 8 full acts" },
  { question: "Budget R20,000. Venue R8,000, Band R4,500. Catering R70 per person. Max guests?", answer: 107, explanation: "20,000 − 8,000 − 4,500 = 7,500; 7,500 ÷ 70 = 107" },
  { question: "Joburg jazz night is 5 hours. Each set 40 minutes. How many full sets?", answer: 7, explanation: "300 ÷ 40 = 7 full sets" },
  { question: "Budget R27,500. Venue R10,500, Decor R4,000. R75 per person catering. Max guests?", answer: 173, explanation: "27,500 − 10,500 − 4,000 = 13,000; 13,000 ÷ 75 = 173" },
  { question: "School concert 2.5 hours. Each performance 14 minutes. How many performances?", answer: 10, explanation: "150 ÷ 14 = 10 full performances" },
  { question: "Budget R16,000. Venue R6,000, Equipment R2,500. R58 per guest. Max guests?", answer: 129, explanation: "16,000 − 6,000 − 2,500 = 7,500; 7,500 ÷ 58 = 129" },
  { question: "Corporate gala 4 hours. Each session 32 minutes. How many full sessions?", answer: 7, explanation: "240 ÷ 32 = 7 full sessions" },
  { question: "Budget R30,000. Venue R12,000, DJ R5,000. R85 per person. How many guests?", answer: 152, explanation: "30,000 − 12,000 − 5,000 = 13,000; 13,000 ÷ 85 = 152" },
  { question: "80-minute talent show. 10-minute slots. How many full slots?", answer: 8, explanation: "80 ÷ 10 = 8 full slots" },
  { question: "Budget R18,900. Venue R7,500, Band R4,400. R52 per guest. Max guests?", answer: 134, explanation: "18,900 − 7,500 − 4,400 = 7,000; 7,000 ÷ 52 = 134" },
  { question: "Festival 5 hours. Breaks 12 min each, 5 breaks. Total break time (minutes)?", answer: 60, explanation: "5 × 12 = 60 min" },
  { question: "Budget R34,000. Venue R14,500, Security R4,000. R95 per guest. Max guests?", answer: 163, explanation: "34,000 − 14,500 − 4,000 = 15,500; 15,500 ÷ 95 = 163" },
  { question: "3.5-hour market fair. Stall rotations every 21 minutes. How many full rotations?", answer: 10, explanation: "210 ÷ 21 = 10" },
  { question: "Budget R23,000. Venue R9,000, Decor R3,500. R60 per person. Max guests?", answer: 175, explanation: "23,000 − 9,000 − 3,500 = 10,500; 10,500 ÷ 60 = 175" },
  { question: "4-hour awards ceremony. Speeches 18 minutes each. How many full speeches?", answer: 13, explanation: "240 ÷ 18 = 13 full speeches" },
  { question: "Budget R21,000. Venue R8,500, fixed catering R3,100. R58 per head extra for 140 guests. Extra catering cost (R)?", answer: 8120, explanation: "140 × 58 = R8,120" },
  { question: "100-minute workshop day. Workshops 20 minutes each. How many full workshops?", answer: 5, explanation: "100 ÷ 20 = 5" },
  { question: "Budget R29,000. Venue R11,500, Band R6,000. R78 per guest. Max guests?", answer: 147, explanation: "29,000 − 11,500 − 6,000 = 11,500; 11,500 ÷ 78 = 147" },
  { question: "3-hour quiz night. Rounds 22 minutes each. How many full rounds?", answer: 8, explanation: "180 ÷ 22 = 8 full rounds" },
  { question: "Budget R38,000. Venue R15,500, Equipment R7,000. R100 per guest. Max guests?", answer: 155, explanation: "38,000 − 15,500 − 7,000 = 15,500; 15,500 ÷ 100 = 155" },
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
