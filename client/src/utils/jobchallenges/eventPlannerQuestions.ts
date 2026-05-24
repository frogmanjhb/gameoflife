// Event Planner – Event Budget Challenge (client, same as server)
// 20 questions per difficulty tier. All numeric answers.

export interface EventPlannerQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

const easyQuestions: EventPlannerQuestion[] = [
  { question: "Sandton rooftop terrace holds 140 guests. Tickets R85 each. Sold out. Total revenue (R)?", answer: 11900, explanation: "140 × 85 = R11,900" },
  { question: "You sell 65 tickets at R120 each for a Durban jazz night. Revenue (R)?", answer: 7800, explanation: "65 × 120 = R7,800" },
  { question: "Cape Town amphitheatre capacity 320. Ticket R45. Full house. Revenue (R)?", answer: 14400, explanation: "320 × 45 = R14,400" },
  { question: "Beachfront tent event: 95 tickets at R68. Revenue (R)?", answer: 6460, explanation: "95 × 68 = R6,460" },
  { question: "Soweto community hall seats 180. Tickets R38. Sold out. Revenue (R)?", answer: 6840, explanation: "180 × 38 = R6,840" },
  { question: "Revenue R13,500. Expenses R8,400. Profit (R)?", answer: 5100, explanation: "13,500 − 8,400 = R5,100" },
  { question: "55 VIP tickets at R95 each. Revenue (R)?", answer: 5225, explanation: "55 × 95 = R5,225" },
  { question: "Stellenbosch wine estate seats 70. Tickets R250. Full. Revenue (R)?", answer: 17500, explanation: "70 × 250 = R17,500" },
  { question: "Revenue R4,800. Costs R2,950. Profit (R)?", answer: 1850, explanation: "4,800 − 2,950 = R1,850" },
  { question: "130 general admission tickets at R42. Revenue (R)?", answer: 5460, explanation: "130 × 42 = R5,460" },
  { question: "Pretoria expo centre capacity 260. Ticket R28. Sold out. Revenue (R)?", answer: 7280, explanation: "260 × 28 = R7,280" },
  { question: "Revenue R11,200. Expenses R6,750. Profit (R)?", answer: 4450, explanation: "11,200 − 6,750 = R4,450" },
  { question: "42 premium tickets at R155. Revenue (R)?", answer: 6510, explanation: "42 × 155 = R6,510" },
  { question: "Johannesburg art gallery seats 85. Tickets R110. Full. Revenue (R)?", answer: 9350, explanation: "85 × 110 = R9,350" },
  { question: "Revenue R6,650. Costs R4,200. Profit (R)?", answer: 2450, explanation: "6,650 − 4,200 = R2,450" },
  { question: "115 tickets at R58 for a school concert. Revenue (R)?", answer: 6670, explanation: "115 × 58 = R6,670" },
  { question: "Bloemfontein civic centre capacity 200. Ticket R32. Full. Revenue (R)?", answer: 6400, explanation: "200 × 32 = R6,400" },
  { question: "Revenue R9,880. Expenses R5,460. Profit (R)?", answer: 4420, explanation: "9,880 − 5,460 = R4,420" },
  { question: "88 tickets at R82 for a charity gala. Revenue (R)?", answer: 7216, explanation: "88 × 82 = R7,216" },
  { question: "Polokwane stadium annex seats 165. Tickets R46. Sold out. Revenue (R)?", answer: 7590, explanation: "165 × 46 = R7,590" }
];

