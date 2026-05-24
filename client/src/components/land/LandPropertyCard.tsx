import React, { useState } from 'react';
import { LandParcel } from '../../types';
import { landApi } from '../../services/api';
import api from '../../services/api';
import { formatCurrency, BIOME_CONFIG, BIOME_ICONS } from './BiomeConfig';
import { TrendingUp, DollarSign, Loader2, Tag, X } from 'lucide-react';

interface Classmate {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface LandPropertyCardProps {
  parcel: LandParcel;
  onUpdated: () => void;
}

const LandPropertyCard: React.FC<LandPropertyCardProps> = ({ parcel, onUpdated }) => {
  const [rentLoading, setRentLoading] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [classmatesLoading, setClassmatesLoading] = useState(false);
  const [buyerId, setBuyerId] = useState('');
  const [salePrice, setSalePrice] = useState(String(parcel.current_value ?? parcel.value));
  const [sellLoading, setSellLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentValue = parcel.current_value ?? parcel.value;
  const purchasePrice = parcel.purchase_price ?? parcel.value;
  const appreciation = parcel.appreciation ?? (currentValue - purchasePrice);
  const weeklyRent = parcel.weekly_rent ?? 0;

  const handleCollectRent = async () => {
    setRentLoading(true);
    setError('');
    try {
      const res = await landApi.collectRent(parcel.id);
      setSuccess(`Collected ${formatCurrency(res.data.amount)} rental income`);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to collect rent');
    } finally {
      setRentLoading(false);
    }
  };

  const openSellModal = async () => {
    setSellOpen(true);
    setError('');
    setSuccess('');
    setSalePrice(String(currentValue));
    if (classmates.length === 0) {
      setClassmatesLoading(true);
      try {
        const res = await api.get('/students/classmates');
        setClassmates(res.data);
      } catch {
        setError('Could not load classmates');
      } finally {
        setClassmatesLoading(false);
      }
    }
  };

  const handleSubmitSale = async () => {
    if (!buyerId) {
      setError('Select a buyer');
      return;
    }
    setSellLoading(true);
    setError('');
    try {
      await landApi.createSaleRequest(parcel.id, parseInt(buyerId, 10), parseFloat(salePrice));
      setSuccess('Sale request sent to Financial Manager for approval');
      setSellOpen(false);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create sale request');
    } finally {
      setSellLoading(false);
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl border-2 overflow-hidden hover:shadow-lg transition-shadow"
        style={{ borderColor: BIOME_CONFIG[parcel.biome_type].color }}
      >
        <div className="p-4 text-white" style={{ backgroundColor: BIOME_CONFIG[parcel.biome_type].color }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{BIOME_ICONS[parcel.biome_type]}</span>
              <div>
                <h4 className="font-bold">{parcel.grid_code}</h4>
                <p className="text-sm opacity-80">{parcel.biome_type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{formatCurrency(currentValue)}</p>
              {appreciation > 0 && (
                <p className="text-xs opacity-90 flex items-center justify-end gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{formatCurrency(appreciation)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 text-sm">
          {error && !sellOpen && <p className="text-red-600 text-xs">{error}</p>}
          {success && !sellOpen && <p className="text-green-600 text-xs">{success}</p>}

          <div className="grid grid-cols-2 gap-2 text-gray-600">
            <div>
              <span className="text-xs text-gray-400 block">Purchase price</span>
              <span className="font-medium">{formatCurrency(purchasePrice)}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Weekly rent (5%)</span>
              <span className="font-medium text-green-600">{formatCurrency(weeklyRent)}</span>
            </div>
          </div>

          {parcel.purchased_at && (
            <p className="text-xs text-gray-500">
              Owned {parcel.weeks_owned ?? 0} week(s) · +1% value per week
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleCollectRent}
              disabled={rentLoading || !parcel.can_collect_rent}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rentLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
              {parcel.can_collect_rent ? 'Collect rent' : 'Rent collected'}
            </button>
            <button
              type="button"
              onClick={openSellModal}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
            >
              <Tag className="h-3 w-3" />
              Sell to student
            </button>
          </div>
        </div>
      </div>

      {sellOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sell {parcel.grid_code}</h3>
              <button type="button" onClick={() => setSellOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your Financial Manager must approve before the buyer can accept. Current value: {formatCurrency(currentValue)}.
            </p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer (classmate)</label>
                {classmatesLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                ) : (
                  <select
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select a student…</option>
                    {classmates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : c.username} (@{c.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale price (R)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setSellOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSale}
                disabled={sellLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {sellLoading ? 'Submitting…' : 'Submit sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandPropertyCard;
