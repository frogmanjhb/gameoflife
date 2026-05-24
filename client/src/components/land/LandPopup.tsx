import React from 'react';
import { LandParcel } from '../../types';
import { BIOME_CONFIG, RISK_COLORS, formatCurrency, BIOME_ICONS } from './BiomeConfig';
import {
  isCommunityAuctionPlot,
  HIDDEN_AUCTION_PRICE_LABEL,
  COMMUNITY_AUCTION_DESCRIPTION,
} from './communityPlot';
import { MapPin, AlertTriangle, ThumbsUp, ThumbsDown, User, Clock, TrendingUp, Gavel, Sparkles } from 'lucide-react';

interface LandPopupProps {
  parcel: LandParcel;
  position: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
}

const LandPopup: React.FC<LandPopupProps> = ({ parcel, position, containerRef }) => {
  const isAuctionPlot = isCommunityAuctionPlot(parcel);
  const biomeConfig = BIOME_CONFIG[parcel.biome_type];
  const riskColors = RISK_COLORS[parcel.risk_level];
  const biomeIcon = isAuctionPlot ? '🏛️' : BIOME_ICONS[parcel.biome_type];

  const listPrice = Number(parcel.value);
  const currentValue = parcel.current_value ?? listPrice;
  const purchasePrice = parcel.purchase_price ?? listPrice;
  const appreciation = parcel.appreciation ?? (parcel.owner_id ? currentValue - purchasePrice : 0);
  const weeksSincePurchase = parcel.weeks_owned ?? 0;

  const ownerName = parcel.owner_first_name && parcel.owner_last_name
    ? `${parcel.owner_first_name} ${parcel.owner_last_name}`
    : parcel.owner_username || 'Unknown';

  const popupWidth = 320;
  const popupHeight = isAuctionPlot ? 440 : 400;
  const padding = 10;

  let left = position.x + 15;
  let top = position.y + 15;

  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    if (left + popupWidth > rect.right - padding) {
      left = position.x - popupWidth - 15;
    }
    if (top + popupHeight > rect.bottom - padding) {
      top = position.y - popupHeight - 15;
    }
    left = Math.max(rect.left + padding, left);
    top = Math.max(rect.top + padding, top);
  }

  const headerBg = isAuctionPlot
    ? 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)'
    : biomeConfig.color;

  const pros = isAuctionPlot ? parcel.pros : (parcel.pros || biomeConfig.pros);
  const cons = isAuctionPlot ? parcel.cons : (parcel.cons || biomeConfig.cons);

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${popupWidth}px`,
        maxHeight: `${popupHeight}px`,
      }}
    >
      <div className="p-4 text-white" style={{ background: headerBg }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{biomeIcon}</span>
            <div>
              <h3 className="font-bold text-lg">{parcel.grid_code}</h3>
              <p className="text-sm opacity-90">
                {isAuctionPlot ? 'Class auction plot' : parcel.biome_type}
              </p>
            </div>
          </div>
          <div className="text-right">
            {isAuctionPlot && !parcel.owner_id ? (
              <p className="text-2xl font-bold tracking-widest">{HIDDEN_AUCTION_PRICE_LABEL}</p>
            ) : parcel.owner_id && appreciation > 0 ? (
              <>
                <p className="text-xl font-bold">{formatCurrency(currentValue)}</p>
                <div className="flex items-center justify-end space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-300" />
                  <span className="text-xs text-green-300">+{formatCurrency(appreciation)}</span>
                </div>
              </>
            ) : (
              <p className="text-xl font-bold">
                {isAuctionPlot ? HIDDEN_AUCTION_PRICE_LABEL : formatCurrency(listPrice)}
              </p>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              parcel.owner_id ? 'bg-red-500/30' : isAuctionPlot ? 'bg-black/20' : 'bg-green-500/30'
            }`}>
              {parcel.owner_id ? 'Owned' : isAuctionPlot ? 'Auction only' : 'Available'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
        {isAuctionPlot && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <Gavel className="h-4 w-4 flex-shrink-0" />
              <span>Secret community building site</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">{COMMUNITY_AUCTION_DESCRIPTION}</p>
            <div className="flex items-center gap-2 text-xs text-amber-800 font-medium pt-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Most valuable plot in the game · Price revealed at class auction</span>
            </div>
          </div>
        )}

        {!isAuctionPlot && (
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-4 w-4 ${riskColors.text}`} />
            <span className="text-sm text-gray-600">Risk Level:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors.bg} ${riskColors.text} font-medium capitalize`}>
              {parcel.risk_level}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Grid Position: Row {parcel.row_index + 1}, Col {parcel.col_index + 1}</span>
        </div>

        {parcel.owner_id && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium">{ownerName}</span>
            </div>
            {parcel.purchased_at && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Purchased:</span>
                  <span>{new Date(parcel.purchased_at).toLocaleDateString()}</span>
                </div>
                {!isAuctionPlot && (
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Ownership:</span>
                    <span>{weeksSincePurchase} {weeksSincePurchase === 1 ? 'week' : 'weeks'} (+1% value per week)</span>
                  </div>
                )}
                {appreciation > 0 && !isAuctionPlot && (
                  <div className="bg-green-50 rounded p-2 mt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Purchase price:</span>
                      <span>{formatCurrency(purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-green-700">
                      <span>Current Value:</span>
                      <span>{formatCurrency(currentValue)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center space-x-1 mb-2">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Advantages</span>
          </div>
          <ul className="space-y-1">
            {pros.map((pro, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <span className="text-green-500 mr-1">+</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-1 mb-2">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Disadvantages</span>
          </div>
          <ul className="space-y-1">
            {cons.map((con, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <span className="text-red-500 mr-1">-</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {parcel.owner_id
            ? `This plot is owned by ${ownerName}`
            : isAuctionPlot
              ? 'Reserved for the class auction — not available for direct purchase'
              : 'Click to purchase this plot'}
        </p>
      </div>
    </div>
  );
};

export default LandPopup;
