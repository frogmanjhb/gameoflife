import React, { useState } from 'react';
import { LandParcel } from '../../types';
import { landApi } from '../../services/api';
import { BIOME_CONFIG, BIOME_ICONS, formatCurrency } from './BiomeConfig';
import { isCommunityAuctionPlot, HIDDEN_AUCTION_PRICE_LABEL } from './communityPlot';
import { UserPlus, UserMinus, Loader2, X } from 'lucide-react';

export interface ClassStudentOption {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
}

interface TeacherParcelAssignPanelProps {
  parcel: LandParcel;
  students: ClassStudentOption[];
  onUpdated: () => void;
  onClose: () => void;
}

const studentLabel = (s: ClassStudentOption) =>
  s.first_name && s.last_name ? `${s.first_name} ${s.last_name} (@${s.username})` : `@${s.username}`;

const TeacherParcelAssignPanel: React.FC<TeacherParcelAssignPanelProps> = ({
  parcel,
  students,
  onUpdated,
  onClose,
}) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ownerName =
    parcel.owner_first_name && parcel.owner_last_name
      ? `${parcel.owner_first_name} ${parcel.owner_last_name}`
      : parcel.owner_username;

  const handleAssign = async () => {
    if (!studentId) {
      setError('Select a student');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await landApi.assignParcelOwner(parcel.id, parseInt(studentId, 10));
      setSuccess('Plot assigned successfully');
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign plot');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!parcel.owner_id) return;
    if (!window.confirm(`Remove ${parcel.grid_code} from ${ownerName || 'this student'}?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await landApi.removeParcelOwner(parcel.id);
      setSuccess('Plot ownership removed');
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove plot');
    } finally {
      setLoading(false);
    }
  };

  const isAuction = isCommunityAuctionPlot(parcel);
  const priceLabel = isAuction && !parcel.owner_id ? HIDDEN_AUCTION_PRICE_LABEL : formatCurrency(Number(parcel.value));

  return (
    <div className="bg-white border border-emerald-200 rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: BIOME_CONFIG[parcel.biome_type].lightColor }}
          >
            {BIOME_ICONS[parcel.biome_type]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Assign plot {parcel.grid_code}</h3>
            <p className="text-sm text-gray-600">
              {parcel.biome_type} · {priceLabel}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Current owner:{' '}
              <span className="font-medium text-gray-800">
                {parcel.owner_id ? ownerName || parcel.owner_username : 'None (available)'}
              </span>
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to student</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          disabled={loading || students.length === 0}
        >
          <option value="">Select a student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {studentLabel(s)}
            </option>
          ))}
        </select>
        {students.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">No students found in this town class.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAssign}
          disabled={loading || !studentId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Assign plot
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading || !parcel.owner_id}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
          Remove from student
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Assigning does not charge the student. Pending purchase requests for this plot are cancelled automatically.
      </p>
    </div>
  );
};

export default TeacherParcelAssignPanel;
