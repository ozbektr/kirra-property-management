import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const YearlyCalendar = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<Record<string, number>>({});
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

      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('assigned_to', user.id);

      if (!properties?.length) return;

      const propertyIds = properties.map(p => p.id);

      const { data: events } = await supabase
        .from('calendar_events')
        .select('start_date, end_date')
        .in('property_id', propertyIds)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());

      // Count events per month
      const monthlyEvents: Record<string, number> = {};
      events?.forEach(event => {
        const startMonth = new Date(event.start_date).getMonth();
        const endMonth = new Date(event.end_date).getMonth();
        
        for (let month = startMonth; month <= endMonth; month++) {
          const key = `${currentYear}-${month}`;
          monthlyEvents[key] = (monthlyEvents[key] || 0) + 1;
        }
      });

      setEvents(monthlyEvents);
    } catch (error) {
      console.error('Error loading yearly events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthActivity = (month: number): 'low' | 'medium' | 'high' | 'none' => {
    const count = events[`${currentYear}-${month}`] || 0;
    if (count === 0) return 'none';
    if (count <= 2) return 'low';
    if (count <= 5) return 'medium';
    return 'high';
  };

  const getActivityColor = (level: 'low' | 'medium' | 'high' | 'none'): string => {
    switch (level) {
      case 'high': return 'bg-primary-600/50';
      case 'medium': return 'bg-primary-500/30';
      case 'low': return 'bg-primary-400/20';
      default: return 'bg-dark-700';
    }
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
            <div className={`h-2 rounded-full ${getActivityColor(getMonthActivity(index))}`} />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-dark-800/90 rounded-lg transition-opacity">
              <span className="text-xs text-white">
                {events[`${currentYear}-${index}`] || 0} events
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 justify-center text-xs text-dark-400">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-primary-600/50" />
          <span>High</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-primary-500/30" />
          <span>Medium</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-primary-400/20" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
};

export default YearlyCalendar;