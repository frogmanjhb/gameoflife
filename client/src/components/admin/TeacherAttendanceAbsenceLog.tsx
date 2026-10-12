import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { AttendanceAbsenceRecord } from '../../types';

interface TeacherAttendanceAbsenceLogProps {
  townClass: string | null;
}

function sickNoteStatusLabel(status: string | null): string {
  if (!status) return '—';
  switch (status) {
    case 'awaiting_submission':
      return 'No sick note yet';
    case 'pending_review':
      return 'Pending review';
    case 'approved':
      return 'Approved';
    case 'denied':
      return 'Denied';
    default:
      return status;
  }
}

const TeacherAttendanceAbsenceLog: React.FC<TeacherAttendanceAbsenceLogProps> = ({ townClass }) => {
  const [records, setRecords] = useState<AttendanceAbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitterRole, setSubmitterRole] = useState<'doctor' | 'nurse' | 'all'>('doctor');

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await attendanceApi.getAbsenceRecords({
        town_class: townClass || undefined,
        submitter_role: submitterRole,
        limit: 100,
      });
      setRecords(res.data.records);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load attendance absence log'
      );
    } finally {
      setLoading(false);
    }
  }, [townClass, submitterRole]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl min-w-0">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Attendance absence log</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Who marked each student absent on the daily register
            {townClass ? ` (class ${townClass})` : ''}.
          </p>
        </div>
        <label className="text-sm text-gray-700 flex items-center gap-2 shrink-0">
          <span className="sr-only">Filter by submitter</span>
          <select
            className="input-field py-1.5 text-sm"
            value={submitterRole}
            onChange={(e) => setSubmitterRole(e.target.value as typeof submitterRole)}
          >
            <option value="doctor">Doctor only</option>
            <option value="nurse">Nurse only</option>
            <option value="all">Doctor and nurse</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-700 bg-red-50">{error}</div>
      ) : records.length === 0 ? (
        <div className="p-4 text-sm text-gray-600">No absence records found for this filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Marked by</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Sick note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {row.marked_at ? new Date(row.marked_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    <span className="font-medium">{row.student_display_name}</span>
                    <span className="text-gray-500 block text-xs">@{row.student_username}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    <span className="font-medium">{row.marked_by_display_name}</span>
                    <span className="text-gray-500 block text-xs">@{row.marked_by_username}</span>
                  </td>
                  <td className="px-4 py-2 capitalize text-gray-700">{row.submitter_role}</td>
                  <td className="px-4 py-2 text-gray-700">{sickNoteStatusLabel(row.sick_note_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceAbsenceLog;
