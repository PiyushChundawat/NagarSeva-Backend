import React from 'react';

const StatCard = ({ number, label, className = '' }) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
};

const StatsGrid = ({ stats, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} number={stat.number} label={stat.label} />
      ))}
    </div>
  );
};

export default StatsGrid;
export { StatCard };