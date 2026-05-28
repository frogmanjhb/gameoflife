import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { attendanceApi } from '../services/api';
import { AttendanceRegisterStatus } from '../types';

interface AttendanceRegisterPanelProps {
  jobName: string;
}

const AttendanceRegisterPanel: React.FC<AttendanceRegisterPanelProps> = ({ jobName }) => {
  const isNurse = jobName.toLowerCase().trim().includes('nurse');
  const isDoctor = jobName.toLowerCase().trim().includes('doctor');
  const isHealthStaff = isNurse || isDoctor;

  const [status, setStatus] = useState<AttendanceRegisterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<number, 'present' | 'absent'>>({});

  const fetchStatus = useCallback(async () => {
    if (!isHealthStaff) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getRegisterStatus();
      setStatus(res.data);
      setError(null);

      const initial: Record<number, 'present' | 'absent'> = {};
      for (const student of res.data.students) {
        const existing = res.data.today_entries?.find((e) => e.student_user_id === student.id);
        initial[student.id] = existing?.status ?? 'present';
      }
      setAttendance(initial);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not load attendance register'
      );
    } finally {
      setLoading(false);
    }
  }, [isHealthStaff]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const allMarked = useMemo(() => {
    if (!status?.students.length) return false;
    return status.students.every((s) => attendance[s.id] === 'present' || attendance[s.id] === 'absent');
  }, [status, attendance]);

  const handleSubmit = async () => {
    if (!status?.can_submit || !allMarked) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const entries = status.students.map((s) => ({
        student_user_id: s.id,
        status: attendance[s.id],
      }));
      const res = await attendanceApi.submitRegister(entries);
      const xpMsg = res.data.new_level
        ? ` Level up! You are now level ${res.data.new_level}.`
        : '';
      setSuccess(
        `Register submitted. ${res.data.absent_count} absent. +${res.data.experience_points} XP.${xpMsg}`
      );
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not submit register'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHealthStaff) return null;

  const showPanel =
    (isNurse && status?.submitter_role === 'nurse') ||
    (isDoctor && status?.submitter_role === 'doctor') ||
    status?.already_submitted_today;

  if (!showPanel && !loading) return null;

  return (
    <div className="card mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-teal-100 p-2 rounded-lg">
          <ClipboardList className="h-6 w-6 text-teal-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Daily Register Check</h3>
          <p className="text-sm text-gray-600 mt-1">
            Mark every student as present or absent. Submit once per day for {status?.submit_xp ?? 20} XP.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading register…
        </div>
      )}

      {!loading && status && (
        <>
          {status.reason && !status.can_submit && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 mb-3">{status.reason}</p>
          )}

          {status.already_submitted_today && (
            <p className="text-sm text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2 mb-3">
              Today&apos;s register has been submitted.
            </p>
          )}

          {status.students.length > 0 && (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg mb-4">
              {status.students.map((student) => (
                <li
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-900">{student.display_name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={attendance[student.id] === 'present'}
                        onChange={() =>
                          setAttendance((prev) => ({ ...prev, [student.id]: 'present' }))
                        }
                        disabled={!status.can_submit}
                        className="text-teal-600"
                      />
                      Present
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`attendance-${student.id}`}
                        checked={attendance[student.id] === 'absent'}
                        onChange={() =>
                          setAttendance((prev) => ({ ...prev, [student.id]: 'absent' }))
                        }
                        disabled={!status.can_submit}
                        className="text-teal-600"
                      />
                      Absent
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {status.can_submit && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !allMarked}
              className="btn-primary disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Register'}
            </button>
          )}

          {success && (
            <p className="text-sm text-emerald-800 bg-emerald-100 rounded-lg px-3 py-2 mt-3">{success}</p>
          )}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceRegisterPanel;
