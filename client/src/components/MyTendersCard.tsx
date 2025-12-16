import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Loader2, CheckCircle, Clock, Banknote } from 'lucide-react';
import { tendersApi } from '../services/api';
import { Tender } from '../types';

const MyTendersCard: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await tendersApi.getTenders();
        setTenders(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const workingOn = useMemo(() => {
    // Student-scoped list: server returns `my_application_status` only for the logged-in student.
    // "Working on" means the student was approved/awarded for this tender.
    return tenders.filter(t => t.my_application_status === 'approved');
  }, [tenders]);

  const display = useMemo(() => workingOn.slice(0, 5), [workingOn]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ClipboardList className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Tenders</h2>
        </div>
        <span className="text-sm text-gray-500">{workingOn.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
        </div>
      ) : workingOn.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p className="font-medium">No tenders yet</p>
          <p className="text-sm mt-1">Apply for a tender to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {display.map((t) => (
            <div key={t.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                  {t.description && <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {t.status === 'awarded' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3.5 w-3.5" />
                        AWARDED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Clock className="h-3.5 w-3.5" />
                        APPROVED
                      </span>
                    )}
                    {t.status === 'awarded' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${t.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                        <Banknote className="h-3.5 w-3.5" />
                        {t.paid ? 'PAID' : 'UNPAID'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {workingOn.length > display.length && (
            <p className="text-xs text-gray-500 text-center">+{workingOn.length - display.length} more</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTendersCard;


