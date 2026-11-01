import { describe, expect, it } from 'vitest';
import { RULES, mulberry } from '@game-of-resources';
import { runDoAction, runRuleChecks, validateActionOpt } from '../../domain/gameOfResources/actions';
import type { LockedWorldBundle } from '../../domain/gameOfResources/types';
import { DEFAULT_GOR_SETTINGS } from '../../domain/gameOfResources/types';

function mockBundle(state = RULES.defaultState(mulberry(1))): LockedWorldBundle {
  return {
    row: {
      id: 1,
      school_id: 1,
      town_class: '6A',
      seed: 1,
      seq: state.seq,
      round_number: state.round.n,
      round_open: state.round.open,
      round_started_at: null,
      round_ends_at: null,
      paused: false,
      treasury: state.treasury,
      env: state.env as Record<string, number>,
      mined_total: 0,
      projects: state.projects,
      land: {},
      works: state.works,
      harvest: {},
      tile_health: {},
      rested: {},
      stats: null,
      settled_rounds: [],
      settings: DEFAULT_GOR_SETTINGS,
      version: 1,
    },
    state,
    citizenRows: [],
    userIdToCitizenRowId: new Map(),
  };
}

describe('validateActionOpt', () => {
  it('rejects invalid donate quantity', () => {
    expect(validateActionOpt('donate', { qty: 0, project: 'well' })).toMatch(/1 and 99/);
  });

  it('accepts valid farm action options', () => {
    expect(validateActionOpt('farm', {})).toBeNull();
  });
});

describe('runDoAction', () => {
  it('rejects unknown actions', () => {
    const b = mockBundle();
    const r = runDoAction(b, 5, 'fly', {});
    expect(r.ok).toBe(false);
  });
});

describe('runRuleChecks', () => {
  it('includes passing default-state check', () => {
    const checks = runRuleChecks();
    expect(checks.find((c) => c.name === 'default state is valid')?.pass).toBe(true);
  });
});
