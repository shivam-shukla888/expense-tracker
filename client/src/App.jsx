import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Navbar } from './components/Navbar.jsx';
import { TransactionModal } from './components/TransactionModal.jsx';

import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { TransactionsPage } from './pages/TransactionsPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';

function MainLayout() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'transactions' | 'reports'
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontWeight: 600, color: '#94a3b8' }}>Loading RupeeTrack...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Authenticated App
  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Financial Overview';
      case 'transactions':
        return 'Transactions History';
      case 'reports':
        return 'Analytics & Reports';
      default:
        return 'Dashboard';
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-wrapper">
        <Navbar
          title={getPageTitle()}
          onOpenNewTransaction={() => setIsAddModalOpen(true)}
          onRefresh={handleRefresh}
          setMobileOpen={setMobileOpen}
        />

        <main key={refreshKey}>
          {currentView === 'dashboard' && (
            <DashboardPage
              onNavigateTransactions={() => setCurrentView('transactions')}
              onOpenNewTransaction={() => setIsAddModalOpen(true)}
            />
          )}

          {currentView === 'transactions' && (
            <TransactionsPage />
          )}

          {currentView === 'reports' && (
            <ReportsPage />
          )}
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={handleRefresh}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
