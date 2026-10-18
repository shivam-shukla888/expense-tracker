import React, { useState } from 'react';
import { IndianRupee, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Welcome back to RupeeTrack!', 'success');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@expensetracker.local');
    setPassword('DemoUser@2026');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="brand-icon-box" style={{ width: '44px', height: '44px' }}>
              <IndianRupee size={24} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="auth-title">Welcome to RupeeTrack</h1>
          <p className="auth-subtitle">Sign in to track your personal finance and cash flow</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffe4e6',
            color: '#e11d48',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            border: '1px solid #fecdd3'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                required
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="btn-login-submit"
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          onClick={fillDemoAccount}
          className="btn btn-secondary btn-full btn-sm"
          id="btn-use-demo"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Sparkles size={16} color="#059669" />
          <span>Fill Demo Credentials (1-Click)</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#64748b' }}>
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#059669',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            id="link-switch-register"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
