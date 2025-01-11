import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PropertyPerformance {
  id: string;
  name: string;
  revenue: number;
  occupancy: number;
  rating: number;
}

interface AnalyticsStats {
  totalRevenue: number;
  revenueGrowth: number;
  occupancyRate: number;
  occupancyGrowth: number;
  averageStayDuration: number;
  stayDurationGrowth: number;
  totalBookings: number;
  bookingsGrowth: number;
  propertyPerformance: PropertyPerformance[];
  monthlyRevenue: { month: string; amount: number }[];
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRevenue: 0,
    revenueGrowth: 0,
    occupancyRate: 0,
    occupancyGrowth: 0,
    averageStayDuration: 0,
    stayDurationGrowth: 0,
    totalBookings: 0,
    bookingsGrowth: 0,
    propertyPerformance: [],
    monthlyRevenue: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get properties for this user
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('assigned_to', user.id);

      if (!properties) {
        throw new Error('Failed to load properties');
      }

      // Calculate monthly revenue for the past 6 months
      const monthlyRevenue = [];
      let totalRevenue = 0;
      let lastMonthRevenue = 0;
      let thisMonthRevenue = 0;

      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentYear, currentMonth - i, 1);
        const monthEnd = new Date(currentYear, currentMonth - i + 1, 0);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, original_amount, original_currency')
          .eq('type', 'income')
          .eq('user_id', user.id)
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString());

        const monthlyTotal = transactions?.reduce((acc, transaction) => {
          const amount = transaction.original_amount || transaction.amount;
          const usdAmount = transaction.original_currency === 'TRY' 
            ? amount / 30.5 
            : amount;
          return acc + usdAmount;
        }, 0) || 0;

        monthlyRevenue.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          amount: monthlyTotal
        });

        totalRevenue += monthlyTotal;
        if (i === 1) lastMonthRevenue = monthlyTotal;
        if (i === 0) thisMonthRevenue = monthlyTotal;
      }

      // Calculate revenue growth
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      // Calculate occupancy and bookings
      const { data: currentEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .in('property_id', properties.map(p => p.id))
        .gte('start_date', new Date(currentYear, currentMonth, 1).toISOString())
        .lte('end_date', new Date(currentYear, currentMonth + 1, 0).toISOString());

      const { data: lastMonthEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .in('property_id', properties.map(p => p.id))
        .gte('start_date', new Date(currentYear, currentMonth - 1, 1).toISOString())
        .lte('end_date', new Date(currentYear, currentMonth, 0).toISOString());

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const totalPossibleNights = properties.length * daysInMonth;
      
      const bookedNights = currentEvents?.reduce((acc, event) => {
        const start = new Date(event.start_date);
        const end = new Date(event.end_date);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return acc + days;
      }, 0) || 0;

      const lastMonthBookedNights = lastMonthEvents?.reduce((acc, event) => {
        const start = new Date(event.start_date);
        const end = new Date(event.end_date);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return acc + days;
      }, 0) || 0;

      const occupancyRate = totalPossibleNights > 0 
        ? Math.round((bookedNights / totalPossibleNights) * 100)
        : 0;

      const lastMonthOccupancy = totalPossibleNights > 0
        ? Math.round((lastMonthBookedNights / totalPossibleNights) * 100)
        : 0;

      const occupancyGrowth = lastMonthOccupancy > 0
        ? ((occupancyRate - lastMonthOccupancy) / lastMonthOccupancy) * 100
        : 0;

      // Calculate property performance
      const propertyPerformance = await Promise.all(
        properties.map(async (property) => {
          const { data: propertyEvents } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('property_id', property.id)
            .gte('start_date', new Date(currentYear, currentMonth, 1).toISOString())
            .lte('end_date', new Date(currentYear, currentMonth + 1, 0).toISOString());

          const { data: propertyTransactions } = await supabase
            .from('transactions')
            .select('amount, original_amount, original_currency')
            .eq('type', 'income')
            .eq('property_id', property.id)
            .gte('date', new Date(currentYear, currentMonth, 1).toISOString())
            .lte('date', new Date(currentYear, currentMonth + 1, 0).toISOString());

          const propertyRevenue = propertyTransactions?.reduce((acc, transaction) => {
            const amount = transaction.original_amount || transaction.amount;
            const usdAmount = transaction.original_currency === 'TRY'
              ? amount / 30.5
              : amount;
            return acc + usdAmount;
          }, 0) || 0;

          const propertyBookedNights = propertyEvents?.reduce((acc, event) => {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date);
            const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return acc + days;
          }, 0) || 0;

          const propertyOccupancy = Math.round((propertyBookedNights / daysInMonth) * 100);

          return {
            id: property.id,
            name: property.name,
            revenue: propertyRevenue,
            occupancy: propertyOccupancy,
            rating: property.rating || 0
          };
        })
      );

      setStats({
        totalRevenue,
        revenueGrowth,
        occupancyRate,
        occupancyGrowth,
        averageStayDuration: Math.round(bookedNights / (currentEvents?.length || 1)),
        stayDurationGrowth: 0, // Calculate if needed
        totalBookings: currentEvents?.length || 0,
        bookingsGrowth: lastMonthEvents?.length 
          ? ((currentEvents?.length || 0) - lastMonthEvents.length) / lastMonthEvents.length * 100
          : 0,
        propertyPerformance,
        monthlyRevenue
      });

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
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
        <div className="text-center text-dark-300">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Analytics Overview</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-400" />
            </div>
            <div className={`flex items-center ${stats.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm ml-1">{Math.abs(stats.revenueGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
        </div>

        {/* Occupancy Card */}
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div className={`flex items-center ${stats.occupancyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.occupancyGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm ml-1">{Math.abs(stats.occupancyGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Occupancy Rate</p>
          <p className="text-2xl font-bold text-white">{stats.occupancyRate}%</p>
        </div>

        {/* Average Stay Duration */}
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`flex items-center ${stats.stayDurationGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.stayDurationGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm ml-1">{Math.abs(stats.stayDurationGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Average Stay</p>
          <p className="text-2xl font-bold text-white">{stats.averageStayDuration} days</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-yellow-400" />
            </div>
            <div className={`flex items-center ${stats.bookingsGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.bookingsGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm ml-1">{Math.abs(stats.bookingsGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-dark-400 text-sm">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700 mb-8">
        <h2 className="text-lg font-semibold text-white mb-6">Revenue Trend</h2>
        <div className="h-64">
          <div className="flex h-full items-end space-x-2">
            {stats.monthlyRevenue.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-primary-600/50 hover:bg-primary-600/70 transition-colors rounded-t cursor-pointer group relative"
                  style={{ 
                    height: `${(data.amount / Math.max(...stats.monthlyRevenue.map(d => d.amount))) * 100}%`,
                    minHeight: '4px'
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-dark-700 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                    ${data.amount.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-dark-400 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Property Performance Table */}
      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Property Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-dark-700">
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Occupancy</th>
                <th className="px-6 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {stats.propertyPerformance.map((property) => (
                <tr key={property.id} className="hover:bg-dark-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-primary-400 mr-3" />
                      <span className="text-white">{property.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">${property.revenue.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1 h-2 bg-dark-700 rounded-full mr-2">
                        <div 
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${property.occupancy}%` }}
                        />
                      </div>
                      <span className="text-dark-300 text-sm">{property.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      property.rating >= 4.5 ? 'bg-green-500/20 text-green-400' :
                      property.rating >= 4.0 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {property.rating.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;