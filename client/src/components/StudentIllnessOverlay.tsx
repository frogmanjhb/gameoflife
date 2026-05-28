import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Stethoscope } from 'lucide-react';
import { doctorIllnessApi } from '../services/api';
import { DoctorIllnessMyStatus, DoctorIllnessType } from '../types';
import {
  DOCTOR_ILLNESS_LABELS,
  DOCTOR_ILLNESS_TEST_DURATION_MS,
  DOCTOR_ILLNESS_TEST_SEE_DOCTOR_DELAY_MS,
} from '../utils/doctorIllness';

const POLL_MS = 4000;
const PROD_SEE_DOCTOR_DELAY_MS = 2 * 60 * 1000;
const BEETLE_PLAGUE_COUNT = 500;

type Beetle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
};

function CreepCrawliesLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let beetles: Beetle[] = [];

    const spawnBeetles = () => {
      beetles = Array.from({ length: BEETLE_PLAGUE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 3.2,
        vy: (Math.random() - 0.5) * 3.2,
        size: 8 + Math.random() * 16,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (beetles.length === 0) spawnBeetles();
    };

    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const b of beetles) {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.rotSpeed;
        if (b.x < -24) b.x = width + 24;
        if (b.x > width + 24) b.x = -24;
        if (b.y < -24) b.y = height + 24;
        if (b.y > height + 24) b.y = -24;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.font = `${b.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪲', 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="illness-creep-crawlies pointer-events-none fixed inset-0 z-[92]"
      aria-hidden
    />
  );
}

interface StudentIllnessOverlayProps {
  /** Teacher preview: no API, auto-ends after DOCTOR_ILLNESS_TEST_DURATION_MS */
  testIllness?: DoctorIllnessType | null;
  onTestEnd?: () => void;
}

const StudentIllnessOverlay: React.FC<StudentIllnessOverlayProps> = ({
  testIllness = null,
  onTestEnd,
}) => {
  const isTestMode = testIllness != null;
  const testStartedAtRef = useRef<number>(0);

  const [status, setStatus] = useState<DoctorIllnessMyStatus | null>(null);
  const [tick, setTick] = useState(0);
  const [curing, setCuring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSecondsLeft, setTestSecondsLeft] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await doctorIllnessApi.getMyStatus();
      setStatus(res.data);
      if (!res.data.active) setError(null);
    } catch {
      setStatus({ active: false });
    }
  }, []);

  useEffect(() => {
    if (isTestMode) return;
    fetchStatus();
    const id = window.setInterval(fetchStatus, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchStatus, isTestMode]);

  useEffect(() => {
    if (!isTestMode || !testIllness) return;
    testStartedAtRef.current = Date.now();
    setError(null);
    const labels = DOCTOR_ILLNESS_LABELS[testIllness];
    setStatus({
      active: true,
      illness_type: testIllness,
      illness_name: labels.name,
      illness_description: labels.description,
      assigned_at: new Date().toISOString(),
    });

    const tickId = window.setInterval(() => setTick((t) => t + 1), 250);
    const endId = window.setTimeout(() => {
      setStatus({ active: false });
      onTestEnd?.();
    }, DOCTOR_ILLNESS_TEST_DURATION_MS);

    return () => {
      window.clearInterval(tickId);
      window.clearTimeout(endId);
    };
  }, [isTestMode, testIllness, onTestEnd]);

  useEffect(() => {
    const active = isTestMode ? !!testIllness : status?.active;
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [isTestMode, testIllness, status?.active]);

  const illnessType = (isTestMode ? testIllness : status?.illness_type) as DoctorIllnessType | undefined;
  const isActive = isTestMode ? !!testIllness : !!status?.active;

  const seeDoctorDelayMs = isTestMode ? DOCTOR_ILLNESS_TEST_SEE_DOCTOR_DELAY_MS : PROD_SEE_DOCTOR_DELAY_MS;

  const pendingCure = !isTestMode && !!status?.pending_cure;
  const pendingInsuranceClaim = !isTestMode && !!status?.pending_insurance_claim;

  const canPayForCure = useMemo(() => {
    if (!isActive || !illnessType || pendingCure || pendingInsuranceClaim) return false;
    if (isTestMode) {
      return Date.now() >= testStartedAtRef.current + seeDoctorDelayMs;
    }
    if (status?.can_see_doctor) return true;
    if (status?.see_doctor_available_at) {
      return Date.now() >= new Date(status.see_doctor_available_at).getTime();
    }
    if (status?.assigned_at) {
      return Date.now() >= new Date(status.assigned_at).getTime() + PROD_SEE_DOCTOR_DELAY_MS;
    }
    return false;
  }, [isActive, illnessType, isTestMode, status, tick, seeDoctorDelayMs, pendingCure, pendingInsuranceClaim]);

  const secondsLeft = useMemo(() => {
    if (!isActive || canPayForCure || pendingCure || pendingInsuranceClaim) return 0;
    if (isTestMode) {
      return Math.max(
        0,
        Math.ceil((testStartedAtRef.current + seeDoctorDelayMs - Date.now()) / 1000)
      );
    }
    if (typeof status?.seconds_until_see_doctor === 'number' && status.seconds_until_see_doctor > 0) {
      return status.seconds_until_see_doctor;
    }
    if (status?.see_doctor_available_at) {
      return Math.max(0, Math.ceil((new Date(status.see_doctor_available_at).getTime() - Date.now()) / 1000));
    }
    return 0;
  }, [isActive, canPayForCure, pendingCure, pendingInsuranceClaim, isTestMode, status, tick, seeDoctorDelayMs]);

  useEffect(() => {
    if (!isTestMode || !testIllness) {
      setTestSecondsLeft(0);
      return;
    }
    const update = () => {
      setTestSecondsLeft(
        Math.max(0, Math.ceil((testStartedAtRef.current + DOCTOR_ILLNESS_TEST_DURATION_MS - Date.now()) / 1000))
      );
    };
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [isTestMode, testIllness, tick]);

  useEffect(() => {
    const lock = isActive && illnessType === 'button_lock_fever';
    const vertigo = isActive && illnessType === 'verdigris_vertigo';
    if (lock) {
      document.body.setAttribute('data-illness-button-lock', 'true');
    } else {
      document.body.removeAttribute('data-illness-button-lock');
    }
    if (vertigo) {
      document.body.setAttribute('data-illness-verdigris', 'true');
    } else {
      document.body.removeAttribute('data-illness-verdigris');
    }
    return () => {
      document.body.removeAttribute('data-illness-button-lock');
      document.body.removeAttribute('data-illness-verdigris');
    };
  }, [isActive, illnessType]);

  const endTest = () => {
    setStatus({ active: false });
    onTestEnd?.();
  };

  const handleSeeDoctor = async () => {
    if (isTestMode) {
      endTest();
      return;
    }
    setCuring(true);
    setError(null);
    try {
      const res = await doctorIllnessApi.seeDoctor();
      if (res.data.pending_cure || res.data.pending_insurance_claim) {
        await fetchStatus();
      } else {
        setStatus({ active: false });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not visit the doctor. Try again.';
      setError(msg);
    } finally {
      setCuring(false);
    }
  };

  if (!isActive || !illnessType) return null;

  const illnessName = isTestMode
    ? DOCTOR_ILLNESS_LABELS[illnessType].name
    : status?.illness_name || 'You feel unwell';
  const illnessDescription = isTestMode
    ? DOCTOR_ILLNESS_LABELS[illnessType].description
    : status?.illness_description;

  const overlay = (
    <>
      {illnessType === 'verdigris_vertigo' && (
        <>
          <div className="illness-verdigris-swirl pointer-events-none fixed inset-0 z-[90]" aria-hidden />
          <div className="illness-verdigris-vertigo pointer-events-none fixed inset-0 z-[91]" aria-hidden />
        </>
      )}
      {illnessType === 'creep_crawlies' && <CreepCrawliesLayer />}
      {illnessType === 'button_lock_fever' && (
        <div className="illness-town-hall-shroud fixed inset-0 z-[93]" aria-hidden />
      )}

      <div
        data-illness-clinic-ui
        className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 flex flex-col items-center gap-2 px-4 w-full max-w-md"
      >
        <div className="bg-white/95 border border-emerald-300 shadow-lg rounded-xl px-4 py-3 text-center w-full">
          {isTestMode && (
            <p className="text-xs font-semibold text-indigo-700 mb-1">
              Teacher preview — ends in {testSecondsLeft}s
            </p>
          )}
          <p className="text-sm font-semibold text-emerald-900">🤒 {illnessName}</p>
          <p className="text-xs text-gray-600 mt-1">{illnessDescription}</p>
          {pendingInsuranceClaim && (
            <p className="text-xs text-cyan-800 mt-2 font-medium">
              Health insurance claim submitted. Waiting for your town insurance manager to approve payment of R
              {(status?.cure_fee ?? 5000).toFixed(2)}.
            </p>
          )}
          {pendingCure && (
            <p className="text-xs text-amber-800 mt-2 font-medium">
              {status?.health_insurance_covers_clinic
                ? `Health insurance paid $${(status?.cure_fee ?? 5000).toFixed(2)} to `
                : `Paid $${(status?.cure_fee ?? 5000).toFixed(2)} to `}
              {status?.doctor_display_name || status?.doctor_username || 'your doctor'}. Waiting for them to
              approve your cure on My Job.
            </p>
          )}
          {!pendingCure && !canPayForCure && (
            <p className="text-xs text-amber-700 mt-2 font-medium">
              Clinic opens in {secondsLeft > 0 ? `${secondsLeft}s` : 'a moment…'}
            </p>
          )}
          {!pendingCure && !pendingInsuranceClaim && canPayForCure && (
            <p className="text-xs text-gray-600 mt-2">
              {status?.health_insurance_covers_clinic
                ? status?.insurance_broker_required
                  ? `Clinic fee: R${(status?.cure_fee ?? 5000).toFixed(2)} — health insurance will pay after your insurance manager approves`
                  : `Clinic fee: R${(status?.cure_fee ?? 5000).toFixed(2)} — covered by your health insurance`
                : `Clinic fee: R${(status?.cure_fee ?? 5000).toFixed(2)} (paid to your town doctor)`}
            </p>
          )}
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>

        {canPayForCure && (
          <button
            type="button"
            data-illness-see-doctor
            onClick={handleSeeDoctor}
            disabled={curing}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-8 py-4 rounded-xl shadow-xl text-lg transition-colors"
          >
            <Stethoscope className="h-6 w-6" />
            {curing
              ? 'Visiting…'
              : status?.health_insurance_covers_clinic
                ? status?.insurance_broker_required
                  ? 'See a Doctor — submit insurance claim'
                  : 'See a Doctor — insurance covers fee'
                : `See a Doctor — R${(status?.cure_fee ?? 5000).toFixed(2)}`}
          </button>
        )}
      </div>
    </>
  );

  return createPortal(overlay, document.body);
};

export default StudentIllnessOverlay;
