import React, { useState, useEffect } from 'react';
import { Building2, Users, Wallet } from 'lucide-react';
import OccupancyChart from './OccupancyChart';
import IncomeChart from './IncomeChart';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

interface DashboardStats {
  totalProperties: number;
  occupancyRate: number;
  monthlyIncome: number;
  bookedNights: number;
  availableNights: number;
  monthlyIncomeData: { month: string; amount: number }[];
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    occupancyRate: 0,
    monthlyIncome: 0,
    bookedNights: 0,
    availableNights: 0,
    monthlyIncomeData: []
  });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No authenticated user found');
        return;
      }

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.company_name);
      }

      // Load properties for occupancy calculation
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('assigned_to', user.id);

      const totalProperties = properties?.length || 0;

      // Calculate occupancy
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString())
        .in('property_id', properties?.map(p => p.id) || []);

      const daysInMonth = endOfMonth.getDate();
      const totalPossibleNights = totalProperties * daysInMonth;
      const bookedNights = events?.reduce((acc, event) => {
        const start = new Date(event.start_date);
        const end = new Date(event.end_date);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return acc + days;
      }, 0) || 0;

      const occupancyRate = totalPossibleNights > 0 
        ? Math.round((bookedNights / totalPossibleNights) * 100)
        : 0;

      // Load monthly income data for the past 12 months
      const monthlyIncomeData = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, original_amount, original_currency')
          .eq('type', 'income')
          .eq('user_id', user.id)
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString());

        const monthlyTotal = transactions?.reduce((acc, transaction) => {
          // Use original amount if available, otherwise use the USD amount
          const amount = transaction.original_amount || transaction.amount;
          // Convert TRY to USD if needed (using approximate rate)
          const usdAmount = transaction.original_currency === 'TRY' 
            ? amount / 30.5 
            : amount;
          return acc + usdAmount;
        }, 0) || 0;

        monthlyIncomeData.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          amount: monthlyTotal
        });
      }

      // Calculate current month's income
      const currentMonthIncome = monthlyIncomeData[monthlyIncomeData.length - 1].amount;

      setStats({
        totalProperties,
        occupancyRate,
        monthlyIncome: currentMonthIncome,
        bookedNights,
        availableNights: totalPossibleNights - bookedNights,
        monthlyIncomeData
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
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
        <div className="text-center text-dark-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {userName || 'User'}!
        </h1>
        <p className="text-dark-400">
          Here's an overview of your property portfolio performance.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Total Properties</p>
              <p className="text-2xl font-bold text-white">{stats.totalProperties}</p>
            </div>
            <Building2 className="text-primary-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Occupancy Rate</p>
              <p className="text-2xl font-bold text-white">{stats.occupancyRate}%</p>
            </div>
            <Users className="text-primary-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Monthly Income</p>
              <p className="text-2xl font-bold text-white">${stats.monthlyIncome.toLocaleString()}</p>
            </div>
            <Wallet className="text-primary-400 w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Occupancy Rate</h2>
          <OccupancyChart
            stats={{
              occupancyRate: stats.occupancyRate,
              bookedNights: stats.bookedNights,
              availableNights: stats.availableNights,
              totalNights: stats.bookedNights + stats.availableNights
            }}
          />
        </div>
        
        <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
          <h2 className="text-lg font-semibold mb-4 text-white">Monthly Income</h2>
          <IncomeChart monthlyData={stats.monthlyIncomeData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;