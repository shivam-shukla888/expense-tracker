import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Entertainment', 'Other'];

export function TransactionModal({ isOpen, onClose, onSaved, transactionToEdit = null }) {
  const { showToast } = useToast();

  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setDate(transactionToEdit.date);
    } else {
      setType('expense');
      setCategory('Food');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setErrors({});
  }, [transactionToEdit, isOpen]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'income' ? 'Salary' : 'Food');
  };

  const validate = () => {
    const errs = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than ₹0';
    } else if (parsedAmount > 1000000000) {
      errs.amount = 'Amount cannot exceed ₹1,000,000,000';
    }

    if (!description.trim()) {
      errs.description = 'Description is required';
    } else if (description.trim().length > 255) {
      errs.description = 'Description cannot exceed 255 characters';
    }

    if (!date) {
      errs.date = 'Date is required';
    }

    if (!category) {
      errs.category = 'Category is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        type,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        date
      };

      if (transactionToEdit) {
        await api.put(`/transactions/${transactionToEdit.id}`, payload);
        showToast('Transaction updated successfully', 'success');
      } else {
        await api.post('/transactions', payload);
        showToast('Transaction recorded successfully', 'success');
      }

      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button 
            onClick={onClose} 
            className="btn-icon" 
            aria-label="Close modal"
            id="btn-close-modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type Selector */}
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => handleTypeChange('expense')}
                id="btn-toggle-expense"
              >
                <ArrowDownRight size={18} />
                Expense
              </button>
              <button
                type="button"
                className={`type-toggle-btn ${type === 'income' ? 'active income' : ''}`}
                onClick={() => handleTypeChange('income')}
                id="btn-toggle-income"
              >
                <ArrowUpRight size={18} />
                Income
              </button>
            </div>

            {/* Amount (₹) */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-amount">Amount (INR ₹)</label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                max="1000000000"
                className="form-input"
                placeholder="e.g. 1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>

            {/* Category Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-category">Category</label>
              <select
                id="tx-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="tx-date">Transaction Date</label>
              <input
                id="tx-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="tx-description">Description</label>
              <input
                id="tx-description"
                type="text"
                maxLength={255}
                className="form-input"
                placeholder="e.g. Supermarket grocery haul"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="btn-submit-transaction"
            >
              {submitting ? 'Saving...' : (transactionToEdit ? 'Save Changes' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
