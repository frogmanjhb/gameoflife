import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Pin, Trash2, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';
import { noticeBoardApi } from '../services/api';
import { NoticeBoardManageStatus } from '../types';
import { usePlugins } from '../contexts/PluginContext';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

const NoticeBoardPanel: React.FC = () => {
  const { refreshPlugins } = usePlugins();
  const [status, setStatus] = useState<NoticeBoardManageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await noticeBoardApi.getManage();
      setStatus(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to load notice board';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async () => {
    if (!status) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const res = await noticeBoardApi.toggle(!status.enabled);
      setStatus(res.data);
      await refreshPlugins();
      setSuccess(res.data.enabled ? 'Notice Board is now live for your town.' : 'Notice Board hidden from students.');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to update notice board'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 2 MB.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const image_data = await readFileAsDataUrl(file);
      const res = await noticeBoardApi.uploadPoster({ image_data, title: file.name.replace(/\.[^.]+$/, '') });
      setStatus(res.data);
      setSuccess('Poster uploaded to the Notice Board.');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to upload poster'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this poster from the Notice Board?')) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const res = await noticeBoardApi.deletePoster(id);
      setStatus(res.data);
      setSuccess('Poster removed.');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to remove poster'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollect = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const res = await noticeBoardApi.collectWeekly();
      setStatus(res.data);
      const parts = [];
      if (res.data.collected_earnings) {
        parts.push(`R${res.data.collected_earnings.toLocaleString()}`);
      }
      if (res.data.collected_experience_points) {
        parts.push(`${res.data.collected_experience_points} XP`);
      }
      if (res.data.new_level) {
        parts.push(`Level ${res.data.new_level}!`);
      }
      setSuccess(parts.length ? `Collected ${parts.join(' and ')}.` : 'Weekly earnings collected.');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to collect weekly earnings'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-6 border-t border-gray-200 flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-gray-200">
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-lg p-6 border border-rose-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Pin className="h-5 w-5 text-rose-600" />
              Town Notice Board
            </h3>
            <p className="text-sm text-gray-600">
              Upload posters and advertising for your town. Each poster earns R500 and 5 XP per week while live.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={actionLoading || !status}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              status?.enabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {status?.enabled ? (
              <>
                <ToggleRight className="h-5 w-5" />
                <span>Board Live</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-5 w-5" />
                <span>Board Off</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
        )}

        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
            <div>
              <div className="text-gray-500">Posters</div>
              <div className="text-lg font-bold text-gray-900">{status.poster_count}</div>
            </div>
            <div>
              <div className="text-gray-500">Weekly per poster</div>
              <div className="text-lg font-bold text-gray-900">
                R{status.weekly_earnings_per_poster} + {status.weekly_xp_per_poster} XP
              </div>
            </div>
            <div>
              <div className="text-gray-500">Potential weekly</div>
              <div className="text-lg font-bold text-gray-900">
                R{status.potential_weekly_earnings.toLocaleString()} + {status.potential_weekly_xp} XP
              </div>
            </div>
            <div>
              <div className="text-gray-500">Collect</div>
              <button
                onClick={handleCollect}
                disabled={actionLoading || !status.can_collect_weekly}
                className="mt-1 flex items-center gap-1 text-sm font-semibold text-rose-700 hover:text-rose-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <Wallet className="h-4 w-4" />
                {status.can_collect_weekly ? 'Collect weekly earnings' : 'Collected this week'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={actionLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            Upload Poster
          </button>
        </div>

        {status && status.posters.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {status.posters.map((poster) => (
              <div key={poster.id} className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden">
                {poster.image_data ? (
                  <img
                    src={poster.image_data}
                    alt={poster.title || 'Poster'}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center text-xs text-gray-400 p-2 text-center">
                    {poster.title || `Poster #${poster.id}`}
                  </div>
                )}
                <button
                  onClick={() => handleDelete(poster.id)}
                  disabled={actionLoading}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Remove poster"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="p-2 text-xs text-gray-600 truncate">
                  {poster.title || 'Untitled'}
                </div>
              </div>
            ))}
          </div>
        )}

        {status && status.posters.length === 0 && (
          <p className="text-sm text-gray-500">No posters yet. Upload your first design to get started.</p>
        )}
      </div>
    </div>
  );
};

export default NoticeBoardPanel;
