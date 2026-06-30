import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Scale, Plus, AlertTriangle, Gavel, FileText, ScrollText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import api, { lawsuitsApi, LinkableAction, StudentLawsuit } from '../../services/api';
import LawsuitProceedingsFlowMap from '../LawsuitProceedingsFlowMap';
import { ResponsivePage, ResponsivePluginHero, LoadingState, ResponsiveTabNav } from '../responsive';

const PROCESS_COST = 10000;
const CLAIM_CAP = 5000;

const COURT_RULES = [
  {
    title: 'What Court is for',
    items: [
      'Court handles in-town civil disputes — unfair fines, broken deals, repeated targeting in the simulation.',
      'This is not a replacement for school anti-bullying policy. Real-world harm goes to a teacher first.',
      'Money never moves without teacher final approval.',
    ],
  },
  {
    title: 'Filing a case',
    items: [
      `You must have at least R${PROCESS_COST.toLocaleString()} available to file. No debit until your lawyer accepts.`,
      `Damages claims are capped at R${CLAIM_CAP.toLocaleString()}.`,
      'Cite a specific town rule from Town Rules and describe what happened with dates or linked actions where possible.',
      'Only one active case per plaintiff at a time.',
      'You may withdraw during HR mediation only (before lawyer accept).',
    ],
  },
  {
    title: 'Evidence standard',
    items: [
      'Decisions are based on written facts — specific in-game actions, not rumours or insults.',
      'Link prior police fines, cyber attacks, land sales, or other town actions when they support your claim.',
      'Lawyer opinions and jury verdicts are advisory; the teacher decides the final outcome.',
    ],
  },
  {
    title: 'Court process',
    items: [
      '1. Plaintiff files → 2. HR mediation (or teacher if no HR Director) → 3. Lawyers (plaintiff accept + both opinions) → 4. Jury (if escalated) → 5. Teacher approval in Bank.',
      'If your town has no HR Director, the teacher mediates the HR step in Court.',
      'When only one lawyer serves the town, they may represent both plaintiff and defendant.',
      'HR may resolve without damages, settle by agreement (skips jury), or escalate to full court.',
      'Plaintiff lawyer accept holds R10,000 escrow; paid to lawyer on teacher close (+20 XP).',
      'Defense lawyer earns R5,000 from town treasury + 15 XP when submitting their opinion.',
      'Jurors vote guilty or not guilty (+10 XP); majority advises the teacher.',
    ],
  },
  {
    title: 'Respect and fair treatment',
    items: [
      'No targeting the same student repeatedly in transfers, fines, cyber attacks, or public posts.',
      'Students in jobs must not use their role to punish or pressure someone for personal reasons.',
      'Do not file cases to embarrass or retaliate against someone who reported you.',
      'Serious or repeated real-world harm — teacher may pause or deny the case.',
    ],
  },
  {
    title: 'Outcomes',
    items: [
      'Teacher may approve full, partial, or no damages.',
      'A guilty jury verdict does not automatically transfer money.',
      'Frivolous or malicious cases may be denied with no damages awarded.',
    ],
  },
];

const displayName = (username: string, first?: string | null, last?: string | null) => {
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || username;
};

