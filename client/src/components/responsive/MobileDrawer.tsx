import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** Slide-down / overlay navigation drawer for mobile with large touch targets. */
const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute top-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          {title ? <span className="font-semibold text-gray-900">{title}</span> : <span />}
          <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
        </div>
        <div className="px-4 py-3 space-y-1">{children}</div>
      </div>
    </div>
  );
};

export default MobileDrawer;