const mediumQuestions: EventPlannerQuestion[] = [
  { question: "Revenue R22,000. Costs: Venue R7,500, Catering R8,200, Security R1,800. Profit (R)?", answer: 4500, explanation: "22,000 − 7,500 − 8,200 − 1,800 = R4,500" },
  { question: "Heritage Day braai: R62 per guest for catering. 95 guests. Total catering cost (R)?", answer: 5890, explanation: "62 × 95 = R5,890" },
  { question: "Revenue R16,500. Venue R5,200, Catering R6,400, DJ R2,100. Profit (R)?", answer: 2800, explanation: "16,500 − 5,200 − 6,400 − 2,100 = R2,800" },
  { question: "R48 per person for food. 110 guests attend. Total food cost (R)?", answer: 5280, explanation: "48 × 110 = R5,280" },
  { question: "Revenue R19,800. Venue R6,500, Catering R7,500, Lighting R2,800. Profit (R)?", answer: 3000, explanation: "19,800 − 6,500 − 7,500 − 2,800 = R3,000" },
  { question: "R55 per guest catering at a corporate lunch. 72 guests. Catering cost (R)?", answer: 3960, explanation: "55 × 72 = R3,960" },
  { question: "Revenue R13,250. Venue R4,100, Catering R5,800, Staff R1,200. Profit (R)?", answer: 2150, explanation: "13,250 − 4,100 − 5,800 − 1,200 = R2,150" },
  { question: "R58 per head for a wedding reception. 88 attendees. Catering total (R)?", answer: 5104, explanation: "58 × 88 = R5,104" },
  { question: "Revenue R24,000. Venue R8,000, Catering R9,500, Decor R3,200. Profit (R)?", answer: 3300, explanation: "24,000 − 8,000 − 9,500 − 3,200 = R3,300" },
  { question: "R41 per guest for a youth summit. 125 guests. Catering total (R)?", answer: 5125, explanation: "41 × 125 = R5,125" },
  { question: "Revenue R10,400. Venue R3,000, Catering R4,200, Equipment R950. Profit (R)?", answer: 2250, explanation: "10,400 − 3,000 − 4,200 − 950 = R2,250" },
  { question: "R67 per person for a product launch. 65 guests. Total per-person cost (R)?", answer: 4355, explanation: "67 × 65 = R4,355" },
  { question: "Revenue R21,600. Venue R7,200, Catering R8,800, AV R2,100. Profit (R)?", answer: 3500, explanation: "21,600 − 7,200 − 8,800 − 2,100 = R3,500" },
  { question: "R53 per guest for a graduation dinner. 102 guests. Catering total (R)?", answer: 5406, explanation: "53 × 102 = R5,406" },
  { question: "Revenue R14,750. Venue R4,800, Catering R5,900, Staff R1,650. Profit (R)?", answer: 2400, explanation: "14,750 − 4,800 − 5,900 − 1,650 = R2,400" },
  { question: "R44 per head for a community fundraiser. 96 guests. Catering (R)?", answer: 4224, explanation: "44 × 96 = R4,224" },
  { question: "Revenue R17,300. Venue R5,500, Catering R6,800, Security R1,400. Profit (R)?", answer: 3600, explanation: "17,300 − 5,500 − 6,800 − 1,400 = R3,600" },
  { question: "R51 per guest for a matric farewell. 78 guests. Catering cost (R)?", answer: 3978, explanation: "51 × 78 = R3,978" },
  { question: "Revenue R11,900. Venue R3,700, Catering R4,500, Flowers R800. Profit (R)?", answer: 2900, explanation: "11,900 − 3,700 − 4,500 − 800 = R2,900" },
  { question: "R49 per person for a sports awards night. 115 guests. Catering total (R)?", answer: 5635, explanation: "49 × 115 = R5,635" }
];

const hardQuestions: EventPlannerQuestion[] = [
  { question: "Total fixed costs R11,500. Hall capacity 230. Break-even ticket price (R) if sold out?", answer: 50, explanation: "11,500 ÷ 230 = R50" },
  { question: "You expect 125 guests at a golf day. Costs R8,750. Break-even ticket price (R)?", answer: 70, explanation: "8,750 ÷ 125 = R70" },
  { question: "Fixed costs R14,400. Capacity 288. Break-even price per ticket (R) if full?", answer: 50, explanation: "14,400 ÷ 288 = R50" },
  { question: "Expected attendance 90 at a craft market. Costs R6,300. Break-even entry fee (R)?", answer: 70, explanation: "6,300 ÷ 90 = R70" },
  { question: "Total costs R17,500. Capacity 350. Break-even price (R)?", answer: 50, explanation: "17,500 ÷ 350 = R50" },
  { question: "110 guests expected for a comedy show. R7,700 costs. Break-even ticket (R)?", answer: 70, explanation: "7,700 ÷ 110 = R70" },
  { question: "Fixed costs R9,450. Hall holds 189. Break-even ticket (R)?", answer: 50, explanation: "9,450 ÷ 189 = R50" },
  { question: "140 guests at a food festival. Costs R9,800. Break-even price (R)?", answer: 70, explanation: "9,800 ÷ 140 = R70" },
  { question: "Costs R13,200. Capacity 220. Break-even per ticket (R)?", answer: 60, explanation: "13,200 ÷ 220 = R60" },
  { question: "100 expected at a poetry slam. R5,500 costs. Break-even ticket (R)?", answer: 55, explanation: "5,500 ÷ 100 = R55" },
  { question: "Fixed R12,800. Capacity 256. Break-even price (R)?", answer: 50, explanation: "12,800 ÷ 256 = R50" },
  { question: "160 guests at a dance recital. R11,200 costs. Break-even (R)?", answer: 70, explanation: "11,200 ÷ 160 = R70" },
  { question: "Costs R10,800. Capacity 180. Break-even price (R)?", answer: 60, explanation: "10,800 ÷ 180 = R60" },
  { question: "85 expected at a film screening. R4,675 costs. Break-even price (R)?", answer: 55, explanation: "4,675 ÷ 85 = R55" },
  { question: "Fixed R15,600. Capacity 312. Break-even ticket (R)?", answer: 50, explanation: "15,600 ÷ 312 = R50" },
  { question: "135 guests at a tech expo. R9,450 costs. Break-even (R)?", answer: 70, explanation: "9,450 ÷ 135 = R70" },
  { question: "Costs R19,500. Capacity 325. Break-even price (R)?", answer: 60, explanation: "19,500 ÷ 325 = R60" },
  { question: "75 expected at a book launch. R4,125 costs. Break-even ticket (R)?", answer: 55, explanation: "4,125 ÷ 75 = R55" },
  { question: "Fixed R18,900. Capacity 378. Break-even (R per ticket)?", answer: 50, explanation: "18,900 ÷ 378 = R50" },
  { question: "115 guests at a farmers market gala. R8,050 costs. Break-even price (R)?", answer: 70, explanation: "8,050 ÷ 115 = R70" }
];

