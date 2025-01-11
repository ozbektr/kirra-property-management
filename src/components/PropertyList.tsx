import React, { useState } from 'react';
import { Building2, MapPin, Calendar, Trash2 } from 'lucide-react';
import type { Property } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/constants';
import EditPropertyModal from './EditPropertyModal';

interface PropertyListProps {
  properties: Property[];
  searchTerm?: string;
  propertyType?: string;
  currency?: 'USD' | 'TRY';
  onPropertyUpdate?: (property: Property) => void;
  onPropertyDelete?: (propertyId: string) => void;
}

const PropertyList = ({ 
  properties, 
  searchTerm = '', 
  propertyType = 'all',
  currency = 'USD',
  onPropertyUpdate,
  onPropertyDelete
}: PropertyListProps) => {
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = propertyType === 'all' || property.type === propertyType;
    
    return matchesSearch && matchesType;
  });

  const handleDelete = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      // Notify parent component about deletion
      if (onPropertyDelete) {
        onPropertyDelete(propertyId);
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Failed to delete property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-dark-700">
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Property</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Address</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Monthly Rate</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Current Tenant</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Exit Date</th>
            <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700">
          {filteredProperties.map((property) => (
            <tr key={property.id} className="hover:bg-dark-700/50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-primary-400 mr-2" />
                  <span className="text-white">{property.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-dark-400 mr-2" />
                  <span className="text-dark-300">{property.address}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-dark-300 capitalize">{property.type}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-white">
                  {formatCurrency(
                    property.original_amount || property.monthly_rate,
                    property.original_currency || 'USD',
                    currency
                  )}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  property.status === 'occupied'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {property.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-dark-300">
                  {property.tenant_name || '-'}
                </span>
              </td>
              <td className="px-6 py-4">
                {property.tenant_exit_date && (
                  <div className="flex items-center text-dark-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(property.tenant_exit_date).toLocaleDateString()}</span>
                  </div>
                )}
                {!property.tenant_exit_date && <span className="text-dark-300">-</span>}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setEditingProperty(property)}
                    className="text-primary-400 hover:text-primary-300"
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onUpdate={onPropertyUpdate!}
        />
      )}
    </div>
  );
};

export default PropertyList;