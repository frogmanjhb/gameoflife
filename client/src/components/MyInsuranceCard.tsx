import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, ArrowRight, Heart, Wifi, Home } from 'lucide-react';
import api from '../services/api';

interface Policy {
  id: number;
  insurance_type: string;
  weeks: number;
  total_cost: number;
  week_start_date: string;
  created_at: string;
  active?: boolean;
}

const TYPE_LABELS: Record<string, string> = { health: 'Health', cyber: 'Cyber', property: 'Property' };
const TYPE_ICONS: Record<string, React.ElementType> = { health: Heart, cyber: Wifi, property: Home };

const MyInsuranceCard: React.FC = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/insurance/my-policies')
      .then((res) => { if (!cancelled) setPolicies(res.data || []); })
      .catch(() => { if (!cancelled) setPolicies([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const activeCount = policies.filter((p) => p.active).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate('/insurance')}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-100">
            <Shield className="h-5 w-5 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">My Insurance</h2>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
      {policies.length === 0 ? (
        <p className="text-sm text-gray-500">No insurance yet. Open Insurance to buy coverage.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            {activeCount > 0 ? `${activeCount} active polic${activeCount === 1 ? 'y' : 'ies'}` : 'No active policies'}
          </p>
          <div className="flex flex-wrap gap-1">
            {policies.slice(0, 5).map((p) => {
              const Icon = TYPE_ICONS[p.insurance_type] || Shield;
              return (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    p.active ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {TYPE_LABELS[p.insurance_type] || p.insurance_type}
                </span>
              );
            })}
            {policies.length > 5 && (
              <span className="text-xs text-gray-500">+{policies.length - 5} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInsuranceCard;
