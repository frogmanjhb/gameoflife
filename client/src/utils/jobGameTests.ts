/**
 * Job games that can be tested by teachers from the Employment Board.
 * Key must match the game route prefix (e.g. architect -> architect-game).
 */
export const JOB_GAME_TEST_LIST: { key: JobGameTestKey; label: string }[] = [
  { key: 'architect', label: 'Architect' },
  { key: 'accountant', label: 'Accountant' },
  { key: 'softwareEngineer', label: 'Software Engineer' },
  { key: 'marketingManager', label: 'Marketing Manager' },
  { key: 'graphicDesigner', label: 'Graphic Designer' },
  { key: 'journalist', label: 'Journalist' },
  { key: 'eventPlanner', label: 'Event Planner' },
  { key: 'financialManager', label: 'Financial Manager' },
  { key: 'hrDirector', label: 'HR Director' },
  { key: 'policeLieutenant', label: 'Police Lieutenant' },
  { key: 'lawyer', label: 'Lawyer' },
  { key: 'townPlanner', label: 'Town Planner' },
  { key: 'electricalEngineer', label: 'Electrical Engineer' },
  { key: 'civilEngineer', label: 'Civil Engineer' },
  { key: 'principal', label: 'Principal' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'nurse', label: 'Nurse' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'retailManager', label: 'Retail Manager' },
  { key: 'entrepreneur', label: 'Entrepreneur' },
];

export type JobGameTestKey = typeof JOB_GAME_TEST_LIST[number]['key'];
