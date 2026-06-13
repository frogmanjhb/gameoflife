import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, X } from 'lucide-react';
import { cyberAttackApi } from '../services/api';
import { CyberAttackMyStatus } from '../types';
import {
  CYBER_ATTACK_INITIAL_POPUPS,
  CYBER_ATTACK_LABELS,
  CYBER_ATTACK_MAX_POPUPS,
  CYBER_ATTACK_POPUP_AUTO_DISMISS_MS,
  CYBER_ATTACK_TRAP_SPAWN_COUNT,
  createPopupId,
  CyberAttackType,
  randomPopupPosition,
} from '../utils/cyberAttack';

const POLL_MS = 4000;

type SpywarePopup = {
  id: string;
  x: number;
  y: number;
};

interface SpywarePopupWindowProps {
  popup: SpywarePopup;
  onClose: (id: string) => void;
  onTrapClick: (id: string) => void;
}

function SpywarePopupWindow({ popup, onClose, onTrapClick }: SpywarePopupWindowProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(popup.id), CYBER_ATTACK_POPUP_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [popup.id, onClose]);

  return (
    <div
      className="spyware-popup-window fixed z-[95] w-64 select-none shadow-2xl"
      style={{ left: popup.x, top: popup.y }}
      role="dialog"
      aria-label="Suspicious pop-up advertisement"
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-900 text-white text-xs px-2 py-1 rounded-t-sm">
        <span className="font-semibold truncate">🏘️ Town Land Lottery</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose(popup.id);
          }}
          className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-white/20"
          aria-label="Close pop-up"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="rounded-b-sm border-2 border-t-0 border-gray-400 bg-gray-100 p-3 text-center">
        <p className="text-sm font-extrabold text-red-600 leading-tight">
          🎉 CONGRATULATIONS! 🎉
        </p>
        <p className="mt-1 text-xs font-bold text-gray-800">You won a FREE land plot!</p>
        <p className="mt-1 text-[10px] text-gray-500">Limited time offer — claim now!</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTrapClick(popup.id);
          }}
          className="mt-2 w-full rounded border-2 border-yellow-600 bg-yellow-400 px-2 py-1.5 text-xs font-extrabold text-yellow-900 shadow hover:bg-yellow-300 animate-pulse"
        >
          CLICK TO WIN!
        </button>
      </div>
    </div>
  );
}

