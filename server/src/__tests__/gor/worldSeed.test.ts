import { describe, expect, it } from 'vitest';
import { worldSeedForTown } from '../../domain/gameOfResources/worldRepository';

describe('worldSeedForTown', () => {
  it('always fits PostgreSQL integer', () => {
    for (const schoolId of [1, 2, 3, 42, 999, 12_345]) {
      for (const town of ['6A', '6B', '6C']) {
        const seed = worldSeedForTown(schoolId, town);
        expect(seed).toBeGreaterThan(0);
        expect(seed).toBeLessThanOrEqual(2_147_483_647);
      }
    }
  });
});