const extremeQuestions: EventPlannerQuestion[] = [
  { question: "Heritage Day festival runs 3.5 hours. Each act lasts 25 minutes. How many full acts fit?", answer: 8, explanation: "3.5 × 60 = 210 min; 210 ÷ 25 = 8 full acts" },
  { question: "Budget R18,500. Venue R7,200, Band R5,800. Catering R65 per person. Max guests?", answer: 84, explanation: "18,500 − 7,200 − 5,800 = 5,500; 5,500 ÷ 65 = 84" },
  { question: "Joburg jazz night is 4.5 hours. Each set 35 minutes. How many full sets?", answer: 7, explanation: "270 ÷ 35 = 7 full sets" },
  { question: "Budget R24,000. Venue R9,500, Decor R3,800. R72 per person catering. Max guests?", answer: 148, explanation: "24,000 − 9,500 − 3,800 = 10,700; 10,700 ÷ 72 = 148" },
  { question: "School concert 2 hours. Each performance 12 minutes. How many performances?", answer: 10, explanation: "120 ÷ 12 = 10" },
  { question: "Budget R14,500. Venue R5,500, Equipment R2,000. R55 per guest. Max guests?", answer: 127, explanation: "14,500 − 5,500 − 2,000 = 7,000; 7,000 ÷ 55 = 127" },
  { question: "Corporate gala 5 hours. Each session 40 minutes. How many full sessions?", answer: 7, explanation: "300 ÷ 40 = 7 full sessions" },
  { question: "Budget R28,000. Venue R11,000, DJ R4,500. R80 per person. How many guests?", answer: 156, explanation: "28,000 − 11,000 − 4,500 = 12,500; 12,500 ÷ 80 = 156" },
  { question: "75-minute talent show. 9-minute slots. How many full slots?", answer: 8, explanation: "75 ÷ 9 = 8 full slots" },
  { question: "Budget R16,800. Venue R6,200, Band R3,600. R50 per guest. Max guests?", answer: 140, explanation: "16,800 − 6,200 − 3,600 = 7,000; 7,000 ÷ 50 = 140" },
  { question: "Festival 6 hours. Breaks 15 min each, 5 breaks. Total break time (minutes)?", answer: 75, explanation: "5 × 15 = 75 min" },
  { question: "Budget R32,000. Venue R13,500, Security R3,500. R90 per guest. Max guests?", answer: 166, explanation: "32,000 − 13,500 − 3,500 = 15,000; 15,000 ÷ 90 = 166" },
  { question: "3-hour market fair. Stall rotations every 18 minutes. How many full rotations?", answer: 10, explanation: "180 ÷ 18 = 10" },
  { question: "Budget R21,500. Venue R8,400, Decor R2,600. R58 per person. Max guests?", answer: 181, explanation: "21,500 − 8,400 − 2,600 = 10,500; 10,500 ÷ 58 = 181" },
  { question: "4.5-hour awards ceremony. Speeches 22 minutes each. How many full speeches?", answer: 12, explanation: "270 ÷ 22 = 12 full speeches" },
  { question: "Budget R19,200. Venue R7,800, fixed catering R2,400. R62 per head extra for 160 guests. Extra catering cost (R)?", answer: 9920, explanation: "160 × 62 = R9,920" },
  { question: "95-minute workshop day. Workshops 19 minutes each. How many full workshops?", answer: 5, explanation: "95 ÷ 19 = 5" },
  { question: "Budget R26,500. Venue R10,200, Band R5,300. R75 per guest. Max guests?", answer: 146, explanation: "26,500 − 10,200 − 5,300 = 11,000; 11,000 ÷ 75 = 146" },
  { question: "2.5-hour quiz night. Rounds 20 minutes each. How many full rounds?", answer: 7, explanation: "150 ÷ 20 = 7 full rounds" },
  { question: "Budget R35,000. Venue R14,000, Equipment R6,000. R95 per guest. Max guests?", answer: 157, explanation: "35,000 − 14,000 − 6,000 = 15,000; 15,000 ÷ 95 = 157" }
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
