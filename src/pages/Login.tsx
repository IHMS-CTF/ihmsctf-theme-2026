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
    <div className="login-page">
      <div className="login-container">
        <div className="login-panel">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h2 className="login-title">
              ACCESS_TERMINAL
            </h2>
            <p className="login-subtitle">
              Enter credentials to authenticate
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="alert-icon h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">Authentication Failed</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="label" htmlFor="username">
                Username
              </label>
              <div className="input-with-icon">
                <User className="input-icon h-4 w-4" />
                <input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon h-4 w-4" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              className={`login-btn ${loading ? 'btn-ghost cursor-wait' : 'btn-primary-solid'} w-full flex items-center justify-center gap-2`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Authenticate
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-dim text-center">
            <p className="text-xs text-muted">
              All login attempts are logged for security purposes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
