import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Receipt, 
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { StatCard } from '../components/StatCard.jsx';
import { MonthlyChart } from '../components/MonthlyChart.jsx';
import { CategoryPieChart } from '../components/CategoryPieChart.jsx';
import { formatINR, formatDate } from '../utils/formatters.js';

export function DashboardPage({ onNavigateTransactions, onOpenNewTransaction }) {
  const [summaryData, setSummaryData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, monthRes, catRes, txRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/reports/monthly?months=6'),
        api.get('/reports/categories'),
        api.get('/transactions?limit=5&sortBy=date&sortOrder=desc')
      ]);

      setSummaryData(sumRes.data);
      setMonthlyData(monthRes.data || []);
      setCategoryData(catRes.data || []);
      setRecentTransactions(txRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="content-area">
        <div className="empty-state" style={{ minHeight: '400px' }}>
          <p className="empty-desc">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area">
        <div className="empty-state">
          <div className="empty-icon" style={{ backgroundColor: '#ffe4e6', color: '#e11d48' }}>
            <AlertCircle size={28} />
          </div>
          <h3 className="empty-title">Unable to load dashboard</h3>
          <p className="empty-desc">{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary btn-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, monthOverMonth } = summaryData || {};

  return (
    <div className="content-area">
      {/* Disclaimer Alert */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '24px',
        fontSize: '0.85rem',
        color: '#1e40af',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Calendar size={18} />
        <span>
          <strong>Note:</strong> Financial summaries reflect records entered into this application and distinguish net cash flow from external bank accounts.
        </span>
      </div>

      {/* Top Summary Metrics */}
      <div className="stats-grid">
        <StatCard
          title="Total Income"
          value={summary?.formattedIncome || '₹0.00'}
          type="income"
          icon={ArrowUpRight}
          trendPercent={monthOverMonth?.incomeChangePercent}
          subtitle="vs previous month"
        />
        <StatCard
          title="Total Expenses"
          value={summary?.formattedExpense || '₹0.00'}
          type="expense"
          icon={ArrowDownRight}
          trendPercent={monthOverMonth?.expenseChangePercent}
          subtitle="vs previous month"
        />
        <StatCard
          title="Net Cash Flow"
          value={summary?.formattedNetCashFlow || '₹0.00'}
          type="balance"
          icon={Wallet}
          subtitle={`${summary?.totalTransactions || 0} total transactions recorded`}
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Income vs Expenses (Monthly)</h2>
          </div>
          <MonthlyChart data={monthlyData} />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Category Distribution</h2>
          </div>
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="table-card">
        <div className="table-toolbar">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            Recent Transactions
          </h2>
          <button
            onClick={onNavigateTransactions}
            className="btn btn-secondary btn-sm"
            id="btn-view-all-tx"
          >
            <span>View All</span>
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="data-table-container">
          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Receipt size={24} />
              </div>
              <h3 className="empty-title">No transactions yet</h3>
              <p className="empty-desc">Record your first income or expense to see it here.</p>
              <button onClick={onOpenNewTransaction} className="btn btn-primary btn-sm">
                Add Transaction
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: '#475569' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {tx.description}
                    </td>
                    <td>
                      <span className="category-tag">{tx.category}</span>
                    </td>
                    <td>
                      <span className={`pill ${tx.type}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`amount-display ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
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
