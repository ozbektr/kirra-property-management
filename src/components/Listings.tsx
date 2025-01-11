import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  DollarSign, 
  Users, 
  Calendar,
  Star,
  Bed,
  Bath,
  Square,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { Property } from '../types';

const Listings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Sample data - in a real app, this would come from your database
  const listings: Property[] = [
    {
      id: '1',
      name: 'Luxury Downtown Apartment',
      address: '123 Main St, City Center',
      monthlyRate: 2500,
      status: 'available',
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      rating: 4.8,
      customerId: '1',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
    },
    {
      id: '2',
      name: 'Seaside Villa',
      address: '456 Beach Road, Coastal District',
      monthlyRate: 3500,
      status: 'available',
      type: 'villa',
      bedrooms: 4,
      bathrooms: 3,
      area: 2500,
      rating: 4.9,
      customerId: '1',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
    },
    {
      id: '3',
      name: 'Modern Studio Loft',
      address: '789 Urban Ave, Downtown',
      monthlyRate: 1800,
      status: 'available',
      type: 'studio',
      bedrooms: 1,
      bathrooms: 1,
      area: 800,
      rating: 4.7,
      customerId: '1',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
    }
  ];

  const stats = {
    totalListings: listings.length,
    averageRate: Math.round(listings.reduce((acc, curr) => acc + curr.monthlyRate, 0) / listings.length),
    occupancyRate: 85,
    totalRevenue: listings.reduce((acc, curr) => acc + curr.monthlyRate, 0)
  };

  const filterListings = () => {
    return listings.filter(listing => {
      const matchesSearch = 
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = propertyType === 'all' || listing.type === propertyType;
      
      const matchesPrice = priceRange === 'all' ||
        (priceRange === 'low' && listing.monthlyRate <= 2000) ||
        (priceRange === 'medium' && listing.monthlyRate > 2000 && listing.monthlyRate <= 3000) ||
        (priceRange === 'high' && listing.monthlyRate > 3000);
      
      return matchesSearch && matchesType && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.monthlyRate - b.monthlyRate;
      if (sortBy === 'price-desc') return b.monthlyRate - a.monthlyRate;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // 'newest' is default
    });
  };

  const filteredListings = filterListings();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">My Listings</h1>
        <button 
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Listing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex items-center text-green-400">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm ml-1">12%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex items-center text-green-400">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm ml-1">5%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Occupancy Rate</p>
          <p className="text-2xl font-bold text-white">{stats.occupancyRate}%</p>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex items-center text-red-400">
              <ArrowDownRight className="w-4 h-4" />
              <span className="text-sm ml-1">3%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Average Rate</p>
          <p className="text-2xl font-bold text-white">${stats.averageRate.toLocaleString()}</p>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex items-center text-green-400">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm ml-1">8%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Total Listings</p>
          <p className="text-2xl font-bold text-white">{stats.totalListings}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white appearance-none focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
            </select>
          </div>

          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white appearance-none focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Prices</option>
              <option value="low">Under $2,000</option>
              <option value="medium">$2,000 - $3,000</option>
              <option value="high">Above $3,000</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white appearance-none focus:outline-none focus:border-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <div key={listing.id} className="bg-dark-800 rounded-lg shadow-lg border border-dark-700 overflow-hidden">
            <div className="aspect-video relative">
              <img 
                src={listing.image} 
                alt={listing.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-sm rounded-full bg-dark-900/80 text-white">
                  {listing.status === 'available' ? 'Available' : 'Occupied'}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{listing.name}</h3>
                  <div className="flex items-center text-dark-300">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{listing.address}</span>
                  </div>
                </div>
                <div className="flex items-center bg-primary-900/30 px-2 py-1 rounded">
                  <Star className="w-4 h-4 text-primary-400 mr-1" />
                  <span className="text-primary-400">{listing.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary-400 mb-1">
                    <Bed className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-dark-300">{listing.bedrooms} Beds</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary-400 mb-1">
                    <Bath className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-dark-300">{listing.bathrooms} Baths</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary-400 mb-1">
                    <Square className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-dark-300">{listing.area} ft²</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                <div>
                  <span className="text-dark-400 text-sm">Monthly Rate</span>
                  <p className="text-xl font-bold text-white">${listing.monthlyRate.toLocaleString()}</p>
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
  );
};

export default Listings;