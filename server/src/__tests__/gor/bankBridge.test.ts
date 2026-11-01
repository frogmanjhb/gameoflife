import { describe, expect, it } from 'vitest';
import { bankRandFromCoins, bridgeSettingsFromWorld } from '../../domain/gameOfResources/bankBridge';

describe('bankBridge helpers', () => {
  it('computes whole rand from coins and rate', () => {
    expect(bankRandFromCoins(25, 10)).toBe(2);
    expect(bankRandFromCoins(9, 10)).toBe(0);
  });

  it('defaults bridge settings', () => {
    const s = bridgeSettingsFromWorld({});
    expect(s.enabled).toBe(false);
    expect(s.coinsPerRand).toBe(10);
  });
});
