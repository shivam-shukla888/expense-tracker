import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function StatCard({ title, value, type, icon: Icon, trendPercent, subtitle }) {
  const getTrendElement = () => {
    if (trendPercent === undefined || trendPercent === null) return null;

    const isPositive = trendPercent > 0;
    const isZero = trendPercent === 0;

    let badgeClass = 'neutral';
    if (!isZero) {
      if (type === 'expense') {
        // For expenses, an increase is typically red/negative, decrease is green
        badgeClass = isPositive ? 'negative' : 'positive';
      } else {
        badgeClass = isPositive ? 'positive' : 'negative';
      }
    }

    return (
      <span className={`trend-badge ${badgeClass}`}>
        {isPositive && <ArrowUpRight size={12} />}
        {!isPositive && !isZero && <ArrowDownRight size={12} />}
        {isZero && <Minus size={12} />}
        {Math.abs(trendPercent)}%
      </span>
    );
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{title}</span>
        <div className={`stat-icon ${type}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        {getTrendElement()}
        <span>{subtitle || 'vs previous month'}</span>
      </div>
    </div>
  );
}
