import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { formatINR, getCategoryColor } from '../utils/formatters.js';

export function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ height: '300px' }}>
        <p className="empty-desc">No expense records found for category distribution.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '10px 14px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{item.category}</p>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Amount: <strong style={{ color: '#0f172a' }}>{formatINR(item.total)}</strong>
          </p>
          <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
            {item.percentage}% of total expenses
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="chart-container" style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.category}`} fill={getCategoryColor(entry.category)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
        {data.slice(0, 5).map((item) => (
          <div 
            key={item.category} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: getCategoryColor(item.category)
              }} />
              <span style={{ fontWeight: 500, color: '#334155' }}>{item.category}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatINR(item.total)}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '36px', textAlign: 'right' }}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