const StudentCyberAttackOverlay: React.FC = () => {
  const [status, setStatus] = useState<CyberAttackMyStatus | null>(null);
  const [popups, setPopups] = useState<SpywarePopup[]>([]);
  const [itRequired, setItRequired] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedForAssignmentRef = useRef<string | null>(null);
  const selfResolvingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await cyberAttackApi.getMyStatus();
      setStatus(res.data);
      if (!res.data.active) {
        setPopups([]);
        setItRequired(false);
        initializedForAssignmentRef.current = null;
        setError(null);
      }
    } catch {
      setStatus({ active: false });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = window.setInterval(fetchStatus, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchStatus]);

  const isActive = !!status?.active;
  const attackType = status?.attack_type as CyberAttackType | undefined;
  const pendingRepair = !!status?.pending_repair;
  const pendingInsuranceClaim = !!status?.pending_insurance_claim;
  const assignmentKey = status?.assigned_at ?? '';

  useEffect(() => {
    if (!isActive || attackType !== 'spyware_popup_storm' || pendingRepair || pendingInsuranceClaim) {
      return;
    }
    if (initializedForAssignmentRef.current === assignmentKey) return;

    initializedForAssignmentRef.current = assignmentKey;
    selfResolvingRef.current = false;
    setItRequired(false);
    setPopups(
      Array.from({ length: CYBER_ATTACK_INITIAL_POPUPS }, (_, i) => ({
        id: createPopupId(),
        ...randomPopupPosition(i),
      }))
    );
  }, [isActive, attackType, assignmentKey, pendingRepair, pendingInsuranceClaim]);

  const closePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleTrapClick = useCallback(
    (id: string) => {
      setPopups((prev) => {
        const without = prev.filter((p) => p.id !== id);
        const room = CYBER_ATTACK_MAX_POPUPS - without.length;
        if (room <= 0) {
          setItRequired(true);
          return without;
        }
        const spawnCount = Math.min(CYBER_ATTACK_TRAP_SPAWN_COUNT, room);
        const newPopups: SpywarePopup[] = Array.from({ length: spawnCount }, (_, i) => ({
          id: createPopupId(),
          ...randomPopupPosition(without.length + i),
        }));
        const next = [...without, ...newPopups];
        if (next.length >= CYBER_ATTACK_MAX_POPUPS) {
          setItRequired(true);
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (
      !isActive ||
      itRequired ||
      pendingRepair ||
      pendingInsuranceClaim ||
      popups.length > 0 ||
      !initializedForAssignmentRef.current ||
      selfResolvingRef.current
    ) {
      return;
    }

    selfResolvingRef.current = true;
    cyberAttackApi
      .selfResolve()
      .then(() => {
        setStatus({ active: false });
        initializedForAssignmentRef.current = null;
      })
      .catch(() => {
        selfResolvingRef.current = false;
        fetchStatus();
      });
  }, [isActive, itRequired, pendingRepair, pendingInsuranceClaim, popups.length, fetchStatus]);

  const handleCallIt = async () => {
    setRepairing(true);
    setError(null);
    try {
      const res = await cyberAttackApi.callIt();
      if (res.data.pending_repair || res.data.pending_insurance_claim) {
        setPopups([]);
        await fetchStatus();
      } else {
        setStatus({ active: false });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not call IT. Try again.';
      setError(msg);
    } finally {
      setRepairing(false);
    }
  };

  if (!isActive || attackType !== 'spyware_popup_storm') return null;

  const attackName = status?.attack_name || CYBER_ATTACK_LABELS.spyware_popup_storm.name;
  const attackDescription =
    status?.attack_description || CYBER_ATTACK_LABELS.spyware_popup_storm.description;
  const repairFee = status?.repair_fee ?? 5000;

  const overlay = (
    <>
      {!pendingRepair && !pendingInsuranceClaim && !itRequired &&
        popups.map((popup) => (
          <SpywarePopupWindow
            key={popup.id}
            popup={popup}
            onClose={closePopup}
            onTrapClick={handleTrapClick}
          />
        ))}

      {(itRequired || pendingRepair || pendingInsuranceClaim) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border-2 border-blue-400 bg-white p-6 shadow-2xl text-center">
            <div className="text-4xl mb-3">🖥️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Call IT to Repair</h2>
            <p className="text-sm text-gray-600 mb-2">
              {pendingInsuranceClaim
                ? 'Cyber insurance claim submitted. Waiting for your town insurance manager to approve payment of R'
                : pendingRepair
                  ? 'Paid R'
                  : 'Too many pop-ups! Your device needs professional repair. Fee: R'}
              {!pendingInsuranceClaim && !pendingRepair && repairFee.toFixed(2)}
              {pendingRepair && `${repairFee.toFixed(2)} to `}
              {pendingRepair &&
                (status?.engineer_display_name || status?.engineer_username || 'IT support')}
              {pendingRepair && '. Waiting for them to approve the repair on My Job.'}
              {pendingInsuranceClaim && `${repairFee.toFixed(2)}.`}
            </p>
            {pendingInsuranceClaim && (
              <p className="text-xs text-cyan-800 font-medium mb-3">
                Once approved, your Software Engineer will complete the repair.
              </p>
            )}
            {pendingRepair && (
              <p className="text-xs text-amber-800 font-medium mb-3">
                {status?.cyber_insurance_covers_repair
                  ? 'Cyber insurance paid the repair fee. '
                  : ''}
                Waiting for IT approval…
              </p>
            )}
            {!pendingRepair && !pendingInsuranceClaim && (
              <>
                <p className="text-xs text-gray-500 mb-4">
                  {status?.cyber_insurance_covers_repair
                    ? status?.insurance_broker_required
                      ? `R${repairFee.toFixed(2)} — covered by cyber insurance (insurance manager approves claim; you are not charged)`
                      : `R${repairFee.toFixed(2)} — covered by your cyber insurance`
                    : `R${repairFee.toFixed(2)} paid to your town Software Engineer`}
                </p>
                {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
                <button
                  type="button"
                  onClick={handleCallIt}
                  disabled={repairing}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-colors"
                >
                  <Monitor className="h-5 w-5" />
                  {repairing
                    ? 'Calling IT…'
                    : status?.cyber_insurance_covers_repair
                      ? status?.insurance_broker_required
                        ? 'Call IT — submit insurance claim'
                        : 'Call IT — insurance covers fee'
                      : `Call IT — R${repairFee.toFixed(2)}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!itRequired && !pendingRepair && !pendingInsuranceClaim && (
        <div className="fixed bottom-6 right-6 z-[96] max-w-xs rounded-lg border border-blue-300 bg-blue-50/95 px-3 py-2 shadow-lg">
          <p className="text-xs font-semibold text-blue-900">⚠️ {attackName}</p>
          <p className="text-[11px] text-blue-800 mt-0.5">{attackDescription}</p>
          <p className="text-[10px] text-blue-700 mt-1">
            Pop-ups: {popups.length} / {CYBER_ATTACK_MAX_POPUPS}
          </p>
        </div>
      )}
    </>
  );

  return createPortal(overlay, document.body);
};

export default StudentCyberAttackOverlay;
