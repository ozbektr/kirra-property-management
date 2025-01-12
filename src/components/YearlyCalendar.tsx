import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  property_id: string;
  start_date: string;
  end_date: string;
  event_type: 'booking' | 'maintenance' | 'blocked';
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface MonthStatus {
  reserved: number;
  blocked: number;
  available: number;
  total: number;
}

const YearlyCalendar = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyStatus, setMonthlyStatus] = useState<Record<string, MonthStatus>>({});
  const [loading, setLoading] = useState(true);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    loadYearlyEvents();
  }, [currentYear]);

  const loadYearlyEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31);

      // Get user's properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('assigned_to', user.id);

      if (!properties?.length) return;

      const propertyIds = properties.map(p => p.id);

      // Get all calendar events for the year
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .in('property_id', propertyIds)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString())
        .neq('status', 'cancelled');

      // Initialize monthly status
      const status: Record<string, MonthStatus> = {};
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
        status[month] = {
          reserved: 0,
          blocked: 0,
          available: daysInMonth * propertyIds.length,
          total: daysInMonth * propertyIds.length
        };
      }

      // Calculate status for each month
      events?.forEach((event: CalendarEvent) => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getFullYear() === currentYear) {
            const month = d.getMonth();
            
            if (event.event_type === 'booking') {
              status[month].reserved++;
              status[month].available--;
            } else if (event.event_type === 'blocked' || event.event_type === 'maintenance') {
              status[month].blocked++;
              status[month].available--;
            }
          }
        }
      });

      setMonthlyStatus(status);
    } catch (error) {
      console.error('Error loading yearly events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthColor = (month: number): string => {
    const status = monthlyStatus[month];
    if (!status) return 'bg-dark-700';

    const reservedPercentage = (status.reserved / status.total) * 100;
    const blockedPercentage = (status.blocked / status.total) * 100;
    const availablePercentage = (status.available / status.total) * 100;

    if (reservedPercentage > 50) return 'bg-red-500/50';
    if (blockedPercentage > 50) return 'bg-yellow-500/50';
    if (availablePercentage > 50) return 'bg-green-500/50';
    
    return 'bg-dark-700';
  };

  const getMonthStats = (month: number): string => {
    const status = monthlyStatus[month];
    if (!status) return 'No data';

    return `Reserved: ${Math.round((status.reserved / status.total) * 100)}%
Blocked: ${Math.round((status.blocked / status.total) * 100)}%
Available: ${Math.round((status.available / status.total) * 100)}%`;
  };

  if (loading) {
    return <div className="text-center text-dark-300">Loading calendar...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentYear(currentYear - 1)}
          className="p-1 hover:bg-dark-700 rounded-lg text-dark-300 hover:text-primary-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white font-medium">{currentYear}</span>
        <button
          onClick={() => setCurrentYear(currentYear + 1)}
          className="p-1 hover:bg-dark-700 rounded-lg text-dark-300 hover:text-primary-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => (
          <div
            key={month}
            className="relative p-2 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors cursor-pointer group"
          >
            <div className="text-xs text-dark-400 mb-1">{month}</div>
            <div className={`h-2 rounded-full ${getMonthColor(index)}`} />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-dark-800/90 rounded-lg transition-opacity">
              <pre className="text-xs text-white whitespace-pre-line p-2">
                {getMonthStats(index)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 justify-center text-xs text-dark-400">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
          <span>Available</span>
        </div>
      </div>
    </div>
  );
};

export default YearlyCalendar;