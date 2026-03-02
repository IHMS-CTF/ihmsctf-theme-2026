import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, AlertCircle, ShieldCheck, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onNavigate: (view: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/login', { username, password });
      if (response.data.success) {
        onLogin();
        onNavigate('challenges');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 animate-zoom-in">
      <div className="edex-panel-accent p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="login-icon">
            <ShieldCheck className="h-10 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-edex-text mb-2">
            Welcome Back
          </h2>
          <p className="text-edex-text-secondary">
            Sign in to access the CTF platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="edex-alert-error mb-6">
            <AlertCircle className="h-5 w-auto flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Authentication Failed</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="edex-label flex items-center justify-between" htmlFor="username">
              <span>Username</span>
              <User className="h-4 w-auto text-edex-text-muted" />
            </label>
            <input
              className="edex-input"
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="edex-label flex items-center justify-between" htmlFor="password">
              <span>Password</span>
              <Lock className="h-4 w-auto text-edex-text-muted" />
            </label>
            <input
              className="edex-input"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="pt-2">
            <button
              className={`w-full ${loading ? 'edex-btn-ghost cursor-wait' : 'edex-btn-primary'}`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-auto" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-edex-border text-center">
          <p className="text-xs text-edex-text-muted">
            All login attempts are logged for security purposes
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
