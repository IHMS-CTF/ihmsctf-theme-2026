import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, AlertCircle } from 'lucide-react';

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
    <div className="max-w-md mx-auto mt-20 p-10 bg-slate-900 border border-white/5 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 mb-6">
          <LogIn className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Login</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Sign in to your CTFd account.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 mb-8 rounded-xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1" htmlFor="username">Username</label>
          <input
            className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-700 outline-none transition-all font-bold tracking-widest"
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1" htmlFor="password">Password</label>
          <input
            className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-700 outline-none transition-all font-bold tracking-widest"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-xs ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="submit"
          disabled={loading}
        >
          <span>{loading ? 'Logging in...' : 'Login'}</span>
        </button>
      </form>
    </div>
  );
};

export default Login;
