import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { townNewsApi } from '../services/api';
import { TownNewsPopup } from '../types';

const StudentLoginPopupModal: React.FC = () => {
  const [popup, setPopup] = useState<TownNewsPopup | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const fetchActivePopup = useCallback(async () => {
    try {
      const res = await townNewsApi.getActivePopup();
      if (res.data.popup) {
        setPopup(res.data.popup);
        setVisible(true);
      } else {
        setPopup(null);
        setVisible(false);
      }
    } catch {
      setPopup(null);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    fetchActivePopup();
  }, [fetchActivePopup]);

  const handleDismiss = async () => {
    if (!popup || dismissing) return;
    setDismissing(true);
    try {
      await townNewsApi.dismissPopup(popup.id);
    } catch {
      // Still hide locally so students are not blocked
    } finally {
      setVisible(false);
      setPopup(null);
      setDismissing(false);
    }
  };

  if (!visible || !popup) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={popup.headline}
      >
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-900/80 text-white hover:bg-gray-900 transition-colors disabled:opacity-50"
          aria-label="Close pop-up"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 pr-14">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-100">Sponsored</p>
          <h2 className="text-lg font-bold text-white leading-tight mt-0.5">{popup.headline}</h2>
        </div>

        <div className="p-5 space-y-4">
          {popup.image_data && (
            <img
              src={popup.image_data}
              alt=""
              className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
            />
          )}
          <p className="text-gray-700 whitespace-pre-wrap">{popup.body}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPopupModal;
