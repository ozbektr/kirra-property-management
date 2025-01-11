import React from 'react';

interface OccupancyChartProps {
  stats: {
    occupancyRate: number;
    bookedNights: number;
    availableNights: number;
    totalNights: number;
  };
}

const OccupancyChart = ({ stats }: OccupancyChartProps) => {
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (stats.occupancyRate / 100) * circumference;

  return (
    <div className="flex items-center justify-between">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-dark-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="80"
            cy="80"
          />
          <circle
            className="text-primary-600"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="50"
            cx="80"
            cy="80"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="text-3xl font-bold text-white">{stats.occupancyRate}%</span>
          <span className="block text-sm text-dark-400">Occupied</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-primary-600 mr-2"></div>
            <span className="text-sm text-dark-400">Booked nights</span>
          </div>
          <p className="text-2xl font-bold text-white ml-5">{stats.bookedNights}</p>
        </div>
        
        <div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-dark-700 mr-2"></div>
            <span className="text-sm text-dark-400">Available nights</span>
          </div>
          <p className="text-2xl font-bold text-white ml-5">{stats.availableNights}</p>
        </div>
      </div>
    </div>
  );
};

export default OccupancyChart;