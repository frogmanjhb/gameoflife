import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Edit2, Trash2, Save, X, Loader2, 
  ToggleLeft, ToggleRight, Gift, Star, DollarSign, AlertCircle,
  CheckCircle, Package, Settings, ShoppingCart
} from 'lucide-react';
import { winkelApi, ShopItem } from '../../services/api';

const WinkelManagement: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'consumable' | 'privilege' | 'profile'>('all');
  const [weeklyLimit, setWeeklyLimit] = useState(1);
  const [savingSettings, setSavingSettings] = useState(false);

  // New item form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'consumable' as 'consumable' | 'privilege' | 'profile',
    price: 0,
    description: '',
    notes: '',
    available: true,
    event_day_only: false,
  });

  useEffect(() => {
    fetchItems();
    fetchSettings();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await winkelApi.getAllItems();
      // Convert prices to numbers
      const itemsWithNumericPrices = response.data.map((item: any) => ({
        ...item,
        price: parseFloat(item.price) || 0
      }));
      setItems(itemsWithNumericPrices);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load shop items');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await winkelApi.getSettings();
      setWeeklyLimit(response.data.weekly_purchase_limit);
    } catch (err: any) {
      console.error('Failed to fetch shop settings:', err);
    }
  };

  const handleSaveSettings = async (newLimit: number) => {
    try {
      setSavingSettings(true);
      setError(null);
      await winkelApi.updateSettings({ weekly_purchase_limit: newLimit });
      setWeeklyLimit(newLimit);
      setSuccess(`Weekly purchase limit updated to ${newLimit}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.name.trim() || newItem.price < 0) {
      setError('Please provide a valid name and price');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await winkelApi.createItem({
        ...newItem,
        description: newItem.description || undefined,
        notes: newItem.notes || undefined,
      });
      setSuccess('Item created successfully');
      setIsCreating(false);
      setNewItem({
        name: '',
        category: 'consumable',
        price: 0,
        description: '',
        notes: '',
        available: true,
        event_day_only: false,
      });
      fetchItems();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      setSaving(true);
      setError(null);
      await winkelApi.updateItem(editingItem.id, {
        name: editingItem.name,
        category: editingItem.category,
        price: editingItem.price,
        description: editingItem.description,
        notes: editingItem.notes,
        available: editingItem.available,
        event_day_only: editingItem.event_day_only,
      });
      setSuccess('Item updated successfully');
      setEditingItem(null);
      fetchItems();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item: ShopItem) => {
    try {
      setError(null);
      await winkelApi.updateItem(item.id, { available: !item.available });
      setSuccess(`Item ${item.available ? 'disabled' : 'enabled'} successfully`);
      fetchItems();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle item availability');
    }
  };

  const handleDeleteItem = async (item: ShopItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? If this item has purchase history, it will be disabled instead.`)) {
      return;
    }

    try {
      setError(null);
      const response = await winkelApi.deleteItem(item.id);
      if (response.data.marked_unavailable) {
        setSuccess('Item has purchase history and was disabled instead of deleted');
      } else {
        setSuccess('Item deleted successfully');
      }
      fetchItems();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'consumable': return <Gift className="h-4 w-4" />;
      case 'privilege': return <Star className="h-4 w-4" />;
      case 'profile': return <span className="text-sm">😎</span>;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'consumable': return '🍬 Consumable';
      case 'privilege': return '⏱️ Privilege';
      case 'profile': return '😎 Profile Emoji';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consumable': return 'bg-purple-100 text-purple-800';
      case 'privilege': return 'bg-yellow-100 text-yellow-800';
      case 'profile': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = items.filter(item => 
    categoryFilter === 'all' || item.category === categoryFilter
  );

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shop Items Management</h2>
          <p className="text-sm text-gray-500">Manage products, prices, and availability in The Winkel</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Weekly Purchase Limit Setting */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-amber-500 rounded-full p-3">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Purchase Limit</h3>
              <p className="text-sm text-gray-600">
                Students can make up to <span className="font-bold text-amber-700">{weeklyLimit}</span> purchase{weeklyLimit !== 1 ? 's' : ''} per week
              </p>
              <p className="text-xs text-gray-500 mt-1">
                (Profile emojis are excluded from this limit)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Limit:</label>
            <select
              value={weeklyLimit}
              onChange={(e) => handleSaveSettings(parseInt(e.target.value))}
              disabled={savingSettings}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} purchase{num !== 1 ? 's' : ''} per week
                </option>
              ))}
            </select>
            {savingSettings && <Loader2 className="h-5 w-5 animate-spin text-amber-600" />}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Create Item Form */}
      {isCreating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 🍬 Candy Bar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="consumable">🍬 Consumable</option>
                <option value="privilege">⏱️ Privilege</option>
                <option value="profile">😎 Profile Emoji</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (R) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Brief description"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (internal)</label>
              <input
                type="text"
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Internal notes (shown to students)"
              />
            </div>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.available}
                  onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Available for purchase</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.event_day_only}
                  onChange={(e) => setNewItem({ ...newItem, event_day_only: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Event day only</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateItem}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Create Item</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <div className="flex space-x-2">
          {(['all', 'consumable', 'privilege', 'profile'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Items Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Items</p>
              <p className="text-2xl font-bold text-green-600">{items.filter(i => i.available).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disabled Items</p>
              <p className="text-2xl font-bold text-gray-500">{items.filter(i => !i.available).length}</p>
            </div>
            <X className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-primary-600">
                R{items.length > 0 ? (items.reduce((sum, i) => sum + i.price, 0) / items.length).toFixed(0) : 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary-400" />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className={!item.available ? 'bg-gray-50 opacity-70' : ''}>
                  <td className="px-6 py-4">
                    {editingItem?.id === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          value={editingItem.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value || null })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Description"
                        />
                        <input
                          type="text"
                          value={editingItem.notes || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value || null })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Notes"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        {item.notes && <p className="text-xs text-gray-400 italic">{item.notes}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingItem?.id === item.id ? (
                      <select
                        value={editingItem.category}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="consumable">Consumable</option>
                        <option value="privilege">Privilege</option>
                        <option value="profile">Profile</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingItem?.id === item.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingItem.price}
                        onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary-600">R{item.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                          item.available ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.available ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm ${item.available ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.available ? 'Active' : 'Disabled'}
                      </span>
                      {item.event_day_only && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                          Event Only
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingItem?.id === item.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleUpdateItem}
                          disabled={saving}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {items.length === 0 ? 'No shop items yet. Add your first item!' : 'No items match the current filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WinkelManagement;
