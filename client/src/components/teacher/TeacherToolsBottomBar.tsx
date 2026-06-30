import React, { useEffect, useState } from 'react';
import { X, MoreHorizontal } from 'lucide-react';
import { TabNavItem } from '../responsive/ResponsiveTabNav';

/** Shown in the bottom bar on mobile — remaining tools live under "More". */
const PRIMARY_TOOL_IDS = ['pending', 'students', 'treasury', 'jobs'] as const;

const BOTTOM_NAV_HEIGHT = 'calc(4.5rem + env(safe-area-inset-bottom, 0px))';

const SHEET_TOP_EDGE =
  'rounded-t-2xl overflow-hidden border border-gray-200 border-b-0 shadow-[0_-4px_14px_rgba(0,0,0,0.08)]';

/** Rounded top lip + grab handle for mobile tool sheets. */
const SheetTopEdge: React.FC = () => (
  <div className="flex justify-center pt-2.5 pb-2 shrink-0 bg-white border-b border-gray-100">
    <div className="w-10 h-1 rounded-full bg-gray-300/90" aria-hidden />
  </div>
);

/** Measure #app-chrome-top (logo + menu bar) for sheet positioning. */
function useAppChromeTop(): number {
  const [top, setTop] = useState(64);

  useEffect(() => {
    const el = document.getElementById('app-chrome-top');
    if (!el) return;

    const update = () => setTop(el.getBoundingClientRect().height);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return top;
}

interface TeacherToolsBottomBarProps {
  tabs: TabNavItem[];
  activeTab: string | null;
  onSelect: (id: string) => void;
}

const tabLabel = (tab: TabNavItem) => tab.mobileLabel ?? tab.label;

/** Fixed bottom nav — 4 primary tools + More menu for the rest. */
const TeacherToolsBottomBar: React.FC<TeacherToolsBottomBarProps> = ({
  tabs,
  activeTab,
  onSelect,
}) => {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const chromeTop = useAppChromeTop();

  const { primaryTabs, overflowTabs } = React.useMemo(() => {
    const primary = PRIMARY_TOOL_IDS.map((id) => tabs.find((t) => t.id === id)).filter(
      (t): t is TabNavItem => !!t
    );
    const overflow = tabs.filter((t) => !PRIMARY_TOOL_IDS.includes(t.id as (typeof PRIMARY_TOOL_IDS)[number]));
    return { primaryTabs: primary, overflowTabs: overflow };
  }, [tabs]);

  const overflowActive = overflowTabs.some((t) => t.id === activeTab);

  useEffect(() => {
    if (activeTab) setOverflowOpen(false);
  }, [activeTab]);

  return (
    <>
      {overflowOpen && (
        <>
          <button
            type="button"
            aria-label="Close tools menu"
            className="md:hidden fixed inset-0 z-40 bg-black/30"
            style={{ top: chromeTop }}
            onClick={() => setOverflowOpen(false)}
          />
          <div
            className={`md:hidden fixed left-0 right-0 z-[45] bg-white ${SHEET_TOP_EDGE} max-h-[min(70vh,420px)] flex flex-col`}
            style={{ bottom: BOTTOM_NAV_HEIGHT }}
          >
            <SheetTopEdge />
            <div className="flex-1 overflow-y-auto px-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">More tools</h3>
                <button
                  type="button"
                  onClick={() => setOverflowOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2">
                {overflowTabs.map(({ id, label, icon: Icon, badge, mobileLabel }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelect(id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left min-h-[56px] transition-colors ${
                      activeTab === id
                        ? 'border-primary-300 bg-primary-50 text-primary-800'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    {Icon && (
                      <span className="relative shrink-0">
                        <Icon className="h-5 w-5" />
                        {badge !== undefined && badge > 0 && (
                          <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="text-sm font-medium leading-tight">{mobileLabel ?? label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Teacher tools"
      >
        <div className="grid grid-cols-5 gap-0 px-1 py-1">
          {primaryTabs.map(({ id, label, icon: Icon, badge, mobileLabel }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`flex flex-col items-center justify-center px-1 py-2 rounded-lg min-h-[56px] transition-colors relative ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="relative">
                  {Icon && <Icon className="h-5 w-5" />}
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium mt-1 leading-tight text-center line-clamp-2 px-0.5">
                  {mobileLabel ?? tabLabel({ id, label, icon: Icon, badge, mobileLabel })}
                </span>
              </button>
            );
          })}
          {overflowTabs.length > 0 && (
            <button
              type="button"
              onClick={() => setOverflowOpen((o) => !o)}
              className={`flex flex-col items-center justify-center px-1 py-2 rounded-lg min-h-[56px] transition-colors ${
                overflowActive || overflowOpen
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-expanded={overflowOpen}
              aria-label="More teacher tools"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[11px] font-medium mt-1">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

interface TeacherToolSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Panel between app header and bottom nav — keeps logo and menu visible. */
export const TeacherToolSheet: React.FC<TeacherToolSheetProps> = ({
  open,
  title,
  onClose,
  children,
}) => {
  const chromeTop = useAppChromeTop();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`md:hidden fixed left-0 right-0 z-40 flex flex-col bg-white ${SHEET_TOP_EDGE}`}
      style={{ top: chromeTop, bottom: BOTTOM_NAV_HEIGHT }}
    >
      <SheetTopEdge />
      <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-200 shrink-0 bg-white">
        <h2 className="text-lg font-semibold text-gray-900 truncate min-w-0">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 min-w-0">
        {children}
      </div>
    </div>
  );
};

export default TeacherToolsBottomBar;
