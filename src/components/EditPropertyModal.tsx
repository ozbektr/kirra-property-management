import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Property } from '../types';

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onUpdate: (property: Property) => void;
}

const EditPropertyModal = ({ property, onClose, onUpdate }: EditPropertyModalProps) => {
  const [formData, setFormData] = useState({
    name: property.name || '',
    address: property.address || '',
    monthlyRate: property.original_amount?.toString() || property.monthly_rate?.toString() || '',
    currency: property.original_currency || 'TRY' as 'USD' | 'TRY',
    type: property.type || 'apartment',
    status: property.status || 'available',
    bedrooms: property.bedrooms?.toString() || '',
    bathrooms: property.bathrooms?.toString() || '',
    area: property.area?.toString() || '',
    image: property.image || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exchange rate: 1 USD = 30.5 TRY
  const exchangeRate = 30.5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.monthlyRate);
      // Convert TRY to USD if needed
      const usdAmount = formData.currency === 'TRY' ? amount / exchangeRate : amount;

      const propertyData = {
        name: formData.name,
        address: formData.address,
        monthly_rate: usdAmount, // Store in USD
        original_currency: formData.currency,
        original_amount: amount,
        type: formData.type,
        status: formData.status,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        image: formData.image
      };

      const { data, error: updateError } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', property.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        onUpdate(data as Property);
        onClose();
      }
    } catch (err) {
      console.error('Error updating property:', err);
      setError('Failed to update property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    return value.replace(/[^0-9.]/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl border border-dark-700 w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Edit Property</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Property Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Monthly Rate
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData({ ...formData, monthlyRate: formatCurrency(e.target.value) })}
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USD' | 'TRY' })}
                  className="w-24 px-2 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="TRY">₺ TRY</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
              {formData.monthlyRate && (
                <p className="mt-1 text-sm text-dark-400">
                  ≈ {formData.currency === 'TRY' 
                    ? `$${(parseFloat(formData.monthlyRate) / exchangeRate).toFixed(2)} USD`
                    : `₺${(parseFloat(formData.monthlyRate) * exchangeRate).toFixed(2)} TRY`
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Property Type
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Status
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Area (sq ft)
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;