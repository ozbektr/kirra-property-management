import React from 'react';

interface IncomeChartProps {
  monthlyData: {
    month: string;
    amount: number;
  }[];
}

const IncomeChart = ({ monthlyData }: IncomeChartProps) => {
  const maxAmount = Math.max(...monthlyData.map(d => d.amount));

  return (
    <div className="h-64">
      <div className="flex h-full items-end space-x-2">
        {monthlyData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className={`w-full ${
                index === monthlyData.length - 1 ? 'bg-primary-600' : 'bg-dark-700'
              } rounded-t transition-all hover:opacity-80`}
              style={{
                height: `${(data.amount / maxAmount) * 100}%`,
                minHeight: '4px'
              }}
            >
              <div className="opacity-0 hover:opacity-100 transition-opacity absolute -top-8 left-1/2 transform -translate-x-1/2 bg-dark-700 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                ${data.amount.toLocaleString()}
              </div>
            </div>
            <span className="text-xs text-dark-400 mt-2">{data.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeChart;