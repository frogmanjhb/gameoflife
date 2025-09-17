import React, { useState } from 'react';
import { Send, User, DollarSign, MessageSquare } from 'lucide-react';
import api from '../services/api';

interface TransferFormProps {
  onSuccess: () => void;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Money</h2>
        <p className="text-gray-600">Send money to another student in your class</p>
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
            Send to (Username)
          </label>
          <input
            id="to_username"
            name="to_username"
            type="text"
            required
            className="input-field"
            placeholder="Enter recipient's username"
            value={formData.to_username}
            onChange={handleInputChange}
          />
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
          <li>• Double-check the recipient's username</li>
          <li>• Add a description to remember what the money is for</li>
        </ul>
      </div>
    </div>
  );
};

export default TransferForm;
