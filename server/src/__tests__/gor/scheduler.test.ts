import { describe, expect, it } from 'vitest';
import {
  isAutomationPaused,
  isWorldDueForAdvance,
  nextRoundEndsAt,
  zonedInstantUtc,
} from '../../domain/gameOfResources/scheduleTime';
import { DEFAULT_GOR_SETTINGS } from '../../domain/gameOfResources/types';
import type { GorWorldRow } from '../../domain/gameOfResources/types';
import { RULES, mulberry } from '@game-of-resources';

function mockRow(overrides: Partial<GorWorldRow>): GorWorldRow {
  return {
    id: 1,
    school_id: 1,
    town_class: '6A',
    seed: 1,
    seq: 1,
    round_number: 1,
    round_open: true,
    round_started_at: null,
    round_ends_at: null,
    paused: false,
    treasury: 250,
    env: {},
    mined_total: 0,
    projects: {},
    land: {},
    works: { reclaim: null, link: null },
    harvest: {},
    tile_health: {},
    rested: {},
    stats: null,
    settled_rounds: [],
    settings: DEFAULT_GOR_SETTINGS,
    version: 1,
    ...overrides,
  };
}

describe('scheduleTime', () => {
  it('maps 06:00 Johannesburg to 04:00 UTC', () => {
    const d = zonedInstantUtc(2026, 3, 15, 6, 0, 'Africa/Johannesburg');
    expect(d.toISOString()).toBe('2026-03-15T04:00:00.000Z');
  });

  it('nextRoundEndsAt is after the reference instant', () => {
    const after = new Date('2026-03-15T05:00:00.000Z');
    const ends = nextRoundEndsAt(DEFAULT_GOR_SETTINGS, after);
    expect(ends.getTime()).toBeGreaterThan(after.getTime());
  });

  it('isWorldDueForAdvance when ends_at passed', () => {
    const row = mockRow({ round_ends_at: new Date('2020-01-01T00:00:00.000Z') });
    expect(isWorldDueForAdvance(row, new Date())).toBe(true);
  });

  it('automation paused skips due worlds', () => {
    const row = mockRow({
      round_ends_at: new Date('2020-01-01T00:00:00.000Z'),
      settings: { ...DEFAULT_GOR_SETTINGS, automationPaused: true },
    });
    expect(isAutomationPaused(row)).toBe(true);
    expect(isWorldDueForAdvance(row, new Date())).toBe(false);
  });
});

describe('scheduler settlement idempotency (rules)', () => {
  it('settleRound refuses a round that was already settled', () => {
    const s = RULES.defaultState(mulberry(11));
    const once = RULES.settleRound(s);
    expect(once.ok).toBe(true);
    const again = RULES.settleRound(once.state as typeof s);
    expect(again.ok).toBe(false);
  });

  it('advanceRound fails if the current round was already settled without incrementing', () => {
    const s = RULES.defaultState(mulberry(12));
    const settled = RULES.settleRound(s);
    expect(settled.ok).toBe(true);
    const advance = RULES.advanceRound(settled.state as typeof s);
    expect(advance.ok).toBe(false);
  });
});
