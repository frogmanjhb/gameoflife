// Helper functions for job level progression and XP calculations

// Calculate cumulative XP needed for a specific level
// Level 1->2: 100 XP, each subsequent level requires more XP
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  // Cumulative XP: 100 * level * (level + 1) / 2 - 100
  // This gives: L2=100, L3=300, L4=600, L5=1000, L6=1500, L7=2100, L8=2800, L9=3600, L10=4500
  return 100 * level * (level + 1) / 2 - 100;
}

// Get XP needed for next level from current level
export function getXPNeededForNextLevel(currentLevel: number): number {
  if (currentLevel >= 10) return 0; // Max level
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return nextLevelXP - currentLevelXP;
}

// Get XP progress for current level (how much XP they have towards next level)
export function getXPProgress(currentLevel: number, currentXP: number): {
  current: number;
  needed: number;
  percentage: number;
} {
  if (currentLevel >= 10) {
    return { current: 0, needed: 0, percentage: 100 };
  }
  
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const percentage = Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);
  
  return {
    current: xpInCurrentLevel,
    needed: xpNeededForNext,
    percentage
  };
}
