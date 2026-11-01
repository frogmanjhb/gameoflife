import { RULES } from '@game-of-resources';
import type { GameState } from '@game-of-resources';
import { GorIcon } from './GorIconSprite';

type PlanResult = ReturnType<typeof RULES.plan>;

function fmtGains(p: PlanResult): string {
  const parts = Object.entries(p.gains || {}).map(([k, v]) => `+${v} ${k}`);
  if (p.coins) parts.push(`+${p.coins} coins`);
  return parts.join(' · ') || 'No items for you';
}

function fmtCosts(p: PlanResult): string {
  return Object.entries(p.costs || {})
    .map(([k, v]) => `-${v} ${k}`)
    .join(' · ');
}

function fmtEnv(p: PlanResult): string {
  return Object.entries(p.env || {})
    .map(([k, v]) => {
      const n = RULES.ENV_NAMES[k as keyof typeof RULES.ENV_NAMES] ?? k;
      return `${n} ${Number(v) > 0 ? '+' : ''}${v}`;
    })
    .join(' · ');
}

type Props = {
  title: string;
  iconId: string;
  plan: PlanResult;
  buttonLabel: string;
  onRun: () => void;
  busy: boolean;
  roundOpen: boolean;
  hint?: React.ReactNode;
};

export default function GorActionCard({
  title,
  iconId,
  plan,
  buttonLabel,
  onRun,
  busy,
  roundOpen,
  hint,
}: Props) {
  const disabled = busy || !plan.ok || !roundOpen;
  const costs = fmtCosts(plan);
  const env = fmtEnv(plan);

  return (
    <article className={`card act-card${plan.ok ? '' : ' is-off'}`}>
      <h3>
        <GorIcon id={iconId} />
        {title}
        <span className="ap-chip">{plan.ap} AP</span>
      </h3>
      <dl className="kv">
        <dt>You get</dt>
        <dd>{fmtGains(plan)}</dd>
        {costs ? (
          <>
            <dt>You use</dt>
            <dd>{costs}</dd>
          </>
        ) : null}
        <dt>World</dt>
        <dd>{env || 'No change to the land'}</dd>
      </dl>
      {hint}
      {plan.note && plan.ok ? <p className="small">{plan.note}</p> : null}
      <button type="button" className="btn primary block" disabled={disabled} aria-disabled={disabled} onClick={onRun}>
        {buttonLabel}
      </button>
      {!plan.ok && plan.reason ? (
        <p className="why">
          <GorIcon id="i-alert" className="ic sm" />
          <span>{plan.reason}</span>
        </p>
      ) : null}
    </article>
  );
}
