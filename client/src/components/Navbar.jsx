import React from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';

export function Navbar({ title, onOpenNewTransaction, onRefresh, setMobileOpen }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          id="btn-mobile-menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-actions">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh Data"
            aria-label="Refresh Data"
            id="btn-refresh"
          >
            <RefreshCw size={15} />
            <span style={{ display: 'none' }}>Refresh</span>
          </button>
        )}
        <button
          onClick={onOpenNewTransaction}
          className="btn btn-primary"
          id="btn-add-transaction"
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
      </div>
    </header>
  );
}
