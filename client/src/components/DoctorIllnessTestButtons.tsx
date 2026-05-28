import React from 'react';
import { FlaskConical } from 'lucide-react';
import {
  DoctorIllnessType,
  DOCTOR_ILLNESS_TEST_DURATION_MS,
  DOCTOR_ILLNESS_TEST_OPTIONS,
} from '../utils/doctorIllness';

interface DoctorIllnessTestButtonsProps {
  activeTest: DoctorIllnessType | null;
  onStartTest: (type: DoctorIllnessType) => void;
}

const DoctorIllnessTestButtons: React.FC<DoctorIllnessTestButtonsProps> = ({
  activeTest,
  onStartTest,
}) => (
  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
    <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
      <FlaskConical className="h-4 w-4 text-emerald-700" />
      Test student illnesses
    </p>
    <p className="text-xs text-gray-600 mb-3">
      Each preview runs for {DOCTOR_ILLNESS_TEST_DURATION_MS / 1000} seconds (as students experience it).
    </p>
    <div className="flex flex-wrap gap-2">
      {DOCTOR_ILLNESS_TEST_OPTIONS.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          onClick={() => onStartTest(type)}
          disabled={activeTest !== null}
          className="inline-flex items-center px-3 py-2 rounded-lg font-medium bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Test {label}
        </button>
      ))}
    </div>
    {activeTest && (
      <p className="text-xs text-emerald-800 mt-2 font-medium">Preview running…</p>
    )}
  </div>
);

export default DoctorIllnessTestButtons;
