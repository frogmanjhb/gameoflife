import React, { useEffect, useMemo, useState } from 'react';
import { LandParcel } from '../../types';
import { landApi } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  BIOME_CONFIG,
  BIOME_ICONS,
  RISK_COLORS,
  formatCurrency,
} from './BiomeConfig';
import {
  isCommunityAuctionPlot,
  HIDDEN_AUCTION_PRICE_LABEL,
  COMMUNITY_AUCTION_DESCRIPTION,
} from './communityPlot';
import TeacherParcelAssignPanel, { ClassStudentOption } from './TeacherParcelAssignPanel';
import {
  X,
  MapPin,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  User,
  Clock,
  TrendingUp,
  Gavel,
  Sparkles,
  DollarSign,
  Loader2,
  Tag,
  ShoppingCart,
  Percent,
} from 'lucide-react';

interface Classmate {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface LandPropertyDetailModalProps {
  parcel: LandParcel;
  onClose: () => void;
  onUpdated?: () => void;
  canManageOwnership?: boolean;
  classStudents?: ClassStudentOption[];
  showPurchaseAction?: boolean;
  onRequestPurchase?: () => void;
}

const LandPropertyDetailModal: React.FC<LandPropertyDetailModalProps> = ({
  parcel,
  onClose,
  onUpdated,
  canManageOwnership = false,
  classStudents = [],
  showPurchaseAction = false,
  onRequestPurchase,
}) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isOwner = user?.id != null && parcel.owner_id === user.id;

  const isAuctionPlot = isCommunityAuctionPlot(parcel);
  const biomeConfig = BIOME_CONFIG[parcel.biome_type] ?? BIOME_CONFIG.Grassland;
  const riskColors = RISK_COLORS[parcel.risk_level];
  const biomeIcon = isAuctionPlot ? '🏛️' : BIOME_ICONS[parcel.biome_type];

  const listPrice = Number(parcel.value);
  const currentValue = parcel.current_value ?? listPrice;
  const purchasePrice = parcel.purchase_price ?? listPrice;
  const appreciation = parcel.appreciation ?? (parcel.owner_id ? currentValue - purchasePrice : 0);
  const weeksSincePurchase = parcel.weeks_owned ?? 0;
  const rentalYieldPercent = parcel.rental_yield_percent ?? 5;

  const weeklyRent = Number(parcel.weekly_rent) || 0;
  const rentWeeksDue = parcel.rent_weeks_due ?? (parcel.can_collect_rent ? 1 : 0);
  const collectAmount =
    parcel.accrued_rent ?? (rentWeeksDue > 0 ? weeklyRent * rentWeeksDue : weeklyRent);

  const ownerName =
    parcel.owner_first_name && parcel.owner_last_name
      ? `${parcel.owner_first_name} ${parcel.owner_last_name}`
      : parcel.owner_username || 'Unknown';

  const pros = isAuctionPlot ? parcel.pros : parcel.pros || biomeConfig.pros;
  const cons = isAuctionPlot ? parcel.cons : parcel.cons || biomeConfig.cons;

