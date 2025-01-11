import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Property } from '../../types';
import AddEventModal from './AddEventModal';

interface CalendarEvent {
  id: string;
  property_id: string;
  unit_number: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: 'booking' | 'maintenance' | 'blocked';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

interface CalendarManagerProps {
  properties: Property[];
}

const CalendarManager = ({ properties }: CalendarManagerProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<{ id: string; email: string }[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  useEffect(() => {
    loadEvents();
    loadOwners();
  }, [selectedProperty, selectedOwner, currentDate]);

  const loadOwners = async () => {
    try {
      const { data, error: ownersError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'owner');

      if (ownersError) throw ownersError;
      setOwners(data || []);
    } catch (err) {
      console.error('Error loading owners:', err);
    }
  };

  const loadEvents = async () => {
    try {
      setError(null);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let query = supabase
        .from('calendar_events')
        .select('*, properties(assigned_to)')
        .gte('start_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString());

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      if (selectedOwner !== 'all') {
        query = query.eq('properties.assigned_to', selectedOwner);
      }

      const { data, error: eventsError } = await query;

      if (eventsError) throw eventsError;
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDayEvents = (day: number): CalendarEvent[] => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return date >= startDate && date <= endDate;
    });
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents(current => [...current, newEvent]);
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-dark-300">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4">
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Owners</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>{owner.email}</option>
            ))}
          </select>

          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} {property.unit_number ? `(Unit ${property.unit_number})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </button>
      </div>

      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-dark-700 rounded-lg text-dark-300 hover:text-primary-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-dark-700 rounded-lg text-dark-300 hover:text-primary-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map(day => (
              <div key={day} className="text-center text-dark-400 text-sm py-2">
                {day}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square p-2 text-dark-500"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = getDayEvents(day);
              const isToday = 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`
                    aspect-square p-2 rounded-lg border border-dark-700
                    ${isToday ? 'bg-primary-900/30 border-primary-500' : 'hover:bg-dark-700'}
                    transition-colors cursor-pointer overflow-hidden
                  `}
                >
                  <div className="text-sm text-dark-300">{day}</div>
                  {dayEvents.map((event, eventIndex) => (
                    <div
                      key={event.id}
                      className={`
                        mt-1 text-xs p-1 rounded truncate
                        ${event.event_type === 'booking' ? 'bg-green-500/20 text-green-400' :
                          event.event_type === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'}
                        ${event.status === 'cancelled' ? 'opacity-50' : ''}
                      `}
                      title={`${event.title} (${event.unit_number})`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-dark-700">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-400 mr-2" />
              <span className="text-sm text-dark-300">Booking</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-400 mr-2" />
              <span className="text-sm text-dark-300">Maintenance</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-400 mr-2" />
              <span className="text-sm text-dark-300">Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <AddEventModal
          properties={properties}
          selectedProperty={selectedProperty === 'all' ? undefined : selectedProperty}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddEvent}
        />
      )}
    </div>
  );
};

export default CalendarManager;