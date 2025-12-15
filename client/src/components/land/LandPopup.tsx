import React from 'react';
import { LandParcel } from '../../types';
import { BIOME_CONFIG, RISK_COLORS, formatCurrency, BIOME_ICONS, calculateCurrentValue, getWeeksSincePurchase } from './BiomeConfig';
import { MapPin, AlertTriangle, ThumbsUp, ThumbsDown, User, Clock, TrendingUp } from 'lucide-react';

interface LandPopupProps {
  parcel: LandParcel;
  position: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
}

const LandPopup: React.FC<LandPopupProps> = ({ parcel, position, containerRef }) => {
  const biomeConfig = BIOME_CONFIG[parcel.biome_type];
  const riskColors = RISK_COLORS[parcel.risk_level];
  const biomeIcon = BIOME_ICONS[parcel.biome_type];
  
  // Calculate current value with 2% weekly interest for owned plots
  const originalValue = Number(parcel.value);
  const weeksSincePurchase = parcel.purchased_at ? getWeeksSincePurchase(parcel.purchased_at) : 0;
  const currentValue = parcel.owner_id && parcel.purchased_at 
    ? calculateCurrentValue(originalValue, parcel.purchased_at)
    : originalValue;
  const appreciation = currentValue - originalValue;
  
  // Get owner display name
  const ownerName = parcel.owner_first_name && parcel.owner_last_name 
    ? `${parcel.owner_first_name} ${parcel.owner_last_name}`
    : parcel.owner_username || 'Unknown';
  
  // Calculate popup position to keep it within viewport
  const popupWidth = 320;
  const popupHeight = 400;
  const padding = 10;
  
  let left = position.x + 15;
  let top = position.y + 15;
  
  // Get container bounds if available
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    
    // Adjust if popup would go off the right edge
    if (left + popupWidth > rect.right - padding) {
      left = position.x - popupWidth - 15;
    }
    
    // Adjust if popup would go off the bottom edge
    if (top + popupHeight > rect.bottom - padding) {
      top = position.y - popupHeight - 15;
    }
    
    // Ensure minimum bounds
    left = Math.max(rect.left + padding, left);
    top = Math.max(rect.top + padding, top);
  }

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{ 
        left: `${left}px`, 
        top: `${top}px`,
        width: `${popupWidth}px`,
        maxHeight: `${popupHeight}px`
      }}
    >
      {/* Header with biome color */}
      <div 
        className="p-4 text-white"
        style={{ backgroundColor: biomeConfig.color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{biomeIcon}</span>
            <div>
              <h3 className="font-bold text-lg">{parcel.grid_code}</h3>
              <p className="text-sm opacity-90">{parcel.biome_type}</p>
            </div>
          </div>
          <div className="text-right">
            {parcel.owner_id && appreciation > 0 ? (
              <>
                <p className="text-xl font-bold">{formatCurrency(currentValue)}</p>
                <div className="flex items-center justify-end space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-300" />
                  <span className="text-xs text-green-300">+{formatCurrency(appreciation)}</span>
                </div>
              </>
            ) : (
              <p className="text-xl font-bold">{formatCurrency(originalValue)}</p>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              parcel.owner_id ? 'bg-red-500/30' : 'bg-green-500/30'
            }`}>
              {parcel.owner_id ? 'Owned' : 'Available'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {/* Risk Level */}
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`h-4 w-4 ${riskColors.text}`} />
          <span className="text-sm text-gray-600">Risk Level:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors.bg} ${riskColors.text} font-medium capitalize`}>
            {parcel.risk_level}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Grid Position: Row {parcel.row_index + 1}, Col {parcel.col_index + 1}</span>
        </div>

        {/* Owner Info */}
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
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">Ownership:</span>
                  <span>{weeksSincePurchase} {weeksSincePurchase === 1 ? 'week' : 'weeks'} (2% weekly interest)</span>
                </div>
                {appreciation > 0 && (
                  <div className="bg-green-50 rounded p-2 mt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Original Value:</span>
                      <span>{formatCurrency(originalValue)}</span>
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

        {/* Pros */}
        <div>
          <div className="flex items-center space-x-1 mb-2">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Advantages</span>
          </div>
          <ul className="space-y-1">
            {(parcel.pros || biomeConfig.pros).map((pro, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <span className="text-green-500 mr-1">+</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div>
          <div className="flex items-center space-x-1 mb-2">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Disadvantages</span>
          </div>
          <ul className="space-y-1">
            {(parcel.cons || biomeConfig.cons).map((con, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start">
                <span className="text-red-500 mr-1">-</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {parcel.owner_id 
            ? `This plot is already owned by ${ownerName}` 
            : 'Click to purchase this plot'}
        </p>
      </div>
    </div>
  );
};

export default LandPopup;