const CourtPlugin: React.FC = () => {
  const { user, account } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();

  const courtPlugin = plugins.find((p) => p.route_path === '/court');
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [tab, setTab] = useState<'current' | 'past' | 'file' | 'jury' | 'rules'>('current');
  const [cases, setCases] = useState<StudentLawsuit[]>([]);
  const [juryCases, setJuryCases] = useState<StudentLawsuit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<StudentLawsuit | null>(null);
  const [townClassFilter, setTownClassFilter] = useState<string>('all');

  const [classmates, setClassmates] = useState<{ username: string; first_name?: string; last_name?: string }[]>([]);
  const balance = account?.balance != null ? Number(account.balance) : null;
  const [fileForm, setFileForm] = useState({
    defendant_username: '',
    claim_amount: '',
    description: '',
    rule_reference: '',
    linked_action_type: '',
    linked_action_id: '',
    confirmCost: false,
  });
  const [linkableActions, setLinkableActions] = useState<LinkableAction[]>([]);
  const [defendantResponse, setDefendantResponse] = useState('');
  const [teacherHrNotes, setTeacherHrNotes] = useState('');
  const [teacherSettlementAmount, setTeacherSettlementAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (isTeacher) {
        const tc = townClassFilter === 'all' ? undefined : townClassFilter;
        const res = await lawsuitsApi.getSchoolCases(tab === 'past' ? 'past' : 'current', tc);
        setCases(res.data);
      } else if (isStudent) {
        const res = await lawsuitsApi.getMyCases(tab === 'past' ? 'past' : 'current');
        setCases(res.data);
        const juryRes = await lawsuitsApi.getJuryDuty();
        setJuryCases(juryRes.data);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [isTeacher, isStudent, tab, townClassFilter]);

  useEffect(() => {
    if (courtPlugin?.enabled) fetchCases();
  }, [courtPlugin?.enabled, fetchCases]);

  useEffect(() => {
    if (isStudent && tab === 'file') {
      api.get('/students/classmates').then((r) => setClassmates(r.data || [])).catch(() => {});
    }
  }, [isStudent, tab]);

  useEffect(() => {
    if (fileForm.defendant_username) {
      lawsuitsApi
        .getLinkableActions(fileForm.defendant_username)
        .then((r) => setLinkableActions(r.data.actions))
        .catch(() => setLinkableActions([]));
    } else {
      setLinkableActions([]);
    }
  }, [fileForm.defendant_username]);

  const openCaseDetail = async (c: StudentLawsuit) => {
    try {
      const res = await lawsuitsApi.getCase(c.id);
      setSelectedCase(res.data);
      setDefendantResponse(res.data.defendant_response || '');
      setTeacherHrNotes('');
      setTeacherSettlementAmount('');
    } catch {
      setSelectedCase(c);
    }
  };

  const handleFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileForm.confirmCost) {
      setError('You must confirm the R10,000 process cost warning');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await lawsuitsApi.file({
        defendant_username: fileForm.defendant_username,
        claim_amount: parseFloat(fileForm.claim_amount),
        description: fileForm.description,
        rule_reference: fileForm.rule_reference,
        ...(fileForm.linked_action_type && fileForm.linked_action_id
          ? {
              linked_action_type: fileForm.linked_action_type,
              linked_action_id: parseInt(fileForm.linked_action_id, 10),
            }
          : {}),
      });
      setSuccess('Lawsuit filed — awaiting mediation');
      setFileForm({
        defendant_username: '',
        claim_amount: '',
        description: '',
        rule_reference: '',
        linked_action_type: '',
        linked_action_id: '',
        confirmCost: false,
      });
      setTab('current');
      fetchCases();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to file lawsuit');
    } finally {
      setSubmitting(false);
    }
  };

  const myRole = useMemo(() => {
    if (!selectedCase || !user) return null;
    if (selectedCase.plaintiff_user_id === user.id) return 'plaintiff';
    if (selectedCase.defendant_user_id === user.id) return 'defendant';
    return 'viewer';
  }, [selectedCase, user]);

  if (pluginsLoading) {
    return <LoadingState />;
  }

  if (!courtPlugin?.enabled) {
    return <Navigate to="/" replace />;
  }

  const courtTabs = [
    { id: 'current', label: 'Current cases' },
    { id: 'past', label: 'Past cases' },
    { id: 'rules', label: 'Court rules', icon: ScrollText },
    ...(isStudent
      ? [
          { id: 'file', label: 'File a case', icon: Plus },
          ...(juryCases.length > 0
            ? [{ id: 'jury', label: `Jury duty (${juryCases.length})`, icon: Gavel }]
            : []),
        ]
      : []),
  ];

  return (
    <ResponsivePage className="max-w-4xl mx-auto">
      <ResponsivePluginHero
        icon={Scale}
        title="Court"
        subtitle={isTeacher ? 'Browse town lawsuits and proceedings' : 'File suits, respond, and serve jury duty'}
        gradientClass="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <ResponsiveTabNav
          tabs={courtTabs}
          activeTab={tab}
          onTabChange={(id) => {
            setTab(id as typeof tab);
            setSelectedCase(null);
          }}
          className="flex-1 border-0"
        />
        {isTeacher && (
          <select
            value={townClassFilter}
            onChange={(e) => setTownClassFilter(e.target.value)}
            className="input-field text-sm py-2 shrink-0"
          >
            <option value="all">All classes</option>
            <option value="6A">6A</option>
            <option value="6B">6B</option>
            <option value="6C">6C</option>
          </select>
        )}
      </div>

      {tab === 'rules' && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Court standing orders</h2>
            <p className="text-sm text-gray-600 mt-1">
              Read these before filing or serving on a jury. Citable town conduct rules live in{' '}
              <Link to="/town-rules" className="text-indigo-600 hover:underline">
                Town Rules
              </Link>
              .
            </p>
          </div>
          {COURT_RULES.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'file' && isStudent && (
        <form onSubmit={handleFile} className="card space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Process cost: R{PROCESS_COST.toLocaleString()}</p>
              <p className="mt-1">
                If your lawyer accepts the case, R{PROCESS_COST.toLocaleString()} will be held from your account. You
                must have at least R{PROCESS_COST.toLocaleString()} available to file.
              </p>
              {balance != null && (
                <p className="mt-1 font-medium">Your balance: R{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Defendant</label>
            <select
              required
              className="input-field w-full"
              value={fileForm.defendant_username}
              onChange={(e) => setFileForm({ ...fileForm, defendant_username: e.target.value })}
            >
              <option value="">Select classmate…</option>
              {classmates.map((c) => (
                <option key={c.username} value={c.username}>
                  {displayName(c.username, c.first_name, c.last_name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Claim amount (max R{CLAIM_CAP})</label>
            <input
              type="number"
              required
              min={1}
              max={CLAIM_CAP}
              className="input-field w-full"
              value={fileForm.claim_amount}
              onChange={(e) => setFileForm({ ...fileForm, claim_amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule violated</label>
            <input
              required
              className="input-field w-full"
              placeholder="Which town rule was broken?"
              value={fileForm.rule_reference}
              onChange={(e) => setFileForm({ ...fileForm, rule_reference: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description of incident</label>
            <textarea
              required
              rows={4}
              className="input-field w-full"
              value={fileForm.description}
              onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
            />
          </div>

          {linkableActions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link prior action (optional)</label>
              <select
                className="input-field w-full"
                value={fileForm.linked_action_id ? `${fileForm.linked_action_type}:${fileForm.linked_action_id}` : ''}
                onChange={(e) => {
                  if (!e.target.value) {
                    setFileForm({ ...fileForm, linked_action_type: '', linked_action_id: '' });
                    return;
                  }
                  const [type, id] = e.target.value.split(':');
                  setFileForm({ ...fileForm, linked_action_type: type, linked_action_id: id });
                }}
              >
                <option value="">None</option>
                {linkableActions.map((a) => (
                  <option key={`${a.type}-${a.id}`} value={`${a.type}:${a.id}`}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={fileForm.confirmCost}
              onChange={(e) => setFileForm({ ...fileForm, confirmCost: e.target.checked })}
              className="mt-1"
            />
            <span>I understand this process may cost R{PROCESS_COST.toLocaleString()} if my lawyer accepts.</span>
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
            {submitting ? 'Filing…' : 'File lawsuit'}
          </button>
        </form>
      )}

      {tab === 'jury' && isStudent && (
        <div className="space-y-4">
          {juryCases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active jury duty</p>
          ) : (
            juryCases.map((c) => (
              <div key={c.id} className="card">
                <p className="font-medium">
                  Case #{c.id}: {displayName(c.plaintiff_username, c.plaintiff_first_name, c.plaintiff_last_name)} vs{' '}
                  {displayName(c.defendant_username, c.defendant_first_name, c.defendant_last_name)}
                </p>
                <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                <p className="text-xs text-gray-500 mt-1">Rule cited: {c.rule_reference}</p>
                {c.defendant_response && (
                  <p className="text-xs text-gray-600 mt-1">Defendant: {c.defendant_response}</p>
                )}
                {c.hr_notes && <p className="text-xs text-gray-600 mt-1">HR notes: {c.hr_notes}</p>}
                {c.plaintiff_lawyer_notes && (
                  <p className="text-xs text-gray-600 mt-1">Plaintiff counsel: {c.plaintiff_lawyer_notes}</p>
                )}
                {c.defendant_lawyer_notes && (
                  <p className="text-xs text-gray-600 mt-1">Defense counsel: {c.defendant_lawyer_notes}</p>
                )}
                {c.linked_action_type && (
                  <p className="text-xs text-indigo-700 mt-1">
                    Linked: {c.linked_action_type} #{c.linked_action_id}
                  </p>
                )}
                {c.my_vote ? (
                  <p className="text-sm text-emerald-700 mt-2">You voted: {c.my_vote}</p>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      className="btn-primary bg-red-600 hover:bg-red-700"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          await lawsuitsApi.juryVote(c.id, 'guilty');
                          setSuccess('Vote recorded: guilty');
                          fetchCases();
                        } catch (err: unknown) {
                          const e = err as { response?: { data?: { error?: string } } };
                          setError(e.response?.data?.error || 'Failed to vote');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Guilty
                    </button>
                    <button
                      type="button"
                      className="btn-primary bg-gray-600 hover:bg-gray-700"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          await lawsuitsApi.juryVote(c.id, 'not_guilty');
                          setSuccess('Vote recorded: not guilty');
                          fetchCases();
                        } catch (err: unknown) {
                          const e = err as { response?: { data?: { error?: string } } };
                          setError(e.response?.data?.error || 'Failed to vote');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Not guilty
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {(tab === 'current' || tab === 'past') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {loading ? (
              <LoadingState className="py-8" />
            ) : cases.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No {tab} cases</p>
              </div>
            ) : (
              cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openCaseDetail(c)}
                  className={`w-full text-left card hover:border-indigo-300 transition-colors ${
                    selectedCase?.id === c.id ? 'border-indigo-500 ring-1 ring-indigo-200' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{c.id}{' '}
                        {displayName(c.plaintiff_username, c.plaintiff_first_name, c.plaintiff_last_name)} vs{' '}
                        {displayName(c.defendant_username, c.defendant_first_name, c.defendant_last_name)}
                      </p>
                      <p className="text-sm text-gray-600">Claim R{Number(c.claim_amount).toFixed(2)} · {c.town_class}</p>
                      {isTeacher && c.teacher_hr_required && (
                        <p className="text-xs text-amber-700 mt-1">Awaiting your HR mediation</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="card min-h-[200px]">
            {selectedCase ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Proceedings — Case #{selectedCase.id}</h3>
                {selectedCase.linked_action_type && (
                  <p className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-block">
                    Linked: {selectedCase.linked_action_type} #{selectedCase.linked_action_id}
                  </p>
                )}
                {selectedCase.proceedings_timeline && (
                  <LawsuitProceedingsFlowMap
                    timeline={selectedCase.proceedings_timeline}
                    mode={tab === 'past' ? 'past' : 'current'}
                  />
                )}

                {isTeacher && selectedCase.teacher_hr_required && tab === 'current' && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      HR mediation required — no HR Director in {selectedCase.town_class}
                    </p>
                    {selectedCase.defendant_response && (
                      <p className="text-xs text-gray-600">Defendant response: {selectedCase.defendant_response}</p>
                    )}
                    <textarea
                      className="input-field w-full text-sm"
                      rows={3}
                      placeholder="Mediation notes (required)"
                      value={teacherHrNotes}
                      onChange={(e) => setTeacherHrNotes(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded"
                        disabled={submitting || !teacherHrNotes.trim()}
                        onClick={async () => {
                          setSubmitting(true);
                          setError(null);
                          try {
                            await lawsuitsApi.hrReview(selectedCase.id, {
                              outcome: 'resolved_no_damages',
                              hr_notes: teacherHrNotes.trim(),
                            });
                            setSuccess('Case resolved without damages');
                            openCaseDetail(selectedCase);
                            fetchCases();
                          } catch (err: unknown) {
                            const e = err as { response?: { data?: { error?: string } } };
                            setError(e.response?.data?.error || 'Failed to record mediation');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Resolve (no damages)
                      </button>
                      <input
                        type="number"
                        placeholder="Settlement R"
                        className="input-field text-xs w-28 py-1"
                        value={teacherSettlementAmount}
                        onChange={(e) => setTeacherSettlementAmount(e.target.value)}
                      />
                      <button
                        type="button"
                        className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded"
                        disabled={submitting || !teacherHrNotes.trim() || !teacherSettlementAmount}
                        onClick={async () => {
                          setSubmitting(true);
                          setError(null);
                          try {
                            await lawsuitsApi.hrReview(selectedCase.id, {
                              outcome: 'settlement_recommended',
                              hr_notes: teacherHrNotes.trim(),
                              hr_recommended_amount: parseFloat(teacherSettlementAmount),
                              plaintiff_consents_settlement: true,
                              defendant_consents_settlement: true,
                            });
                            setSuccess('Settlement sent to Bank for approval');
                            openCaseDetail(selectedCase);
                            fetchCases();
                          } catch (err: unknown) {
                            const e = err as { response?: { data?: { error?: string } } };
                            setError(e.response?.data?.error || 'Failed to record settlement');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Settle → Bank
                      </button>
                      <button
                        type="button"
                        className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded"
                        disabled={submitting || !teacherHrNotes.trim()}
                        onClick={async () => {
                          setSubmitting(true);
                          setError(null);
                          try {
                            await lawsuitsApi.hrReview(selectedCase.id, {
                              outcome: 'escalated',
                              hr_notes: teacherHrNotes.trim(),
                            });
                            setSuccess('Escalated to lawyers and jury');
                            openCaseDetail(selectedCase);
                            fetchCases();
                          } catch (err: unknown) {
                            const e = err as { response?: { data?: { error?: string } } };
                            setError(e.response?.data?.error || 'Failed to escalate case');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Escalate to court
                      </button>
                    </div>
                  </div>
                )}

                {myRole === 'defendant' &&
                  selectedCase.status === 'pending_hr' &&
                  !selectedCase.defendant_response && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium mb-1">Your response</label>
                      <textarea
                        className="input-field w-full"
                        rows={3}
                        value={defendantResponse}
                        onChange={(e) => setDefendantResponse(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-primary mt-2"
                        disabled={submitting || !defendantResponse.trim()}
                        onClick={async () => {
                          setSubmitting(true);
                          try {
                            await lawsuitsApi.defendantResponse(selectedCase.id, defendantResponse.trim());
                            setSuccess('Response submitted');
                            openCaseDetail(selectedCase);
                          } catch (err: unknown) {
                            const e = err as { response?: { data?: { error?: string } } };
                            setError(e.response?.data?.error || 'Failed to submit');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Submit response
                      </button>
                    </div>
                  )}

                {myRole === 'plaintiff' && selectedCase.status === 'pending_hr' && (
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={async () => {
                      if (!window.confirm('Withdraw this case?')) return;
                      await lawsuitsApi.withdraw(selectedCase.id);
                      setSuccess('Case withdrawn');
                      setSelectedCase(null);
                      fetchCases();
                    }}
                  >
                    Withdraw case
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Select a case to view the proceedings flow map</p>
            )}
          </div>
        </div>
      )}
    </ResponsivePage>
  );
};

export default CourtPlugin;
