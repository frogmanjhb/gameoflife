import React, { useEffect, useState } from 'react';
import { Calculator, Loader2, Scale, Stethoscope, Users } from 'lucide-react';
import { studentsApi } from '../services/api';
import { StudentTownProfessionals, TownProfessional } from '../types';

const ProfessionalRow: React.FC<{
  icon: React.ElementType;
  label: string;
  person: TownProfessional | null;
  emptyText: string;
  iconClassName: string;
}> = ({ icon: Icon, label, person, emptyText, iconClassName }) => (
  <div className="flex items-start gap-3">
    <div className={`p-2 rounded-lg flex-shrink-0 ${iconClassName}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {person ? (
        <>
          <p className="text-sm font-semibold text-gray-900 truncate">{person.display_name}</p>
          <p className="text-xs text-gray-500 truncate">@{person.username}</p>
        </>
      ) : (
        <p className="text-sm text-gray-500">{emptyText}</p>
      )}
    </div>
  </div>
);

const MyTownProfessionalsCard: React.FC = () => {
  const [professionals, setProfessionals] = useState<StudentTownProfessionals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    studentsApi
      .getMyTownProfessionals()
      .then((res) => {
        if (!cancelled) setProfessionals(res.data);
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load your town professionals');
          setProfessionals(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  const lawyerNames =
    professionals?.lawyers?.length
      ? professionals.lawyers.map((l) => l.display_name).join(', ')
      : null;
  const primaryLawyer = professionals?.lawyers?.[0] ?? null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-lg bg-indigo-100">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">My Town Team</h2>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          <ProfessionalRow
            icon={Calculator}
            label="Accountant"
            person={professionals?.accountant ?? null}
            emptyText="No accountant assigned in your town yet"
            iconClassName="bg-emerald-100 text-emerald-700"
          />
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0 bg-violet-100 text-violet-700">
              <Scale className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lawyer</p>
              {primaryLawyer ? (
                <>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {professionals!.lawyers.length > 1 ? lawyerNames : primaryLawyer.display_name}
                  </p>
                  {professionals!.lawyers.length === 1 && (
                    <p className="text-xs text-gray-500 truncate">@{primaryLawyer.username}</p>
                  )}
                  {professionals!.lawyers.length > 1 && (
                    <p className="text-xs text-gray-500">
                      {professionals!.lawyers.length} lawyers cover your town class
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No lawyer assigned in your town yet</p>
              )}
            </div>
          </div>
          <ProfessionalRow
            icon={Stethoscope}
            label="Doctor"
            person={professionals?.doctor ?? null}
            emptyText="No doctor assigned in your town yet"
            iconClassName="bg-sky-100 text-sky-700"
          />
        </div>
      )}
    </div>
  );
};

export default MyTownProfessionalsCard;
