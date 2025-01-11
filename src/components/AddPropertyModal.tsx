import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Property } from '../types';

interface AddPropertyModalProps {
  onClose: () => void;
  onAdd: (property: Property) => void;
  owners?: { id: string; email: string; company_name: string }[];
  selectedOwner?: string;
}

const AddPropertyModal = ({ onClose, onAdd, owners = [], selectedOwner }: AddPropertyModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    monthlyRate: '',
    currency: 'TRY' as 'USD' | 'TRY',
    type: 'apartment',
    status: 'available',
    bedrooms: '',
    bathrooms: '',
    area: '',
    image: '',
    assignedTo: selectedOwner || '',
    tenantName: '',
    tenantExitDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const amount = parseFloat(formData.monthlyRate);
      if (isNaN(amount)) throw new Error('Invalid monthly rate');

      // Convert to USD if needed
      const usdAmount = formData.currency === 'TRY' ? amount / 35.39 : amount;

      const propertyData = {
        name: formData.name,
        address: formData.address,
        monthly_rate: usdAmount,
        original_currency: formData.currency,
        original_amount: amount,
        type: formData.type,
        status: formData.status,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area || '0'),
        image: formData.image || null,
        assigned_to: formData.assignedTo,
        tenant_name: formData.tenantName || null,
        tenant_exit_date: formData.tenantExitDate || null
      };

      const { data, error: insertError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('No data returned from insert');

      onAdd(data as Property);
      onClose();
    } catch (err) {
      console.error('Error adding property:', err);
      setError(err instanceof Error ? err.message : 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return value.replace(/[^0-9.]/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-xl border border-dark-700 w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Add New Property</h2>
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
            {/* Owner Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Owner
              </label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select Owner</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.company_name || owner.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Name */}
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
                placeholder="e.g., Luxury Downtown Apartment"
              />
            </div>

            {/* Address */}
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
                placeholder="Full property address"
              />
            </div>

            {/* Monthly Rate */}
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
                  placeholder="Amount"
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
            </div>

            {/* Property Type */}
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

            {/* Status */}
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

            {/* Bedrooms */}
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
                placeholder="Number of bedrooms"
              />
            </div>

            {/* Bathrooms */}
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
                placeholder="Number of bathrooms"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Area (m²)
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                placeholder="Property area in square meters"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                placeholder="URL to property image (optional)"
              />
            </div>

            {/* Current Tenant */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Current Tenant
              </label>
              <input
                type="text"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                placeholder="Current tenant's name (if any)"
              />
            </div>

            {/* Tenant Exit Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">
                Tenant Exit Date
              </label>
              <input
                type="date"
                value={formData.tenantExitDate}
                onChange={(e) => setFormData({ ...formData, tenantExitDate: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
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
              {loading ? 'Adding...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;