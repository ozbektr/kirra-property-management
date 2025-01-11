import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Property } from '../../types';
import AddPropertyModal from '../AddPropertyModal';
import AddOwnerModal from './AddOwnerModal';
import PropertyList from '../PropertyList';

const ListingManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [currency, setCurrency] = useState<'USD' | 'TRY'>('USD');
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<{ id: string; email: string; company_name: string }[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedOwner]);

  const loadData = async () => {
    try {
      setError(null);
      await Promise.all([
        loadProperties(),
        loadOwners()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    let query = supabase
      .from('properties')
      .select('*, profiles:assigned_to(email, company_name)');
    
    if (selectedOwner !== 'all') {
      query = query.eq('assigned_to', selectedOwner);
    }

    const { data, error: propertiesError } = await query;
    if (propertiesError) throw propertiesError;
    setProperties(data || []);
  };

  const loadOwners = async () => {
    const { data, error: ownersError } = await supabase
      .from('profiles')
      .select('id, email, company_name')
      .eq('role', 'owner')
      .order('company_name');

    if (ownersError) throw ownersError;
    setOwners(data || []);
  };

  const handleAddProperty = async (newProperty: Property) => {
    await loadProperties();
    setIsAddPropertyModalOpen(false);
  };

  const handleAddOwner = async () => {
    await loadOwners();
    setIsAddOwnerModalOpen(false);
  };

  const handlePropertyUpdate = async (updatedProperty: Property) => {
    await loadProperties();
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-dark-300">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrency(prev => prev === 'USD' ? 'TRY' : 'USD')}
            className="flex items-center px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
          >
            {currency}
          </button>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsAddOwnerModalOpen(true)}
            className="flex items-center px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Owner
          </button>
          <button 
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Owner Filter */}
        <div className="relative">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="pl-10 pr-8 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white appearance-none focus:outline-none focus:border-primary-500 min-w-[200px]"
          >
            <option value="all">All Owners</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {owner.company_name || owner.email}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Property Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="pl-10 pr-8 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white appearance-none focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="studio">Studio</option>
          </select>
        </div>
      </div>

      <PropertyList
        properties={properties}
        searchTerm={searchTerm}
        propertyType={propertyType}
        currency={currency}
        onPropertyUpdate={handlePropertyUpdate}
      />

      {isAddPropertyModalOpen && (
        <AddPropertyModal
          onClose={() => setIsAddPropertyModalOpen(false)}
          onAdd={handleAddProperty}
          owners={owners}
          selectedOwner={selectedOwner !== 'all' ? selectedOwner : undefined}
        />
      )}

      {isAddOwnerModalOpen && (
        <AddOwnerModal
          onClose={() => setIsAddOwnerModalOpen(false)}
          onAdd={handleAddOwner}
        />
      )}
    </div>
  );
};

export default ListingManager;