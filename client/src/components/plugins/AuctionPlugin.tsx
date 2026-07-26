import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { auctionApi, landApi } from '../../services/api';
import { AuctionBid, AuctionBidIncrement, AuctionItem } from '../../types';
import { COMMUNITY_AUCTION_GRID_CODE } from '../land/communityPlot';
import { Gavel, Loader2, Radio } from 'lucide-react';
import { ResponsivePage, ResponsivePluginHero, LoadingState, EmptyState } from '../responsive';

const TOWN_CLASSES = ['6A', '6B', '6C'] as const;
const BID_INCREMENTS: AuctionBidIncrement[] = [1000, 5000, 10000, 50000];

const formatMoney = (n: number) =>
  `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const AuctionPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const plugin = plugins.find((p) => p.route_path === '/auction');
  const isTeacher = user?.role === 'teacher';

  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [selectedLiveId, setSelectedLiveId] = useState<number | null>(null);
  const [liveBids, setLiveBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherClass, setTeacherClass] = useState<string>('6A');
  const [actionId, setActionId] = useState<number | null>(null);
  const [biddingIncrement, setBiddingIncrement] = useState<AuctionBidIncrement | null>(null);

  const [createName, setCreateName] = useState('');
  const [createPrice, setCreatePrice] = useState('500000');
  const [creating, setCreating] = useState(false);
  const [transferringId, setTransferringId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setError('');
      const res = isTeacher
        ? await auctionApi.list({ class: teacherClass })
        : await auctionApi.list();
      setAuctions(res.data.auctions || []);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load auctions'
      );
    } finally {
      setLoading(false);
    }
  }, [isTeacher, teacherClass]);

  const fetchLiveDetail = useCallback(async (id: number) => {
    try {
      const res = await auctionApi.get(id);
      setLiveBids(res.data.bids || []);
      setAuctions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...res.data.auction } : a))
      );
    } catch {
      /* list poll will surface errors */
    }
  }, []);

  useEffect(() => {
    if (!plugin?.enabled) return;
    setLoading(true);
    fetchList();
    const interval = setInterval(fetchList, 10000);
    return () => clearInterval(interval);
  }, [plugin?.enabled, fetchList]);

  const liveId = auctions.find((a) => a.status === 'live')?.id ?? null;

  useEffect(() => {
    if (!liveId) {
      setSelectedLiveId(null);
      setLiveBids([]);
      return;
    }
    setSelectedLiveId(liveId);
    fetchLiveDetail(liveId);
    const interval = setInterval(() => fetchLiveDetail(liveId), 10000);
    return () => clearInterval(interval);
  }, [liveId, fetchLiveDetail]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      await auctionApi.create({
        name: createName.trim(),
        starting_price: Number(createPrice),
        town_class: teacherClass,
      });
      setCreateName('');
      setSuccess('Auction draft created');
      await fetchList();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to create auction'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleGoLive = async (id: number) => {
    try {
      setActionId(id);
      setError('');
      await auctionApi.goLive(id);
      setSuccess('Auction is live — students can bid');
      await fetchList();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to go live'
      );
    } finally {
      setActionId(null);
    }
  };

  const handleEnd = async (id: number) => {
    if (!window.confirm('End this auction and lock in the highest bidder as winner?')) return;
    try {
      setActionId(id);
      setError('');
      await auctionApi.end(id);
      setSuccess('Auction ended. Winner recorded (no money deducted).');
      await fetchList();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to end auction'
      );
    } finally {
      setActionId(null);
    }
  };

  const handleBid = async (auctionId: number, increment: AuctionBidIncrement) => {
    try {
      setBiddingIncrement(increment);
      setError('');
      await auctionApi.bid(auctionId, increment);
      setSuccess(`Bid placed (+${formatMoney(increment)})`);
      await fetchList();
      await fetchLiveDetail(auctionId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to place bid'
      );
    } finally {
      setBiddingIncrement(null);
    }
  };

  const handleTransferI6ToWinner = async (auction: AuctionItem) => {
    if (!auction.winner_user_id) return;
    try {
      setTransferringId(auction.id);
      setError('');
      const parcelRes = await landApi.getParcel(
        COMMUNITY_AUCTION_GRID_CODE,
        auction.town_class
      );
      const i6 = parcelRes.data;
      if (!i6?.id) {
        setError(`Plot ${COMMUNITY_AUCTION_GRID_CODE} not found for town ${auction.town_class}`);
        return;
      }
      await landApi.assignParcelOwner(i6.id, auction.winner_user_id);
      setSuccess(
        `Transferred ${COMMUNITY_AUCTION_GRID_CODE} to @${auction.winner_username || 'winner'} (no charge)`
      );
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to transfer I6 ownership'
      );
    } finally {
      setTransferringId(null);
    }
  };

  if (pluginsLoading) {
    return <LoadingState />;
  }

  if (!plugin || !plugin.enabled) {
    return <Navigate to="/" replace />;
  }

  const drafts = auctions.filter((a) => a.status === 'draft');
  const live = auctions.filter((a) => a.status === 'live');
  const ended = auctions.filter((a) => a.status === 'ended');
  const liveAuction = live[0] || null;

  return (
    <ResponsivePage>
      <ResponsivePluginHero
        title="Auction"
        subtitle="Live class auctions — soft bids, teacher ends and awards the prize"
        emoji="🔨"
        gradientClass="bg-gradient-to-r from-amber-600 to-orange-700 text-white"
      />

      {isTeacher && (
        <div className="flex flex-wrap gap-2">
          {TOWN_CLASSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setTeacherClass(c);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                teacherClass === c
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Town {c}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">{success}</div>
      )}

      {isTeacher && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <h2 className="font-semibold text-gray-900">Create auction item</h2>
          <p className="text-sm text-gray-600">
            Draft for town {teacherClass}. Students bid only after you Go live. Ending records the
            winner — no money is deducted.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="input-field"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Community plot I6"
                required
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting price</label>
              <input
                className="input-field"
                type="number"
                min={0}
                step={1}
                value={createPrice}
                onChange={(e) => setCreatePrice(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={creating || !createName.trim()} className="btn-primary">
            {creating ? 'Creating…' : 'Create draft'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          {/* Live */}
          <section>
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Radio className="h-5 w-5 text-amber-600" />
              Live auction
            </h2>
            {!liveAuction ? (
              <EmptyState
                icon={Gavel}
                title="No live auction"
                description={
                  isTeacher
                    ? 'Create a draft and click Go live when the class is ready.'
                    : 'Your teacher has not started a live auction for your town yet.'
                }
              />
            ) : (
              <LiveAuctionCard
                auction={liveAuction}
                bids={selectedLiveId === liveAuction.id ? liveBids : []}
                isTeacher={isTeacher}
                userId={user?.id}
                actionId={actionId}
                biddingIncrement={biddingIncrement}
                onEnd={handleEnd}
                onBid={handleBid}
              />
            )}
          </section>

          {isTeacher && drafts.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-3">Drafts</h2>
              <div className="space-y-3">
                {drafts.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{a.name}</h3>
                      <p className="text-sm text-gray-600">
                        Starting {formatMoney(a.starting_price)} · Town {a.town_class}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={actionId === a.id}
                      onClick={() => handleGoLive(a.id)}
                      className="btn-primary bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    >
                      {actionId === a.id ? 'Going live…' : 'Go live'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-3">Ended</h2>
              <div className="space-y-3">
                {ended.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{a.name}</h3>
                      <p className="text-sm text-gray-600">
                        {a.winner_username
                          ? `Winner: @${a.winner_username} at ${formatMoney(Number(a.winning_bid || 0))}`
                          : 'No bids — no winner'}
                        {' · '}Town {a.town_class}
                      </p>
                    </div>
                    {isTeacher && a.winner_user_id && (
                      <button
                        type="button"
                        disabled={transferringId === a.id}
                        onClick={() => handleTransferI6ToWinner(a)}
                        className="btn-secondary text-sm inline-flex items-center gap-2"
                      >
                        {transferringId === a.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Transfer I6 to winner
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </ResponsivePage>
  );
};

const LiveAuctionCard: React.FC<{
  auction: AuctionItem;
  bids: AuctionBid[];
  isTeacher: boolean;
  userId?: number;
  actionId: number | null;
  biddingIncrement: AuctionBidIncrement | null;
  onEnd: (id: number) => void;
  onBid: (id: number, increment: AuctionBidIncrement) => void;
}> = ({ auction, bids, isTeacher, userId, actionId, biddingIncrement, onEnd, onBid }) => {
  const displayHigh = auction.current_high_bid ?? auction.starting_price;
  const isHighest = auction.current_high_bidder_user_id === userId;

  return (
    <div className="bg-white rounded-xl border-2 border-amber-300 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{auction.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              LIVE
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Starting {formatMoney(auction.starting_price)} · Town {auction.town_class}
          </p>
          <p className="text-xl font-bold text-amber-800 mt-2">
            Current high: {formatMoney(Number(displayHigh))}
            {auction.current_high_bidder_username
              ? ` (@${auction.current_high_bidder_username})`
              : ' (no bids yet)'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Refreshes every 10 seconds · Soft bid (no money held)</p>
        </div>
        {isTeacher && (
          <button
            type="button"
            disabled={actionId === auction.id}
            onClick={() => onEnd(auction.id)}
            className="btn-secondary text-sm"
          >
            {actionId === auction.id ? 'Ending…' : 'End auction'}
          </button>
        )}
      </div>

      {!isTeacher && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Place a bid (add to current high)</p>
          {isHighest ? (
            <p className="text-sm text-green-700 font-medium">You are the highest bidder</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {BID_INCREMENTS.map((inc) => (
                <button
                  key={inc}
                  type="button"
                  disabled={biddingIncrement !== null}
                  onClick={() => onBid(auction.id, inc)}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {biddingIncrement === inc ? 'Bidding…' : `+${formatMoney(inc)}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {bids.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent bids</h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
            {bids.slice(0, 15).map((b) => (
              <li key={b.id} className="flex justify-between text-gray-600 border-b border-gray-50 py-1">
                <span>@{b.username}</span>
                <span className="font-medium text-gray-900">{formatMoney(b.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AuctionPlugin;
