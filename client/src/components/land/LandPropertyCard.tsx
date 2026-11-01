import React, { useState } from 'react';
import { LandParcel } from '../../types';
import { formatCurrency, BIOME_CONFIG, BIOME_ICONS } from './BiomeConfig';
import LandPropertyDetailModal from './LandPropertyDetailModal';
import { TrendingUp } from 'lucide-react';

interface LandPropertyCardProps {
  parcel: LandParcel;
  onUpdated: () => void;
}

const LandPropertyCard: React.FC<LandPropertyCardProps> = ({ parcel, onUpdated }) => {
  const [detailOpen, setDetailOpen] = useState(false);

  const currentValue = Number(parcel.current_value ?? parcel.value) || 0;
  const purchasePrice = Number(parcel.purchase_price ?? parcel.value) || 0;
  const appreciation = parcel.appreciation ?? (currentValue - purchasePrice);
  const weeklyRent = Number(parcel.weekly_rent) || 0;
  const rentWeeksDue = parcel.rent_weeks_due ?? (parcel.can_collect_rent ? 1 : 0);
  const collectAmount = parcel.accrued_rent ?? (rentWeeksDue > 0 ? weeklyRent * rentWeeksDue : weeklyRent);
  const rentalYieldPercent = parcel.rental_yield_percent ?? 5;
  const biomeConfig = BIOME_CONFIG[parcel.biome_type] ?? BIOME_CONFIG['Grassland'];
  const biomeIcon = BIOME_ICONS[parcel.biome_type] ?? '🗺️';

  return (
    <>
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="w-full text-left bg-white rounded-xl border-2 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        style={{ borderColor: biomeConfig.color }}
      >
        <div className="p-4 text-white" style={{ backgroundColor: biomeConfig.color }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{biomeIcon}</span>
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

        <div className="p-4 space-y-2 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-400 block">Purchase price</span>
              <span className="font-medium">{formatCurrency(purchasePrice)}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">
                {rentWeeksDue > 1 ? `Rent due (${rentWeeksDue} wks)` : `Weekly rent (${rentalYieldPercent}%)`}
              </span>
              <span className="font-medium text-green-600">
                {formatCurrency(rentWeeksDue > 1 ? collectAmount : weeklyRent)}
              </span>
            </div>
          </div>
          <p className="text-xs text-primary-600 font-medium">Tap for details · collect rent · sell</p>
        </div>
      </button>

      {detailOpen && (
        <LandPropertyDetailModal
          parcel={parcel}
          onClose={() => setDetailOpen(false)}
          onUpdated={() => {
            onUpdated();
          }}
        />
      )}
    </>
  );
};

export default LandPropertyCard;
