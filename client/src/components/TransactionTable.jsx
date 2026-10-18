import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters.js';

export function TransactionTable({
  transactions,
  pagination,
  loading,
  filters,
  onFilterChange,
  onPageChange,
  onEdit,
  onDelete,
  onResetFilters
}) {
  const categoriesList = [
    'All Categories',
    'Salary', 'Freelance', 'Business', 'Investment Returns',
    'Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Entertainment', 'Other'
  ];

  const handleSortToggle = (field) => {
    if (filters.sortBy === field) {
      onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onFilterChange('sortBy', field);
      onFilterChange('sortOrder', 'desc');
    }
  };

  return (
    <div className="table-card">
      {/* Toolbar / Filters */}
      <div className="table-toolbar">
        <div className="toolbar-filters">
          {/* Search */}
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search description..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              id="input-search"
            />
          </div>

          {/* Type Filter */}
          <select
            className="select-filter"
            value={filters.type || ''}
            onChange={(e) => onFilterChange('type', e.target.value)}
            id="select-type-filter"
          >
            <option value="">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>

          {/* Category Filter */}
          <select
            className="select-filter"
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            id="select-category-filter"
          >
            {categoriesList.map((c) => (
              <option key={c} value={c === 'All Categories' ? '' : c}>
                {c}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            className="date-filter"
            title="Start Date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            id="input-start-date"
          />
          <input
            type="date"
            className="date-filter"
            title="End Date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            id="input-end-date"
          />

          {(filters.search || filters.type || filters.category || filters.startDate || filters.endDate) && (
            <button
              onClick={onResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
              id="btn-clear-filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="data-table-container">
        {loading ? (
          <div className="empty-state">
            <p className="empty-desc">Loading transaction records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Receipt size={28} />
            </div>
            <h3 className="empty-title">No transactions found</h3>
            <p className="empty-desc">
              {(filters.search || filters.type || filters.category || filters.startDate || filters.endDate)
                ? 'Try adjusting your search query or filter selections.'
                : 'Get started by recording your first income or expense transaction.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSortToggle('date')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Date</span>
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Description</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSortToggle('category')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Category</span>
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Type</th>
                <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSortToggle('amount')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <span>Amount</span>
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
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
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button
                        onClick={() => onEdit(tx)}
                        className="btn-icon"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                        id={`btn-edit-${tx.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        className="btn-icon delete"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                        id={`btn-delete-${tx.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-bar">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalRecords} records)
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-secondary btn-sm"
              id="btn-prev-page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-secondary btn-sm"
              id="btn-next-page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
