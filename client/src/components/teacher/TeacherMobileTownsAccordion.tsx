import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import {
  TownTabItem,
  TownTabOverviewRow,
  TownTabSummaryPanel,
} from '../responsive/ResponsiveTownTabs';

interface TeacherMobileTownsAccordionProps {
  towns: TownTabItem[];
  activeTownClass: string | number | null;
  expandedTownId: string | number | null;
  onTownPress: (id: string | number) => void;
}

/** Nested town list inside the mobile Towns accordion. */
const TeacherMobileTownsAccordion: React.FC<TeacherMobileTownsAccordionProps> = ({
  towns,
  activeTownClass,
  expandedTownId,
  onTownPress,
}) => (
  <div className="space-y-2">
    {towns.map((town) => {
      const isSelected = activeTownClass === town.id;
      const isDetailOpen = expandedTownId === town.id;
      const summaryLine = town.summary
        ? `${town.summary.studentCount} students · ${town.summary.totalBalanceFormatted}`
        : town.classLabel;

      return (
        <div
          key={town.id}
          className={`rounded-xl border overflow-hidden ${
            isSelected ? 'border-primary-300 bg-primary-50/40' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          <button
            type="button"
            onClick={() => onTownPress(town.id)}
            className="w-full flex items-center gap-3 p-3 text-left min-h-[52px]"
            aria-expanded={isDetailOpen}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isSelected ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isSelected ? 'text-primary-800' : 'text-gray-900'}`}>
                {town.townName}
              </p>
              <p className="text-xs text-gray-500 truncate">{summaryLine}</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                isDetailOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDetailOpen && (town.overview || town.summary) && (
            <div className="border-t border-gray-200/80 bg-white px-3 py-3 space-y-3">
              {town.overview && (
                <TownTabOverviewRow overview={town.overview} isActive={isSelected} variant="primary" />
              )}
              {town.summary && (
                <TownTabSummaryPanel summary={town.summary} isActive={isSelected} variant="primary" />
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export default TeacherMobileTownsAccordion;
