import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Property } from '../types';
import ListingManager from './admin/ListingManager';
import CalendarManager from './admin/CalendarManager';

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'properties' | 'calendar'>(
    searchParams.get('tab') === 'calendar' ? 'calendar' : 'properties'
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setError(null);
      const { data, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(data || []);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'properties' | 'calendar') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-dark-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Property Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => handleTabChange('properties')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'properties'
                ? 'bg-primary-600 text-white'
                : 'text-dark-300 hover:text-primary-400'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => handleTabChange('calendar')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'calendar'
                ? 'bg-primary-600 text-white'
                : 'text-dark-300 hover:text-primary-400'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
        <div className="p-6">
          {activeTab === 'properties' ? (
            <ListingManager />
          ) : (
            <CalendarManager properties={properties} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;