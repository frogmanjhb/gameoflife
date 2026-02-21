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
