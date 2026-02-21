import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { businessProposalsApi } from '../../services/api';
import { BusinessProposalPayload } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface EntrepreneurBusinessProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INDUSTRY_OPTIONS = ['Retail', 'Tech', 'Construction', 'Health', 'Creative', 'Education', 'Other'];
const TARGET_OPTIONS = ['Students', 'Businesses', 'Government', 'Everyone'];
const PRICING_OPTIONS = [
  { value: 'per_unit', label: 'Per unit' },
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_job', label: 'Per job' },
  { value: 'weekly_contract', label: 'Weekly contract' }
];
const GROWTH_OPTIONS = [
  'Increase prices',
  'Increase sales volume',
  'Hire workers',
  'Expand products/services',
  'Open second branch'
];

const EntrepreneurBusinessProposalModal: React.FC<EntrepreneurBusinessProposalModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [payload, setPayload] = useState<BusinessProposalPayload>({
    entrepreneur_name: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username : '',
    town_biome: user?.class ? `${user.class} Town` : '',
    business_model: undefined,
    industry_type: [],
    problem_solved: '',
    product_service_description: '',
    target_customers: [],
    pricing_type: undefined,
    price_per_unit: undefined,
    estimated_units_per_week: undefined,
    cost_per_unit: undefined,
    weekly_fixed_costs: undefined,
    startup_cost: undefined,
    need_loan: false,
    loan_amount_requested: undefined,
    biome_impact: '',
    risk_level: undefined,
    growth_plan: [],
    growth_explanation: ''
  });

  const updatePayload = (key: keyof BusinessProposalPayload, value: unknown) => {
    setPayload((p) => ({ ...p, [key]: value }));
  };

  const toggleArray = (key: 'industry_type' | 'target_customers' | 'growth_plan', item: string) => {
    setPayload((p) => {
      const arr = (p[key] as string[]) || [];
      const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
      return { ...p, [key]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await businessProposalsApi.submit({ business_name: businessName.trim(), payload });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit proposal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">🚀 TownSim – Business Proposal Form</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* 1. Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1️⃣ Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. Sunny Snacks"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entrepreneur Name</label>
                <input
                  type="text"
                  value={payload.entrepreneur_name || ''}
                  onChange={(e) => updatePayload('entrepreneur_name', e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town / Biome</label>
                <input
                  type="text"
                  value={payload.town_biome || ''}
                  onChange={(e) => updatePayload('town_biome', e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. 6A Town, Grassland"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Business Model</span>
                <div className="flex flex-wrap gap-3">
                  {(['product', 'service', 'hybrid'] as const).map((m) => (
                    <label key={m} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="business_model"
                        checked={payload.business_model === m}
                        onChange={() => updatePayload('business_model', m)}
                      />
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Industry Type</span>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={(payload.industry_type || []).includes(opt)}
                        onChange={() => toggleArray('industry_type', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Business Idea */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2️⃣ Business Idea</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What problem does this business solve? (1–2 sentences)</label>
                <textarea
                  value={payload.problem_solved || ''}
                  onChange={(e) => updatePayload('problem_solved', e.target.value)}
                  className="input-field w-full min-h-[60px]"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe your product or service (short paragraph)</label>
                <textarea
                  value={payload.product_service_description || ''}
                  onChange={(e) => updatePayload('product_service_description', e.target.value)}
                  className="input-field w-full min-h-[80px]"
                  rows={3}
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Target Customers</span>
                <div className="flex flex-wrap gap-2">
                  {TARGET_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={(payload.target_customers || []).includes(opt)}
                        onChange={() => toggleArray('target_customers', opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Revenue Model */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3️⃣ Revenue Model</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</span>
                <div className="flex flex-wrap gap-2">
                  {PRICING_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="pricing_type"
                        checked={payload.pricing_type === value}
                        onChange={() => updatePayload('pricing_type', value)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per unit/hour/job (R)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={payload.price_per_unit ?? ''}
                    onChange={(e) => updatePayload('price_per_unit', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated units or hours per week</label>
                  <input
                    type="number"
                    min={0}
                    value={payload.estimated_units_per_week ?? ''}
                    onChange={(e) => updatePayload('estimated_units_per_week', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Costs */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4️⃣ Costs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per unit/hour (R)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={payload.cost_per_unit ?? ''}
                  onChange={(e) => updatePayload('cost_per_unit', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly fixed costs (R)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={payload.weekly_fixed_costs ?? ''}
                  onChange={(e) => updatePayload('weekly_fixed_costs', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startup cost (R)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={payload.startup_cost ?? ''}
                  onChange={(e) => updatePayload('startup_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input-field w-full"
                />
              </div>
            </div>
          </section>

          {/* 5. Loan & Funding */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5️⃣ Loan & Funding</h3>
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payload.need_loan === true}
                  onChange={(e) => updatePayload('need_loan', e.target.checked)}
                />
                <span>Will you need a loan?</span>
              </label>
              {payload.need_loan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan amount requested (R)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={payload.loan_amount_requested ?? ''}
                    onChange={(e) => updatePayload('loan_amount_requested', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="input-field w-full"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 6. Risk & Biome Impact */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6️⃣ Risk & Biome Impact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How does your biome affect your business?</label>
                <textarea
                  value={payload.biome_impact || ''}
                  onChange={(e) => updatePayload('biome_impact', e.target.value)}
                  className="input-field w-full min-h-[60px]"
                  rows={2}
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Risk Level</span>
                <div className="flex gap-3">
                  {(['low', 'medium', 'high'] as const).map((r) => (
                    <label key={r} className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="risk_level"
                        checked={payload.risk_level === r}
                        onChange={() => updatePayload('risk_level', r)}
                      />
                      <span className="capitalize">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 7. Growth Plan */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7️⃣ Growth Plan</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {GROWTH_OPTIONS.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={(payload.growth_plan || []).includes(opt)}
                      onChange={() => toggleArray('growth_plan', opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short explanation</label>
                <textarea
                  value={payload.growth_explanation || ''}
                  onChange={(e) => updatePayload('growth_explanation', e.target.value)}
                  className="input-field w-full min-h-[60px]"
                  rows={2}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntrepreneurBusinessProposalModal;
