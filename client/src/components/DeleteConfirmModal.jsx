import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR } from '../utils/formatters.js';

export function DeleteConfirmModal({ isOpen, onClose, onDeleted, transaction }) {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/transactions/${transaction.id}`);
      showToast('Transaction deleted successfully', 'success');
      onDeleted();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#ffe4e6',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={18} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.1rem' }}>Delete Transaction</h2>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '12px' }}>
            Are you sure you want to permanently delete this transaction? This action cannot be undone.
          </p>
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
              {transaction.description}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Amount: <strong style={{ color: transaction.type === 'income' ? '#059669' : '#e11d48' }}>
                {formatINR(transaction.amount)}
              </strong> • {transaction.category} • {transaction.date}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={deleting}
            id="btn-confirm-delete"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
