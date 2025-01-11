import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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

  // Sample events data - in a real app, this would come from your database
  const events = [
    { date: 15, title: 'Property Inspection', type: 'inspection' },
    { date: 20, title: 'Tenant Check-in', type: 'check-in' },
    { date: 25, title: 'Maintenance', type: 'maintenance' },
  ];

  const getEventForDay = (day: number) => {
    return events.find(event => event.date === day);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
        {/* Calendar Header */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
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

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(day => (
              <div key={day} className="text-center text-dark-400 text-sm py-2">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square p-2 text-dark-500"
              />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const event = getEventForDay(day);
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
                    transition-colors cursor-pointer
                  `}
                >
                  <div className="text-sm text-dark-300">{day}</div>
                  {event && (
                    <div className={`
                      mt-1 text-xs p-1 rounded
                      ${event.type === 'inspection' ? 'bg-blue-500/20 text-blue-400' :
                        event.type === 'check-in' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'}
                    `}>
                      {event.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-6 border-t border-dark-700">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-400 mr-2" />
              <span className="text-sm text-dark-300">Inspection</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-400 mr-2" />
              <span className="text-sm text-dark-300">Check-in</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-400 mr-2" />
              <span className="text-sm text-dark-300">Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;