import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart as PieChartIcon, 
  LogOut, 
  IndianRupee,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function Sidebar({ currentView, setCurrentView, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: PieChartIcon }
  ];

  const handleNavClick = (id) => {
    setCurrentView(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileOpen(false)}
          aria-hidden="true" 
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <IndianRupee size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <span className="brand-name">RupeeTrack</span>
            <span className="brand-tag">PRO</span>
          </div>
          {mobileOpen && (
            <button 
              className="btn-icon" 
              style={{ marginLeft: 'auto', color: '#94a3b8' }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                id={`nav-${item.id}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <span className="user-name" title={user?.name}>{user?.name}</span>
              <span className="user-email" title={user?.email}>{user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="nav-item"
            style={{ color: '#f87171' }}
            id="btn-logout"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
