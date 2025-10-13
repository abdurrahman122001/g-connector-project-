import React from 'react';

type Trend = 'up' | 'down' | 'neutral';
type Color = 'green' | 'red' | 'blue';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: Trend;
  change: string;
  color?: Color;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  change,
  color = 'blue',
}) => {
  const trendColors = {
    up: { text: 'text-green-600', bg: 'bg-green-100' },
    down: { text: 'text-red-600', bg: 'bg-red-100' },
    neutral: { text: 'text-gray-600', bg: 'bg-gray-100' },
  };

  const cardColors = {
    green: 'border-green-200',
    red: 'border-red-200',
    blue: 'border-blue-200',
  };

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${
        cardColors[color] || cardColors.blue
      }`}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-semibold text-gray-800 mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      
    </div>
  );
};

export default MetricCard;
