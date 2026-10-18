import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { formatINR } from '../utils/formatters.js';

export function MonthlyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ height: '300px' }}>
        <p className="empty-desc">No transaction history available to generate monthly charts.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>{label}</p>
          {payload.map((item) => (
            <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: item.color
              }} />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {item.name}:
              </span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                {formatINR(item.value)}
              </strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="label" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '16px' }}
          />
          <Bar 
            dataKey="income" 
            name="Income" 
            fill="#10b981" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={40}
          />
          <Bar 
            dataKey="expense" 
            name="Expenses" 
            fill="#f43f5e" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
