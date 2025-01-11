import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const InlineCalendar = () => {
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

  // Updated to include unique keys for each day
  const days = [
    { key: 'sun', label: 'S' },
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' }
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Sample availability data - in a real app, this would come from your database
  const availability = {
    available: [5, 6, 7, 12, 13, 19, 20],
    booked: [1, 2, 8, 9, 15, 16, 22, 23, 29, 30],
    maintenance: [14, 21, 28]
  };

  const getDayStatus = (day: number) => {
    if (availability.available.includes(day)) return 'available';
    if (availability.booked.includes(day)) return 'booked';
    if (availability.maintenance.includes(day)) return 'maintenance';
    return 'none';
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-dark-800 rounded-lg shadow-lg border border-dark-700">
        {/* Calendar Header */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-dark-700 rounded-lg text-dark-300 hover:text-primary-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <h2 className="text-lg font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-dark-700 rounded-lg text-dark-300 hover:text-primary-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mt-4">
            {days.map(day => (
              <div key={day.key} className="text-center text-dark-400 text-xs font-medium">
                {day.label}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square p-1"
              />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const status = getDayStatus(day);
              const isToday = 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`
                    aspect-square p-1 relative group
                    ${isToday ? 'bg-primary-900/30' : ''}
                  `}
                >
                  <div
                    className={`
                      w-full h-full flex items-center justify-center rounded-full text-sm
                      ${status === 'available' ? 'bg-green-500/20 text-green-400' :
                        status === 'booked' ? 'bg-red-500/20 text-red-400' :
                        status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                        'text-dark-300'}
                      ${isToday ? 'ring-2 ring-primary-500' : ''}
                      hover:bg-dark-700 transition-colors cursor-pointer
                    `}
                  >
                    {day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-400 mr-1" />
              <span className="text-dark-300">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-400 mr-1" />
              <span className="text-dark-300">Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-400 mr-1" />
              <span className="text-dark-300">Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineCalendar;