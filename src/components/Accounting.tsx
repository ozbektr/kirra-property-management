import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

const Accounting = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      // Get current month's transactions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())
        .eq('user_id', user.id);

      if (transactionsError) throw transactionsError;

      // Calculate financial summary
      const summary = (transactions || []).reduce((acc, transaction) => {
        const amount = transaction.original_amount || transaction.amount;
        const usdAmount = transaction.original_currency === 'TRY' 
          ? amount / 30.5 
          : amount;

        if (transaction.type === 'income') {
          acc.totalIncome += usdAmount;
          if (transaction.status === 'pending') {
            acc.pendingPayments += usdAmount;
          }
        } else {
          acc.totalExpenses += usdAmount;
        }
        return acc;
      }, {
        totalIncome: 0,
        totalExpenses: 0,
        pendingPayments: 0
      });

      setFinancialSummary({
        ...summary,
        netIncome: summary.totalIncome - summary.totalExpenses
      });

    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data');
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
        <div className="text-center text-dark-300">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-6">Financial Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-white">${financialSummary.totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="text-green-400 w-8 h-8" />
            </div>
          </div>

          <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-white">${financialSummary.totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="text-red-400 w-8 h-8" />
            </div>
          </div>

          <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Net Income</p>
                <p className="text-2xl font-bold text-white">${financialSummary.netIncome.toLocaleString()}</p>
              </div>
              <Wallet className="text-primary-400 w-8 h-8" />
            </div>
          </div>

          <div className="bg-dark-800 p-6 rounded-lg shadow-lg border border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-white">${financialSummary.pendingPayments.toLocaleString()}</p>
              </div>
              <Clock className="text-yellow-400 w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;