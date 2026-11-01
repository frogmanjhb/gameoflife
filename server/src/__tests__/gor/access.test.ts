import { describe, expect, it } from 'vitest';
import { isTownClass, isProfessionId, stripHtml, jobChangeOptsFromSettings } from '../../domain/gameOfResources/access';
import { CONFIG } from '@game-of-resources';

describe('access helpers', () => {
  it('validates town classes', () => {
    expect(isTownClass('6A')).toBe(true);
    expect(isTownClass('7A')).toBe(false);
  });

  it('validates profession ids', () => {
    expect(isProfessionId('farmer')).toBe(true);
    expect(isProfessionId('astronaut')).toBe(false);
  });

  it('strips HTML from reflections', () => {
    expect(stripHtml('<b>Hello</b>')).toBe('Hello');
  });

  it('merges job change settings with CONFIG defaults', () => {
    const opts = jobChangeOptsFromSettings({});
    expect(opts.xpCost).toBe(CONFIG.jobChange.xpCost);
    expect(opts.xpSource).toBe('game');
  });
});
