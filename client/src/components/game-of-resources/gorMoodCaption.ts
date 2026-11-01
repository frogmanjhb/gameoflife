import { CONFIG, RULES } from '@game-of-resources';
import type { GameState } from '@game-of-resources';

/** Village mood line under the planet (from prototype). */
export function moodCaption(s: GameState): string {
  const st = s.stats?.startEnv ?? s.env;
  const e = s.env;
  const out: string[] = [];
  const band = RULES.waterBand(e.water);
  if (e.water > st.water) out.push('The river is clearing.');
  else if (e.water < st.water) {
    out.push(
      band.key === 'clear'
        ? 'The river is still clear, but it is getting dirtier.'
        : 'The river is getting dirtier.'
    );
  } else out.push(`The river is ${band.name.toLowerCase()}.`);
  if (e.forest < CONFIG.actions.chop.minForest) out.push('The forest is in danger. Logging has stopped.');
  else if (e.forest > st.forest) out.push('The forest is recovering.');
  else if (e.forest < st.forest) out.push('The forest is shrinking.');
  else out.push(e.forest >= 60 ? 'The forest is healthy.' : 'The forest is recovering slowly.');
  const hab = RULES.habLevel(s);
  if (hab === 'bad') out.push('Natural Habitat is critical. Everyone is tired.');
  else if (hab === 'warn') out.push('Wild animals are losing their homes.');
  if (e.pollution > 60) out.push('Grey haze hangs over the island.');
  else if (e.soil < 30) out.push('The farm soil is worn out.');
  return out.join(' ');
}
