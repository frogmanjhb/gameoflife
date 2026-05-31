import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, MinusCircle } from 'lucide-react';
import { ProceedingsStep } from '../services/api';

interface Props {
  timeline: ProceedingsStep[];
  mode: 'current' | 'past';
}

const LawsuitProceedingsFlowMap: React.FC<Props> = ({ timeline, mode }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const iconFor = (state: ProceedingsStep['state']) => {
    if (state === 'complete') return <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />;
    if (state === 'current') return <Clock className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />;
    if (state === 'skipped') return <MinusCircle className="h-5 w-5 text-gray-400 shrink-0" />;
    return <Circle className="h-5 w-5 text-gray-300 shrink-0" />;
  };

  const displayState = (step: ProceedingsStep): ProceedingsStep['state'] => {
    if (mode === 'past') {
      return step.state === 'skipped' ? 'skipped' : 'complete';
    }
    return step.state;
  };

  return (
    <div className="space-y-0">
      {timeline.map((step, idx) => {
        const state = displayState(step);
        const isLast = idx === timeline.length - 1;
        const expandedOpen = expanded === step.key;

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              {iconFor(state)}
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] ${
                    state === 'complete' ? 'bg-emerald-300' : state === 'current' ? 'bg-amber-300' : 'bg-gray-200 border-l border-dashed'
                  }`}
                />
              )}
            </div>
            <div className={`pb-5 flex-1 ${state === 'current' ? 'bg-amber-50 -mx-2 px-2 py-2 rounded-lg border border-amber-200' : ''}`}>
              <button
                type="button"
                className="text-left w-full"
                onClick={() => setExpanded(expandedOpen ? null : step.key)}
              >
                <p className={`font-medium ${state === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {step.summary && (
                  <p className={`text-sm mt-0.5 ${state === 'pending' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {step.summary}
                  </p>
                )}
                {state === 'current' && step.waiting_message && (
                  <p className="text-sm text-amber-700 mt-1 font-medium">{step.waiting_message}</p>
                )}
                {step.at && state !== 'pending' && (
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(step.at).toLocaleString()}</p>
                )}
              </button>
              {expandedOpen && step.detail && (
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LawsuitProceedingsFlowMap;
