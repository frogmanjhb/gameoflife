import React, { useState, useEffect } from 'react';
import { Send, User, DollarSign, MessageSquare, AlertCircle, XCircle } from 'lucide-react';
import api from '../services/api';

interface TransferFormProps {
  onSuccess: () => void;
}

interface Classmate {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  class: string | null;
}

interface CanTransactResult {
  canTransact: boolean;
  reason?: string;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    to_username: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recipients, setRecipients] = useState<Classmate[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [canTransact, setCanTransact] = useState<CanTransactResult | null>(null);
  const [checkingTransact, setCheckingTransact] = useState(true);

  // Load transfer recipients (all students across classes) and check if student can transact
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipientsRes, canTransactRes] = await Promise.all([
          api.get('/students/transfer-recipients'),
          api.get('/transactions/can-transact')
        ]);
        setRecipients(recipientsRes.data);
        setCanTransact(canTransactRes.data);
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoadingRecipients(false);
        setCheckingTransact(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/transactions/transfer', {
        to_username: formData.to_username,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined
      });

      setSuccess('Transfer completed successfully!');
      setFormData({ to_username: '', amount: '', description: '' });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (checkingTransact) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show blocking message if student cannot transact
  if (canTransact && !canTransact.canTransact) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfers Blocked</h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium mb-2">You cannot make transfers at this time</p>
          <p className="text-red-700 text-sm">{canTransact.reason}</p>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ How to resolve:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• If you have a negative balance, deposit money to clear it</li>
            <li>• If you have an overdue loan payment, make a loan payment first</li>
            <li>• Contact your teacher if you need assistance</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Money</h2>
        <p className="text-gray-600">Send money to another student in any class</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="to_username" className="label">
            <User className="h-4 w-4 inline mr-1" />
            Send to (Student)
          </label>
          {loadingRecipients ? (
            <div className="input-field text-gray-500">
              Loading students...
            </div>
          ) : (
            <select
              id="to_username"
              name="to_username"
              required
              className="input-field"
              value={formData.to_username}
              onChange={handleInputChange}
            >
              <option value="">Select a student</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.username}>
                  {recipient.first_name && recipient.last_name 
                    ? `${recipient.first_name} ${recipient.last_name} (${recipient.class || '?'}) – ${recipient.username}`
                    : `${recipient.username} (${recipient.class || '?'})`
                  }
                </option>
              ))}
            </select>
          )}
          {!loadingRecipients && recipients.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No other students found.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="label">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="input-field"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Description (Optional)
          </label>
          <input
            id="description"
            name="description"
            type="text"
            className="input-field"
            placeholder="What's this for?"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Money'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Transfer Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Make sure you have enough money in your account</li>
          <li>• Select a student from any class to send money to</li>
          <li>• Add a description to remember what the money is for</li>
          <li>• Pay off any outstanding loans before making transfers</li>
        </ul>
      </div>
    </div>
  );
};

export default TransferForm;