  const headerBg = isAuctionPlot
    ? 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)'
    : biomeConfig.color;

  const [rentLoading, setRentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [yieldInput, setYieldInput] = useState(String(rentalYieldPercent));
  const [yieldSaving, setYieldSaving] = useState(false);
  const [yieldSuccess, setYieldSuccess] = useState('');

  const [sellOpen, setSellOpen] = useState(false);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [classmatesLoading, setClassmatesLoading] = useState(false);
  const [buyerId, setBuyerId] = useState('');
  const [salePrice, setSalePrice] = useState(String(currentValue));
  const [sellLoading, setSellLoading] = useState(false);

  useEffect(() => {
    setYieldInput(String(parcel.rental_yield_percent ?? 5));
  }, [parcel.id, parcel.rental_yield_percent]);

  const canEditYield = isTeacher;

  const handleCollectRent = async () => {
    setRentLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await landApi.collectRent(parcel.id);
      setSuccess(`Collected ${formatCurrency(res.data.amount)} rental income`);
      onUpdated?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to collect rent');
    } finally {
      setRentLoading(false);
    }
  };

  const handleSaveYield = async () => {
    const parsed = parseFloat(yieldInput);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setError('Enter a rental yield between 0 and 100');
      return;
    }
    setYieldSaving(true);
    setError('');
    setYieldSuccess('');
    try {
      await landApi.updateParcelRentalYield(parcel.id, parsed);
      setYieldSuccess('Rental yield saved');
      onUpdated?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update rental yield');
    } finally {
      setYieldSaving(false);
    }
  };

  const openSellForm = async () => {
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
      const res = await landApi.createSaleRequest(parcel.id, parseInt(buyerId, 10), parseFloat(salePrice));
      setSuccess(res.data.message || 'Sale request submitted');
      setSellOpen(false);
      onUpdated?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create sale request');
    } finally {
      setSellLoading(false);
    }
  };

  const economySummary = useMemo(() => {
    if (!parcel.owner_id) return null;
    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block">Purchase price</span>
          <span className="font-semibold text-gray-900">{formatCurrency(purchasePrice)}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block">Current value</span>
          <span className="font-semibold text-gray-900">{formatCurrency(currentValue)}</span>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <span className="text-xs text-green-700 block">
            Weekly rent ({rentalYieldPercent}%)
          </span>
          <span className="font-semibold text-green-800">
            {rentWeeksDue > 1 ? formatCurrency(collectAmount) : formatCurrency(weeklyRent)}
            {rentWeeksDue > 1 ? ` (${rentWeeksDue} wks due)` : ''}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500 block">Appreciation</span>
          <span className={`font-semibold ${appreciation > 0 ? 'text-green-700' : 'text-gray-800'}`}>
            {appreciation > 0 ? `+${formatCurrency(appreciation)}` : formatCurrency(0)}
          </span>
        </div>
      </div>
    );
  }, [
    parcel.owner_id,
    purchasePrice,
    currentValue,
    rentalYieldPercent,
    weeklyRent,
    rentWeeksDue,
    collectAmount,
    appreciation,
  ]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-white relative shrink-0" style={{ background: headerBg }}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{biomeIcon}</span>
              <div>
                <h2 className="text-xl font-bold">{parcel.grid_code}</h2>
                <p className="text-sm opacity-90">
                  {isAuctionPlot ? 'Class auction plot' : parcel.biome_type}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isAuctionPlot && !parcel.owner_id ? (
                <p className="text-lg font-bold tracking-widest">{HIDDEN_AUCTION_PRICE_LABEL}</p>
              ) : parcel.owner_id && appreciation > 0 ? (
                <>
                  <p className="text-lg font-bold">{formatCurrency(currentValue)}</p>
                  <div className="flex items-center justify-end gap-1 text-green-100 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    +{formatCurrency(appreciation)}
                  </div>
                </>
              ) : (
                <p className="text-lg font-bold">
                  {isAuctionPlot ? HIDDEN_AUCTION_PRICE_LABEL : formatCurrency(listPrice)}
                </p>
              )}
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  parcel.owner_id ? 'bg-red-500/30' : isAuctionPlot ? 'bg-black/20' : 'bg-green-500/30'
                }`}
              >
                {parcel.owner_id ? 'Owned' : isAuctionPlot ? 'Auction only' : 'Available'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {(error || success || yieldSuccess) && (
            <div className="space-y-2">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}
              {yieldSuccess && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{yieldSuccess}</p>
              )}
            </div>
          )}

          {isAuctionPlot && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <Gavel className="h-4 w-4 shrink-0" />
                <span>Secret community building site</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">{COMMUNITY_AUCTION_DESCRIPTION}</p>
              <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Most valuable plot · Price revealed at class auction</span>
              </div>
            </div>
          )}

          {!isAuctionPlot && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className={`h-4 w-4 ${riskColors.text}`} />
              <span>Risk:</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${riskColors.bg} ${riskColors.text} font-medium capitalize`}
              >
                {parcel.risk_level}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              Row {parcel.row_index + 1}, Col {parcel.col_index + 1} · Town {parcel.town_class}
            </span>
          </div>

          {parcel.owner_id && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Owner:</span>
                <span className="font-medium">{ownerName}</span>
              </div>
              {parcel.purchased_at && (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Purchased:</span>
                    <span>{new Date(parcel.purchased_at).toLocaleDateString()}</span>
                  </div>
                  {!isAuctionPlot && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>
                        {weeksSincePurchase} {weeksSincePurchase === 1 ? 'week' : 'weeks'} owned · +1% value/week
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {economySummary}

          {(canEditYield || (parcel.owner_id && !canEditYield)) && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Percent className="h-4 w-4 text-primary-600" />
                Weekly rental income rate
              </div>
              {canEditYield ? (
                <>
                  <p className="text-xs text-gray-500">
                    Percent of the plot&apos;s current value paid as rent each week (default 5%).
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={yieldInput}
                      onChange={(e) => setYieldInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <button
                      type="button"
                      onClick={handleSaveYield}
                      disabled={yieldSaving}
                      className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                    >
                      {yieldSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-700">{rentalYieldPercent}% of current value per week</p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1 mb-2">
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
            <div className="flex items-center gap-1 mb-2">
              <ThumbsDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Disadvantages</span>
            </div>
            <ul className="space-y-1">
              {cons.map((con, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start">
                  <span className="text-red-500 mr-1">−</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>

          {canManageOwnership && isTeacher && (
            <TeacherParcelAssignPanel
              embedded
              parcel={parcel}
              students={classStudents}
              onUpdated={() => onUpdated?.()}
              onClose={onClose}
            />
          )}

          {isOwner && !sellOpen && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCollectRent}
                disabled={rentLoading || !parcel.can_collect_rent}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-1 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {rentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                {parcel.can_collect_rent
                  ? rentWeeksDue > 1
                    ? `Collect ${formatCurrency(collectAmount)}`
                    : 'Collect rent'
                  : 'Rent collected'}
              </button>
              <button
                type="button"
                onClick={openSellForm}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-1 px-3 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                <Tag className="h-4 w-4" />
                Sell to student
              </button>
            </div>
          )}

          {isOwner && sellOpen && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Sell to classmate</h4>
              <p className="text-xs text-gray-600">
                Financial Manager approval may be required. Current value: {formatCurrency(currentValue)}.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
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
                        {c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : c.username} (@
                        {c.username})
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSellOpen(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSale}
                  disabled={sellLoading}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {sellLoading ? 'Submitting…' : 'Submit sale'}
                </button>
              </div>
            </div>
          )}

          {showPurchaseAction && !parcel.owner_id && !isAuctionPlot && onRequestPurchase && (
            <button
              type="button"
              onClick={onRequestPurchase}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
            >
              <ShoppingCart className="h-5 w-5" />
              Purchase this plot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandPropertyDetailModal;
