import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONFIG } from '@game-of-resources';
import type { ProfessionId } from '@game-of-resources';
import { gameOfResourcesApi } from '../../services/api';

const TOWNS = ['6A', '6B', '6C'] as const;
const PROFESSIONS = Object.keys(CONFIG.professions) as ProfessionId[];

export type TeacherPreviewCitizen = { userId: number; name: string; professionName: string; profession: string };

export default function GorTeacherPanel({
  onClose,
  onPreview,
}: {
  onClose: () => void;
  onPreview?: (town: string, citizens: TeacherPreviewCitizen[], userId: number) => void;
}) {
  const [town, setTown] = useState<string>('6A');
  const [citizens, setCitizens] = useState<Array<Record<string, unknown>>>([]);
  const [assignDraft, setAssignDraft] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [pendingBridge, setPendingBridge] = useState<Array<Record<string, unknown>>>([]);
  const [bridgeEnabled, setBridgeEnabled] = useState(false);
  const [coinsPerRand, setCoinsPerRand] = useState('10');

  const roster: TeacherPreviewCitizen[] = useMemo(
    () =>
      citizens.map((c) => ({
        userId: Number(c.userId),
        name: String(c.name),
        professionName: String(c.professionName),
        profession: String(c.profession),
      })),
    [citizens]
  );

  const load = useCallback(async () => {
    try {
      setErr('');
      const [citRes, pendRes] = await Promise.all([
        gameOfResourcesApi.teacherCitizens(town),
        gameOfResourcesApi.pendingBankBridge(town).catch(() => ({ data: [] })),
      ]);
      const rows = citRes.data as Array<Record<string, unknown>>;
      setCitizens(rows);
      const draft: Record<number, string> = {};
      rows.forEach((c) => {
        draft[Number(c.userId)] = String(c.profession);
      });
      setAssignDraft(draft);
      setPendingBridge(pendRes.data as Array<Record<string, unknown>>);
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not load citizens.');
    }
  }, [town]);

  useEffect(() => {
    load();
  }, [load]);

  const round = async (op: 'open' | 'close' | 'advance') => {
    try {
      setErr('');
      await gameOfResourcesApi.teacherRound(op, town);
      setMsg(`Round ${op} completed.`);
      load();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Round action failed.');
    }
  };

  const saveBridgeSettings = async () => {
    try {
      setErr('');
      await gameOfResourcesApi.teacherSettings(town, {
        bankBridgeEnabled: bridgeEnabled,
        bankBridgeCoinsPerRand: Math.max(1, parseInt(coinsPerRand, 10) || 10),
      });
      setMsg('Settings saved.');
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not save settings.');
    }
  };

  const reviewBridge = async (id: number, approve: boolean) => {
    try {
      setErr('');
      if (approve) await gameOfResourcesApi.approveBankBridge(id, town);
      else await gameOfResourcesApi.denyBankBridge(id, town);
      setMsg(approve ? 'Conversion approved.' : 'Conversion denied.');
      load();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Review failed.');
    }
  };

  const assignJob = async (userId: number) => {
    const profession = assignDraft[userId];
    if (!profession) return;
    try {
      setErr('');
      await gameOfResourcesApi.teacherAssignProfession({ town_class: town, user_id: userId, profession });
      setMsg('Job updated.');
      load();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not assign job.');
    }
  };

  return (
    <div className="card" style={{ position: 'fixed', inset: '5%', zIndex: 70, overflow: 'auto', background: 'var(--panel)' }}>
      <div className="row">
        <h2>Teacher — Game of Resources</h2>
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
      <label className="field">
        Town
        <select value={town} onChange={(e) => setTown(e.target.value)}>
          {TOWNS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <button type="button" className="btn" onClick={() => round('open')}>
          Open round
        </button>
        <button type="button" className="btn" onClick={() => round('close')}>
          Close round
        </button>
        <button type="button" className="btn primary" onClick={() => round('advance')}>
          Advance and settle
        </button>
      </div>
      {msg && <p className="notice info">{msg}</p>}
      {err && <p className="notice warn">{err}</p>}
      <div className="card stack">
        <h3>Bank bridge (optional)</h3>
        <label className="row">
          <input type="checkbox" checked={bridgeEnabled} onChange={(e) => setBridgeEnabled(e.target.checked)} />
          Allow students to request game coin conversion
        </label>
        <label className="field">
          Game coins per R1
          <input type="number" min={1} value={coinsPerRand} onChange={(e) => setCoinsPerRand(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={saveBridgeSettings}>
          Save bridge settings
        </button>
      </div>
      {pendingBridge.length > 0 && (
        <div className="card stack">
          <h3>Pending coin conversions</h3>
          {pendingBridge.map((p) => (
            <div key={String(p.id)} className="row">
              <span>
                {String(p.username)} — {String(p.game_coins)} coins → R{String(p.bank_amount)}
              </span>
              <button type="button" className="btn primary" onClick={() => reviewBridge(Number(p.id), true)}>
                Approve
              </button>
              <button type="button" className="btn" onClick={() => reviewBridge(Number(p.id), false)}>
                Deny
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="tbl-wrap" style={{ marginTop: 12 }}>
        <table style={{ width: '100%', fontSize: 14 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Job</th>
              <th>Assign job</th>
              <th>Actions</th>
              <th>Inactive</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {citizens.map((c) => {
              const uid = Number(c.userId);
              return (
                <tr key={String(c.userId)}>
                  <td>{String(c.name)}</td>
                  <td>{String(c.professionName)}</td>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                      <select
                        value={assignDraft[uid] ?? String(c.profession)}
                        onChange={(e) => setAssignDraft((d) => ({ ...d, [uid]: e.target.value }))}
                        aria-label={`Job for ${String(c.name)}`}
                      >
                        {PROFESSIONS.map((p) => (
                          <option key={p} value={p}>
                            {CONFIG.professions[p].name}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn" onClick={() => assignJob(uid)}>
                        Set
                      </button>
                    </div>
                  </td>
                  <td>{String(c.actions)}</td>
                  <td>{c.inactive ? 'Yes' : 'No'}</td>
                  <td>
                    {onPreview ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onPreview(town, roster, uid)}
                      >
                        View world
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small" style={{ marginTop: 8 }}>
        Assigning a job does not cost the student XP. Use preview to switch between students and check tile names on the
        map.
      </p>
    </div>
  );
}
