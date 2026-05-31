import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Scale } from 'lucide-react';
import { usePlugins } from '../contexts/PluginContext';
import { lawsuitsApi, StudentLawsuit } from '../services/api';

interface Props {
  jobName: string;
}

const LawsuitJobPanels: React.FC<Props> = ({ jobName }) => {
  const { plugins } = usePlugins();
  const courtEnabled = plugins.some((p) => p.route_path === '/court' && p.enabled);
  const isHr = jobName.toLowerCase().includes('hr director');
  const isLawyer = jobName.toLowerCase().includes('lawyer');

  const [hrQueue, setHrQueue] = useState<StudentLawsuit[]>([]);
  const [plaintiffCases, setPlaintiffCases] = useState<StudentLawsuit[]>([]);
  const [defendantCases, setDefendantCases] = useState<StudentLawsuit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hrNotes, setHrNotes] = useState<Record<number, string>>({});
  const [lawyerNotes, setLawyerNotes] = useState<Record<number, string>>({});
  const [lawyerOpinion, setLawyerOpinion] = useState<Record<number, string>>({});
  const [settlementAmount, setSettlementAmount] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    if (!courtEnabled) return;
    setLoading(true);
    setError(null);
    try {
      if (isHr) {
        const res = await lawsuitsApi.getHrQueue();
        setHrQueue(res.data);
      }
      if (isLawyer) {
        const res = await lawsuitsApi.getLawyerQueue();
        setPlaintiffCases(res.data.plaintiff_clients || []);
        setDefendantCases(res.data.defendant_clients || []);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to load lawsuit queue');
    } finally {
      setLoading(false);
    }
  }, [courtEnabled, isHr, isLawyer]);

  useEffect(() => {
    if (courtEnabled && (isHr || isLawyer)) load();
  }, [courtEnabled, isHr, isLawyer, load]);

  if (!courtEnabled || (!isHr && !isLawyer)) return null;

  const caseTitle = (c: StudentLawsuit) =>
    `#${c.id} ${c.plaintiff_username} vs ${c.defendant_username} — R${Number(c.claim_amount).toFixed(0)}`;

  const linkedLabel = (c: StudentLawsuit) =>
    c.linked_action_type ? (
      <p className="text-xs text-indigo-700 mt-1">
        Linked: {c.linked_action_type} #{c.linked_action_id}
      </p>
    ) : null;

  return (
    <div className="mb-6 space-y-4">
      {isHr && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <Scale className="h-5 w-5 text-purple-600" />
            Lawsuit mediation (HR)
          </h3>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {success && <p className="text-sm text-green-700 mb-2">{success}</p>}
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          ) : hrQueue.length === 0 ? (
            <p className="text-sm text-gray-600">No cases awaiting mediation.</p>
          ) : (
            <div className="space-y-3">
              {hrQueue.map((c) => (
                <div key={c.id} className="bg-white rounded-lg p-3 border border-purple-100">
                      <p className="font-medium text-sm">{caseTitle(c)}</p>
                      {linkedLabel(c)}
                  <p className="text-xs text-gray-600 mt-1">{c.description}</p>
                  {linkedLabel(c)}
                  <textarea
                    className="input-field w-full mt-2 text-sm"
                    rows={2}
                    placeholder="HR mediation notes (required)"
                    value={hrNotes[c.id] || ''}
                    onChange={(e) => setHrNotes({ ...hrNotes, [c.id]: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded"
                      onClick={async () => {
                        if (!hrNotes[c.id]?.trim()) return;
                        await lawsuitsApi.hrReview(c.id, { outcome: 'resolved_no_damages', hr_notes: hrNotes[c.id] });
                        setSuccess('Case resolved without damages');
                        load();
                      }}
                    >
                      Resolve (no damages)
                    </button>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded"
                      onClick={async () => {
                        const amt = parseFloat(settlementAmount[c.id] || '0');
                        if (!hrNotes[c.id]?.trim() || !amt) return;
                        await lawsuitsApi.hrReview(c.id, {
                          outcome: 'settlement_recommended',
                          hr_notes: hrNotes[c.id],
                          hr_recommended_amount: amt,
                          plaintiff_consents_settlement: true,
                          defendant_consents_settlement: true,
                        });
                        setSuccess('Settlement sent to teacher');
                        load();
                      }}
                    >
                      Settle → teacher
                    </button>
                    <input
                      type="number"
                      placeholder="Settlement R"
                      className="input-field text-xs w-24 py-1"
                      value={settlementAmount[c.id] || ''}
                      onChange={(e) => setSettlementAmount({ ...settlementAmount, [c.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded"
                      onClick={async () => {
                        if (!hrNotes[c.id]?.trim()) return;
                        await lawsuitsApi.hrReview(c.id, { outcome: 'escalated', hr_notes: hrNotes[c.id] });
                        setSuccess('Escalated to lawyers & jury');
                        load();
                      }}
                    >
                      Escalate to court
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLawyer && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-600" />
            Lawsuit counsel
          </h3>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Plaintiff clients (accept + R10,000 escrow)</p>
                {plaintiffCases.length === 0 ? (
                  <p className="text-xs text-gray-600">None</p>
                ) : (
                  plaintiffCases.map((c) => (
                    <div key={c.id} className="bg-white p-3 rounded border mb-2 text-sm">
                      <p className="font-medium">{caseTitle(c)}</p>
                      {linkedLabel(c)}
                      {c.plaintiff_lawyer_acceptance === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            className="text-xs px-2 py-1 bg-emerald-600 text-white rounded"
                            onClick={async () => {
                              await lawsuitsApi.lawyerAccept(c.id);
                              setSuccess('Accepted — escrow held');
                              load();
                            }}
                          >
                            Accept case
                          </button>
                          <button
                            type="button"
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded"
                            onClick={async () => {
                              await lawsuitsApi.lawyerDecline(c.id);
                              load();
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {c.plaintiff_lawyer_acceptance === 'accepted' && !c.plaintiff_lawyer_reviewed_at && (
                        <>
                          <select
                            className="input-field text-xs mt-2"
                            value={lawyerOpinion[c.id] || ''}
                            onChange={(e) => setLawyerOpinion({ ...lawyerOpinion, [c.id]: e.target.value })}
                          >
                            <option value="">Opinion…</option>
                            <option value="recommend_approve">Recommend approve</option>
                            <option value="recommend_partial">Recommend partial</option>
                            <option value="recommend_dismiss">Recommend dismiss</option>
                          </select>
                          <textarea
                            className="input-field w-full mt-1 text-xs"
                            rows={2}
                            placeholder="Legal notes"
                            value={lawyerNotes[c.id] || ''}
                            onChange={(e) => setLawyerNotes({ ...lawyerNotes, [c.id]: e.target.value })}
                          />
                          <button
                            type="button"
                            className="text-xs px-2 py-1 mt-1 bg-indigo-600 text-white rounded"
                            onClick={async () => {
                              if (!lawyerOpinion[c.id] || !lawyerNotes[c.id]?.trim()) return;
                              await lawsuitsApi.lawyerOpinion(c.id, {
                                opinion: lawyerOpinion[c.id],
                                legal_notes: lawyerNotes[c.id],
                              });
                              setSuccess('Opinion submitted');
                              load();
                            }}
                          >
                            Submit opinion
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Defendant clients (+R5,000 + 15 XP on submit)</p>
                {defendantCases.length === 0 ? (
                  <p className="text-xs text-gray-600">None</p>
                ) : (
                  defendantCases.map((c) => (
                    <div key={c.id} className="bg-white p-3 rounded border mb-2 text-sm">
                      <p className="font-medium">{caseTitle(c)}</p>
                      {linkedLabel(c)}
                      {!c.defendant_lawyer_reviewed_at && (
                        <>
                          <select
                            className="input-field text-xs mt-2"
                            value={lawyerOpinion[c.id] || ''}
                            onChange={(e) => setLawyerOpinion({ ...lawyerOpinion, [c.id]: e.target.value })}
                          >
                            <option value="">Defense opinion…</option>
                            <option value="recommend_dismiss">Recommend dismiss</option>
                            <option value="recommend_partial">Recommend partial</option>
                            <option value="recommend_approve">Recommend for plaintiff</option>
                          </select>
                          <textarea
                            className="input-field w-full mt-1 text-xs"
                            rows={2}
                            placeholder="Defense legal notes"
                            value={lawyerNotes[c.id] || ''}
                            onChange={(e) => setLawyerNotes({ ...lawyerNotes, [c.id]: e.target.value })}
                          />
                          <button
                            type="button"
                            className="text-xs px-2 py-1 mt-1 bg-indigo-600 text-white rounded"
                            onClick={async () => {
                              if (!lawyerOpinion[c.id] || !lawyerNotes[c.id]?.trim()) return;
                              await lawsuitsApi.lawyerOpinion(c.id, {
                                opinion: lawyerOpinion[c.id],
                                legal_notes: lawyerNotes[c.id],
                              });
                              setSuccess('Defense opinion submitted');
                              load();
                            }}
                          >
                            Submit defense
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LawsuitJobPanels;
