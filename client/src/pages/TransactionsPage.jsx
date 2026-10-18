import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { TransactionTable } from '../components/TransactionTable.jsx';
import { TransactionModal } from '../components/TransactionModal.jsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.jsx';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.type) queryParams.set('type', filters.type);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      queryParams.set('sortBy', filters.sortBy);
      queryParams.set('sortOrder', filters.sortOrder);
      queryParams.set('page', filters.page.toString());
      queryParams.set('limit', filters.limit.toString());

      const res = await api.get(`/transactions?${queryParams.toString()}`);
      setTransactions(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalRecords: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset to page 1 on filter/search change
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (newPage) => {
    handleFilterChange('page', newPage);
  };

  return (
    <div className="content-area">
      <TransactionTable
        transactions={transactions}
        pagination={pagination}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onEdit={(tx) => setEditingTransaction(tx)}
        onDelete={(tx) => setDeletingTransaction(tx)}
        onResetFilters={handleResetFilters}
      />

      {/* Edit Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={Boolean(editingTransaction)}
          transactionToEdit={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSaved={fetchTransactions}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingTransaction)}
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onDeleted={fetchTransactions}
        />
      )}
    </div>
  );
}
