import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { api } from '../services/api.js';
import { MonthlyChart } from '../components/MonthlyChart.jsx';
import { CategoryPieChart } from '../components/CategoryPieChart.jsx';
import { getCategoryColor } from '../utils/formatters.js';

export function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthsCount, setMonthsCount] = useState(6);

  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);

      const [sumRes, monthRes, catRes] = await Promise.all([
        api.get(`/dashboard/summary?${queryParams.toString()}`),
        api.get(`/reports/monthly?months=${monthsCount}`),
        api.get(`/reports/categories?${queryParams.toString()}`)
      ]);

      setSummary(sumRes.data?.summary);
      setMonthlyData(monthRes.data || []);
      setCategoryData(catRes.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, monthsCount]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetDates = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className="content-area">
        <div className="empty-state" style={{ minHeight: '360px' }}>
          <p className="empty-desc">Aggregating financial reports & trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {/* Date Filter Bar */}
      <div className="table-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="#059669" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Report Timeframe
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>From:</span>
              <input
                type="date"
                className="date-filter"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                id="report-start-date"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>To:</span>
              <input
                type="date"
                className="date-filter"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                id="report-end-date"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={handleResetDates}
                className="btn btn-secondary btn-sm"
              >
                Reset Range
              </button>
            )}

            <div style={{ borderLeft: '1px solid #e2e8f0', height: '24px', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Months:</span>
              <select
                className="select-filter"
                value={monthsCount}
                onChange={(e) => setMonthsCount(Number(e.target.value))}
              >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Period Metrics */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Income for Period</span>
            <div className="stat-icon income">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="stat-value">{summary?.formattedIncome || '₹0.00'}</div>
          <div className="stat-footer">
            <span>{summary?.incomeCount || 0} income credits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Expenses for Period</span>
            <div className="stat-icon expense">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="stat-value">{summary?.formattedExpense || '₹0.00'}</div>
          <div className="stat-footer">
            <span>{summary?.expenseCount || 0} expense debits</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Net Cash Flow</span>
            <div className="stat-icon balance">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value">{summary?.formattedNetCashFlow || '₹0.00'}</div>
          <div className="stat-footer">
            <span>Income minus expenses</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Monthly Cash Flow Trend</h2>
          </div>
          <MonthlyChart data={monthlyData} />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Expense Breakdown by Category</h2>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Category Expense Detail Breakdown Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            Detailed Category Breakdown
          </h2>
        </div>

        <div className="data-table-container">
          {categoryData.length === 0 ? (
            <div className="empty-state">
              <p className="empty-desc">No expense data found for the selected timeframe.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Share of Expenses</th>
                  <th>Transactions</th>
                  <th style={{ textAlign: 'right' }}>Total Expense</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item) => (
                  <tr key={item.category}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getCategoryColor(item.category)
                        }} />
                        <strong style={{ color: '#0f172a' }}>{item.category}</strong>
                      </div>
                    </td>
                    <td style={{ width: '40%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: '#e2e8f0',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${item.percentage}%`,
                            height: '100%',
                            backgroundColor: getCategoryColor(item.category),
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '40px' }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {item.transactionCount} records
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {item.formattedTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
