import { BiomeType, BiomeConfig, RiskLevel } from '../../types';

export const BIOME_CONFIG: Record<BiomeType, BiomeConfig> = {
  'Savanna': {
    baseValue: 20000,
    risk: 'medium',
    color: '#c4a747',
    lightColor: '#e8d999',
    pros: ['Good grazing land', 'Wildlife tourism potential', 'Moderate rainfall'],
    cons: ['Seasonal droughts', 'Fire risk', 'Limited water sources']
  },
  'Grassland': {
    baseValue: 15000,
    risk: 'low',
    color: '#7cb342',
    lightColor: '#aed581',
    pros: ['Excellent farming potential', 'Easy to develop', 'Stable ecosystem'],
    cons: ['Soil erosion risk', 'Limited shade', 'Overgrazing concerns']
  },
  'Forest': {
    baseValue: 35000,
    risk: 'medium',
    color: '#2e7d32',
    lightColor: '#66bb6a',
    pros: ['Rich biodiversity', 'Timber resources', 'Carbon credits potential'],
    cons: ['Fire risk', 'Clearing restrictions', 'Difficult access']
  },
  'Fynbos': {
    baseValue: 45000,
    risk: 'high',
    color: '#9c27b0',
    lightColor: '#ce93d8',
    pros: ['Unique biodiversity', 'Eco-tourism value', 'Protected species habitat'],
    cons: ['Fire-dependent ecosystem', 'Strict conservation laws', 'Limited development']
  },
  'Nama Karoo': {
    baseValue: 10000,
    risk: 'medium',
    color: '#8d6e63',
    lightColor: '#bcaaa4',
    pros: ['Sheep farming suited', 'Low land cost', 'Unique landscape'],
    cons: ['Very dry climate', 'Limited water', 'Remote location']
  },
  'Succulent Karoo': {
    baseValue: 4500,
    risk: 'high',
    color: '#ff7043',
    lightColor: '#ffab91',
    pros: ['Rare plant species', 'Research value', 'Mining potential'],
    cons: ['Extreme temperatures', 'Water scarcity', 'Conservation restrictions']
  },
  'Desert': {
    baseValue: 8000,
    risk: 'high',
    color: '#ffd54f',
    lightColor: '#ffee58',
    pros: ['Solar energy potential', 'Low land price', 'Mineral deposits'],
    cons: ['Extreme conditions', 'No water', 'Uninhabitable without infrastructure']
  },
  'Thicket': {
    baseValue: 25000,
    risk: 'low',
    color: '#558b2f',
    lightColor: '#8bc34a',
    pros: ['Carbon storage', 'Game farming potential', 'Drought resistant'],
    cons: ['Dense vegetation', 'Clearing needed', 'Elephant damage risk']
  },
  'Indian Ocean Coastal Belt': {
    baseValue: 60000,
    risk: 'medium',
    color: '#0288d1',
    lightColor: '#4fc3f7',
    pros: ['High property value', 'Tourism potential', 'Port access'],
    cons: ['Coastal erosion', 'Cyclone risk', 'High development costs']
  }
};

export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
};

export const getBiomeConfig = (biome: BiomeType): BiomeConfig => {
  return BIOME_CONFIG[biome];
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const BIOME_ICONS: Record<BiomeType, string> = {
  'Savanna': '🦁',
  'Grassland': '🌾',
  'Forest': '🌲',
  'Fynbos': '🌸',
  'Nama Karoo': '🏜️',
  'Succulent Karoo': '🌵',
  'Desert': '☀️',
  'Thicket': '🌿',
  'Indian Ocean Coastal Belt': '🌊'
};

// Weekly interest rate for land appreciation (2% per week)
export const WEEKLY_INTEREST_RATE = 0.02;

/**
 * Calculate the number of complete weeks since purchase
 */
export const getWeeksSincePurchase = (purchasedAt: string): number => {
  const purchaseDate = new Date(purchasedAt);
  const now = new Date();
  const diffMs = now.getTime() - purchaseDate.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, diffWeeks);
};

/**
 * Calculate the current value of land with 2% weekly compound interest
 * Formula: currentValue = originalValue * (1 + rate)^weeks
 */
export const calculateCurrentValue = (originalValue: number, purchasedAt: string): number => {
  const weeks = getWeeksSincePurchase(purchasedAt);
  if (weeks === 0) return originalValue;
  
  const currentValue = originalValue * Math.pow(1 + WEEKLY_INTEREST_RATE, weeks);
  return Math.round(currentValue);
};

/**
 * Calculate appreciation amount
 */
export const calculateAppreciation = (originalValue: number, purchasedAt: string): number => {
  const currentValue = calculateCurrentValue(originalValue, purchasedAt);
  return currentValue - originalValue;
};

/**
 * Calculate appreciation percentage
 */
export const calculateAppreciationPercent = (purchasedAt: string): number => {
  const weeks = getWeeksSincePurchase(purchasedAt);
  if (weeks === 0) return 0;
  
  const multiplier = Math.pow(1 + WEEKLY_INTEREST_RATE, weeks);
  return Math.round((multiplier - 1) * 100 * 100) / 100; // Round to 2 decimal places
};

