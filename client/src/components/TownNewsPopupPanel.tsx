import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Megaphone, Send, Trash2 } from 'lucide-react';
import { townNewsApi } from '../services/api';
import { ContentSubmissionStatus, TownNewsPopup } from '../types';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function submissionStatusLabel(status?: ContentSubmissionStatus) {
  if (status === 'approved') return 'Approved';
  if (status === 'denied') return 'Denied';
  return 'Pending approval';
}

function submissionStatusClass(status?: ContentSubmissionStatus) {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'denied') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

const TownNewsPopupPanel: React.FC = () => {
  const [popups, setPopups] = useState<TownNewsPopup[]>([]);
  const [adCost, setAdCost] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await townNewsApi.getPopupsManage();
      setPopups(res.data.popups);
      setAdCost(res.data.popup_ad_cost);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load login pop-up ads'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const dataUrl = await readFileAsDataUrl(file);
      setImageData(dataUrl);
      setImagePreview(dataUrl);
      setError(null);
    } catch {
      setError('Could not read the image file.');
    }
  };

  const clearImage = () => {
    setImageData(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setHeadline('');
    setBody('');
    clearImage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !body.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const res = await townNewsApi.submitPopup({
        headline: headline.trim(),
        body: body.trim(),
        image_data: imageData || undefined,
      });
      setSuccess(res.data.message || 'Pop-up submitted for teacher approval.');
      resetForm();
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to submit pop-up'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (popup: TownNewsPopup) => {
    if (!window.confirm(`Remove "${popup.headline}" from your pop-up submissions?`)) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await townNewsApi.deletePopup(popup.id);
      setSuccess('Pop-up removed.');
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to remove pop-up'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading login pop-up ads...</span>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-700" />
            Login Pop-up Advertising
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Create a pop-up that appears on every student&apos;s screen when they log in. Your teacher must approve
            before it goes live. Once approved, <strong>R{adCost.toLocaleString()}</strong> is charged from your bank
            account.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              className="input-field w-full"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Grand opening this Friday!"
              maxLength={200}
              disabled={actionLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="input-field w-full"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your advertisement..."
              maxLength={8000}
              disabled={actionLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 bg-white text-amber-800 text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                Add photo
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={actionLoading}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Remove photo
                </button>
              )}
            </div>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Pop-up preview"
                className="mt-3 max-h-48 rounded-lg border border-gray-200 object-cover"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={actionLoading || !headline.trim() || !body.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit pop-up for approval (R{adCost.toLocaleString()})
          </button>
        </form>

        {!popups.length ? (
          <p className="text-sm text-gray-500">You have not submitted any login pop-ups yet.</p>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Your pop-up submissions</h4>
            {popups.map((popup) => (
              <div
                key={popup.id}
                className="flex items-start justify-between gap-3 bg-white rounded-lg border border-amber-100 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{popup.headline}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${submissionStatusClass(popup.status)}`}
                    >
                      {submissionStatusLabel(popup.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{popup.body}</p>
                  {popup.denial_reason && (
                    <p className="text-xs text-red-700 mt-1">Teacher note: {popup.denial_reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(popup.created_at).toLocaleString()}
                    {popup.image_data ? ' · includes photo' : ''}
                    {popup.payment_charged ? ` · R${adCost.toLocaleString()} charged` : ''}
                  </p>
                </div>
                {popup.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(popup)}
                    disabled={actionLoading}
                    className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Remove pop-up"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TownNewsPopupPanel;
