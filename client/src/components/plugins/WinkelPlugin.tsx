import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  ShoppingBag, Loader2, AlertCircle, CheckCircle, XCircle, 
  Clock, Gift, Sparkles, ShoppingCart, History, TrendingUp,
  DollarSign, Package, Star
} from 'lucide-react';
import api from '../../services/api';

interface ShopItem {
  id: number;
  name: string;
  category: 'consumable' | 'privilege' | 'profile';
  price: number;
  description: string | null;
  notes: string | null;
  available: boolean;
  event_day_only: boolean;
}

interface Purchase {
  id: number;
  item_id: number;
  item_name: string;
  item_category: string;
  item_description: string | null;
  price_paid: number;
  purchase_date: string;
  week_start_date: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  class?: string;
}

const WinkelPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const winkelPlugin = plugins.find(p => p.route_path === '/winkel');

  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPurchase, setCanPurchase] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'shop' | 'history' | 'stats'>('shop');
  const [shopCategoryTab, setShopCategoryTab] = useState<'consumables' | 'privileges' | 'profile'>('consumables');
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [ownedEmojis, setOwnedEmojis] = useState<any[]>([]);
  const [weeklyLimit, setWeeklyLimit] = useState(1);
  const [purchasesThisWeek, setPurchasesThisWeek] = useState(0);
  const [remainingPurchases, setRemainingPurchases] = useState(1);

  useEffect(() => {
    if (winkelPlugin && winkelPlugin.enabled) {
      fetchData();
    }
  }, [winkelPlugin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, purchasesRes, canPurchaseRes, accountRes, ownedEmojisRes] = await Promise.all([
        api.get('/winkel/items'),
        api.get('/winkel/purchases'),
        user?.role === 'student' ? api.get('/winkel/can-purchase') : Promise.resolve({ data: { canPurchase: true, weeklyLimit: 1, purchasesThisWeek: 0, remainingPurchases: 1 } }),
        user?.role === 'student' ? api.get('/transactions/history').then(() => {
          // Get account balance from auth context or separate call
          return api.get('/transactions/history').then(() => {
            // We'll get balance from the user context or make a separate call
            return Promise.resolve({ data: null });
          });
        }) : Promise.resolve({ data: null }),
        user?.role === 'student' ? api.get('/winkel/owned-emojis') : Promise.resolve({ data: [] })
      ]);

      // Convert prices to numbers (PostgreSQL returns DECIMAL as strings)
      const itemsWithNumericPrices = itemsRes.data.map((item: any) => ({
        ...item,
        price: parseFloat(item.price) || 0
      }));
      const purchasesWithNumericPrices = purchasesRes.data.map((purchase: any) => ({
        ...purchase,
        price_paid: parseFloat(purchase.price_paid) || 0
      }));
      
      setItems(itemsWithNumericPrices);
      setPurchases(purchasesWithNumericPrices);
      setCanPurchase(canPurchaseRes.data.canPurchase);
      setWeeklyLimit(canPurchaseRes.data.weeklyLimit || 1);
      setPurchasesThisWeek(canPurchaseRes.data.purchasesThisWeek || 0);
      setRemainingPurchases(canPurchaseRes.data.remainingPurchases || 0);
      setOwnedEmojis(ownedEmojisRes.data || []);

      // Get account balance for students
      if (user?.role === 'student') {
        try {
          const transactions = await api.get('/transactions/history');
          // Calculate balance from transactions or get from account
          // For now, we'll fetch it separately if needed
        } catch (err) {
          console.error('Failed to fetch balance:', err);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shop data:', error);
      setError('Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: number) => {
    try {
      setPurchasing(itemId);
      setError('');
      setSuccess('');

      const response = await api.post('/winkel/purchase', { item_id: itemId });
      
      setSuccess(response.data.message || 'Purchase successful!');
      
      // Refresh data to update remaining purchases count
      await fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to make purchase');
      setTimeout(() => setError(''), 5000);
    } finally {
      setPurchasing(null);
    }
  };

  const consumables = items.filter(item => item.category === 'consumable');
  const privileges = items.filter(item => item.category === 'privilege');
  const profileItems = items.filter(item => item.category === 'profile');

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!winkelPlugin || !winkelPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  if (user?.role === 'teacher') {
    return <TeacherWinkelView purchases={purchases} items={items} loading={loading} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-full p-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">The Winkel</h1>
              <p className="text-orange-100">
                You may make {weeklyLimit} purchase{weeklyLimit !== 1 ? 's' : ''} per week
              </p>
            </div>
          </div>
          <div className="text-right">
            {canPurchase ? (
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="font-semibold">{remainingPurchases} purchase{remainingPurchases !== 1 ? 's' : ''} remaining</p>
                <p className="text-xs text-orange-100">{purchasesThisWeek} of {weeklyLimit} used this week</p>
              </div>
            ) : (
              <div className="bg-white/20 rounded-lg px-4 py-2 flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Come back next week!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'shop'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Shop</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'history'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <History className="h-5 w-5" />
              <span>My Purchases</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'shop' && (
            <div className="space-y-6">
              {/* Purchase Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
                <span className="text-2xl">📦</span>
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">Claim your purchases</span> during I&D or Inquiry lessons.
                </p>
              </div>

              {!canPurchase && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-amber-800 font-semibold">
                    ⏰ {weeklyLimit === 1 
                      ? "You've already made your weekly purchase!" 
                      : `You've reached your limit of ${weeklyLimit} purchases this week!`} Come back next week for more shopping.
                  </p>
                </div>
              )}

              {/* Category Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setShopCategoryTab('consumables')}
                  className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                    shopCategoryTab === 'consumables'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Gift className="h-5 w-5" />
                    <span>🍬 Consumables</span>
                    <span className="text-xs text-gray-500">(Impulse Spending)</span>
                  </div>
                </button>
                <button
                  onClick={() => setShopCategoryTab('privileges')}
                  className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                    shopCategoryTab === 'privileges'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>⏱️ Time & Privileges</span>
                    <span className="text-xs text-gray-500">(Very Powerful)</span>
                  </div>
                </button>
                <button
                  onClick={() => setShopCategoryTab('profile')}
                  className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                    shopCategoryTab === 'profile'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl">😎</span>
                    <span>Profile Emojis</span>
                    <span className="text-xs text-gray-500">(Permanent)</span>
                  </div>
                </button>
              </div>

              {/* Consumables Tab Content */}
              {shopCategoryTab === 'consumables' && (
                <div>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      These items drain money without long-term advantage. Perfect for impulse spending!
                    </p>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                  ) : consumables.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Gift className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No consumables available at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {consumables.map((item) => (
                        <ShopItemCard
                          key={item.id}
                          item={item}
                          onPurchase={handlePurchase}
                          canPurchase={canPurchase}
                          purchasing={purchasing === item.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Privileges Tab Content */}
              {shopCategoryTab === 'privileges' && (
                <div>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      Time is the most valuable currency in class. These privileges give you comfort and freedom!
                    </p>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                  ) : privileges.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No privileges available at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {privileges.map((item) => (
                        <ShopItemCard
                          key={item.id}
                          item={item}
                          onPurchase={handlePurchase}
                          canPurchase={canPurchase}
                          purchasing={purchasing === item.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Emojis Tab Content */}
              {shopCategoryTab === 'profile' && (
                <div>
                  <div className="mb-6">
                    <p className="text-gray-600 mb-3">
                      Customize your profile with a fun emoji! These are permanent and you can switch between owned emojis anytime.
                    </p>
                    {ownedEmojis.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Your Owned Emojis:</p>
                        <div className="flex flex-wrap gap-2">
                          {ownedEmojis.map((emoji: any) => {
                            const emojiChar = emoji.name.match(/^([\u{1F300}-\u{1F9FF}])/u)?.[1];
                            return (
                              <button
                                key={emoji.id}
                                onClick={async () => {
                                  try {
                                    await api.post('/winkel/change-emoji', { item_id: emoji.id });
                                    setSuccess('Profile emoji changed!');
                                    setTimeout(() => setSuccess(''), 3000);
                                    // Refresh to update user context
                                    window.location.reload();
                                  } catch (err: any) {
                                    setError(err.response?.data?.error || 'Failed to change emoji');
                                  }
                                }}
                                className="text-3xl p-2 hover:scale-110 transition-transform bg-white rounded-lg border-2 border-blue-300 hover:border-blue-500"
                                title="Click to use this emoji"
                              >
                                {emojiChar}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-blue-700 mt-2">Click any emoji to use it on your profile</p>
                      </div>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                  ) : profileItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <span className="text-6xl mb-4 block">😎</span>
                      <p>No profile emojis available at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {profileItems.map((item) => {
                        const emojiChar = item.name.match(/^([\u{1F300}-\u{1F9FF}])/u)?.[1];
                        const isOwned = ownedEmojis.some((e: any) => e.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`bg-white rounded-xl shadow-sm border-2 p-4 text-center transition-all ${
                              isOwned
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                            }`}
                          >
                            <div className="text-5xl mb-3">{emojiChar}</div>
                            <p className="font-semibold text-gray-900 text-sm mb-2">
                              {item.name.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '')}
                            </p>
                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                            {isOwned ? (
                              <div className="bg-green-500 text-white px-3 py-2 rounded-lg font-semibold text-sm">
                                ✓ Owned
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePurchase(item.id)}
                                disabled={purchasing === item.id}
                                className="w-full bg-primary-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                              >
                                {purchasing === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  `Buy R${item.price.toFixed(0)}`
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase History</h2>
              {purchases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No purchases yet. Start shopping!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{purchase.item_name}</p>
                        <p className="text-sm text-gray-600">
                          {purchase.item_category === 'consumable' ? '🍬 Consumable' : '⏱️ Privilege'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Purchased: {new Date(purchase.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">R{(parseFloat(purchase.price_paid) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ShopItemCardProps {
  item: ShopItem;
  onPurchase: (itemId: number) => void;
  canPurchase: boolean;
  purchasing: boolean;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, onPurchase, canPurchase, purchasing }) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary-400 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
        <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
          R{(parseFloat(item.price) || 0).toFixed(2)}
        </div>
      </div>
      
      {item.description && (
        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
      )}
      
      {item.notes && (
        <p className="text-xs text-gray-500 italic mb-4">{item.notes}</p>
      )}

      <button
        onClick={() => onPurchase(item.id)}
        disabled={!canPurchase || purchasing}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          !canPurchase || purchasing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg'
        }`}
      >
        {purchasing ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Buy Now</span>
          </div>
        )}
      </button>
    </div>
  );
};

interface TeacherWinkelViewProps {
  purchases: Purchase[];
  items: ShopItem[];
  loading: boolean;
}

const TeacherWinkelView: React.FC<TeacherWinkelViewProps> = ({ purchases, items, loading }) => {
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/winkel/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 rounded-full p-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">The Winkel</h1>
            <p className="text-orange-100">Shop Management & Analytics</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shop Balance</p>
                <p className="text-3xl font-bold text-emerald-600">R{(parseFloat(stats.shop_balance) || 0).toFixed(2)}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Total money in shop account</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_purchases}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">R{(parseFloat(stats.total_revenue) || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Items</p>
                <p className="text-3xl font-bold text-gray-900">{items.filter(i => i.available).length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">All Purchases</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No purchases yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {purchase.first_name} {purchase.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{purchase.username} ({purchase.class})</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{purchase.item_name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.item_category === 'consumable'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {purchase.item_category === 'consumable' ? '🍬 Consumable' : '⏱️ Privilege'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                      R{(parseFloat(purchase.price_paid) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinkelPlugin;
