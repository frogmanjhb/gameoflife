/**
 * Strip "X position(s) available." from job requirements when displaying in awarded-job views.
 * Removes phrases like "Two positions available.", "One position available.", "3 positions available."
 */
export function stripPositionsAvailableFromRequirements(requirements: string | null | undefined): string {
  if (!requirements || !requirements.trim()) return '';
  return requirements
    .replace(/(?:One|Two|Three|\d+)\s+positions?\s+available\.?\s*/gi, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/** Map old DB job names to new display names (so board shows new titles even before migration). */
export const JOB_NAME_TO_DISPLAY: Record<string, string> = {
  'Financial Manager': 'Assistant Financial Manager',
  'Chartered Accountant': 'Junior Chartered Accountant',
  'HR Director': 'Assistant HR Director',
  'Police Lieutenant': 'Junior Police Lieutenant',
  'Lawyer': 'Junior Lawyer',
  'Town Planner': 'Assistant Town Planner',
  'Civil Engineer': 'Assistant Civil Engineer',
  'Electrical Engineer': 'Assistant Electrical Engineer',
  'Architect': 'Assistant Architect',
  'School Principal': 'Assistant Principal',
  'Teacher': 'Assistant Teacher',
  'Doctor': 'Junior Doctor',
  'Nurse': 'Assistant Nurse',
  'Retail Manager': 'Assistant Retail Manager',
  'Event Planner': 'Assistant Event Planner',
  'Marketing Manager': 'Assistant Marketing Manager',
  'Graphic Designer': 'Assistant Graphic Designer',
  'Journalist': 'Assistant Journalist',
  'Software Engineer': 'Assistant Software Engineer',
};

/** Employment board sections: heading and job names (include both old and new so grouping works before/after migration). */
export const EMPLOYMENT_BOARD_SECTIONS: { title: string; emoji: string; jobNames: string[] }[] = [
  { title: 'Government & Finance', emoji: '🏛', jobNames: ['Mayor', 'Financial Manager', 'Assistant Financial Manager', 'Chartered Accountant', 'Junior Chartered Accountant', 'HR Director', 'Assistant HR Director', 'Police Lieutenant', 'Junior Police Lieutenant', 'Lawyer', 'Junior Lawyer', 'Town Planner', 'Assistant Town Planner', 'Assistant Risk & Insurance Manager'] },
  { title: 'Infrastructure & Design', emoji: '🏗', jobNames: ['Civil Engineer', 'Assistant Civil Engineer', 'Electrical Engineer', 'Assistant Electrical Engineer', 'Architect', 'Assistant Architect'] },
  { title: 'Education', emoji: '🎓', jobNames: ['School Principal', 'Assistant Principal', 'Teacher', 'Assistant Teacher'] },
  { title: 'Health', emoji: '🏥', jobNames: ['Doctor', 'Junior Doctor', 'Nurse', 'Assistant Nurse'] },
  { title: 'Economy & Events', emoji: '🛍', jobNames: ['Retail Manager', 'Assistant Retail Manager', 'Event Planner', 'Assistant Event Planner', 'Entrepreneur – Town Business Founder'] },
  { title: 'Media & Tech', emoji: '🎨', jobNames: ['Marketing Manager', 'Assistant Marketing Manager', 'Graphic Designer', 'Assistant Graphic Designer', 'Journalist', 'Assistant Journalist', 'Software Engineer', 'Assistant Software Engineer'] },
];

/** Unique emoji per job for cards and lists. Unknown jobs get 💼. */
export const JOB_NAME_TO_EMOJI: Record<string, string> = {
  'Mayor': '👑',
  'Assistant Town Planner': '🗺️',
  'Junior Lawyer': '⚖️',
  'Junior Police Lieutenant': '👮',
  'Assistant HR Director': '👥',
  'Junior Chartered Accountant': '📊',
  'Assistant Financial Manager': '💰',
  'Assistant Risk & Insurance Manager': '🛡️',
  'Assistant Civil Engineer': '🌉',
  'Assistant Electrical Engineer': '⚡',
  'Assistant Architect': '📐',
  'Assistant Principal': '🎓',
  'Assistant Teacher': '📚',
  'Junior Doctor': '🩺',
  'Assistant Nurse': '💉',
  'Assistant Retail Manager': '🛒',
  'Assistant Event Planner': '📅',
  'Entrepreneur – Town Business Founder': '🚀',
  'Assistant Marketing Manager': '📢',
  'Assistant Graphic Designer': '🎨',
  'Assistant Journalist': '📰',
  'Assistant Software Engineer': '💻',
};

export function getJobEmoji(jobName: string | null | undefined): string {
  if (!jobName || !jobName.trim()) return '💼';
  const trimmed = jobName.trim();
  return JOB_NAME_TO_EMOJI[trimmed] ?? '💼';
}

/** Display name for employment board (use new title even when API still returns old name). */
export function getJobDisplayNameForBoard(jobName: string | null | undefined): string {
  if (!jobName || !jobName.trim()) return '';
  const trimmed = jobName.trim();
  return JOB_NAME_TO_DISPLAY[trimmed] ?? trimmed;
}

/**
 * Display job title by level: L1–3 Assistant/Junior, L4–8 Associate, L9–10 Senior.
 * Mayor is unchanged (elected role).
 */
export function getDisplayJobTitle(jobName: string | null | undefined, jobLevel: number = 1): string {
  if (!jobName || !jobName.trim()) return '';
  const name = jobName.trim();
  if (name.toLowerCase() === 'mayor') return name;
  const level = Math.min(10, Math.max(1, jobLevel));
  if (level >= 9) {
    if (name.startsWith('Assistant ')) return 'Senior ' + name.slice(10);
    if (name.startsWith('Junior ')) return 'Senior ' + name.slice(7);
    return name;
  }
  if (level >= 4) {
    if (name.startsWith('Assistant ')) return 'Associate ' + name.slice(10);
    if (name.startsWith('Junior ')) return 'Associate ' + name.slice(7);
    return name;
  }
  return name;
}
