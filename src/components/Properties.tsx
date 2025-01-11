import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, DollarSign, Star, Bed, Bath, Square } from 'lucide-react';
import type { Property } from '../types';
import { supabase } from '../lib/supabase';
import YearlyCalendar from './YearlyCalendar';

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { data, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('assigned_to', user.id)
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
        <div className="text-center text-dark-300">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6 text-white">My Properties</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-dark-800 rounded-lg shadow-lg border border-dark-700 overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={property.image} 
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-sm rounded-full bg-dark-900/80 text-white">
                      {property.status === 'available' ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{property.name}</h3>
                      <div className="flex items-center text-dark-300">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center bg-primary-900/30 px-2 py-1 rounded">
                      <Star className="w-4 h-4 text-primary-400 mr-1" />
                      <span className="text-primary-400">{property.rating}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-primary-400 mb-1">
                        <Bed className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-dark-300">{property.bedrooms} Beds</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-primary-400 mb-1">
                        <Bath className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-dark-300">{property.bathrooms} Baths</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-primary-400 mb-1">
                        <Square className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-dark-300">{property.area} ft²</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                    <div>
                      <span className="text-dark-400 text-sm">Monthly Rate</span>
                      <p className="text-xl font-bold text-white">
                        {property.original_currency === 'TRY' 
                          ? `₺${property.original_amount?.toLocaleString()}`
                          : `$${property.monthly_rate?.toLocaleString()}`
                        }
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-80 space-y-6">
          <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
            <h2 className="text-lg font-semibold text-white mb-4">Yearly Overview</h2>
            <YearlyCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;