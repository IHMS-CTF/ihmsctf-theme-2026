import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LogOut, 
  Menu,
  X,
  User,
  Settings as SettingsIcon,
  Shield,
  Trophy
} from 'lucide-react';

// Components
import Home from './pages/Home';
import Login from './pages/Login';
import Challenges from './pages/Challenges';
import Scoreboard from './pages/Scoreboard';
import Users from './pages/Users';
import Teams from './pages/Teams';
import TeamProfile from './pages/TeamProfile';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Single-route navigation state
  const [view, setView] = useState('home');
  const [viewParams, setViewParams] = useState<any>({});

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/user');
      if (response.data.logged_in) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize state with URL parameters
  useEffect(() => {
    const syncStateWithUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || 'home';
      const idParam = params.get('id');
      
      setView(viewParam);
      if (idParam) setViewParams({ id: idParam });
      else setViewParams({});
    };

    syncStateWithUrl();
    checkAuth();

    // Handle browser back/forward buttons
    window.addEventListener('popstate', syncStateWithUrl);
    return () => window.removeEventListener('popstate', syncStateWithUrl);
  }, []);

  // Update URL when view changes
  const navigate = (newView: string, params: any = {}) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    if (params.id) {
      url.searchParams.set('id', params.id);
    } else {
      url.searchParams.delete('id');
    }
    
    window.history.pushState({}, '', url.toString());
    setView(newView);
    setViewParams(params);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      navigate('home');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-950 text-blue-500 font-mono">LOADING...</div>;
  }

  // Auth Redirection Logic
  let activeView = view;
  if (!user && !['home', 'login'].includes(view)) {
    activeView = 'login';
  }

  const renderView = () => {
    switch (activeView) {
      case 'home': return <Home onNavigate={navigate} />;
      case 'login': return <Login onLogin={checkAuth} onNavigate={navigate} />;
      case 'challenges': return <Challenges onNavigate={navigate} />;
      case 'scoreboard': return <Scoreboard onNavigate={navigate} />;
      case 'users': return <Users onNavigate={navigate} />;
      case 'teams': return <Teams onNavigate={navigate} />;
      case 'team-profile': return <TeamProfile id={viewParams.id} onNavigate={navigate} />;
      case 'settings': return <Settings onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => navigate('home')} className="flex items-center space-x-2 group">
                <Trophy className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold tracking-tight text-white">CTFd</span>
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate('home')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === 'home' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>Home</button>
              {user && (
                <>
                  <button onClick={() => navigate('challenges')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === 'challenges' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>Challenges</button>
                  <button onClick={() => navigate('scoreboard')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === 'scoreboard' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>Scoreboard</button>
                  <button onClick={() => navigate('users')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === 'users' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>Users</button>
                  <button onClick={() => navigate('teams')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === 'teams' ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>Teams</button>
                </>
              )}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 bg-slate-800/50 hover:bg-slate-800 border border-white/5 pl-4 pr-3 py-1.5 rounded-xl transition-all"
                  >
                    <span className="text-sm font-bold text-white">{user.name}</span>
                    <div className="bg-blue-600/10 p-1 rounded-lg text-blue-500">
                      <User className="h-4 w-4" />
                    </div>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/5 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-150">
                       {user.team_id && (
                         <button onClick={() => navigate('team-profile', { id: user.team_id })} className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-600/10 text-slate-300 hover:text-blue-400 transition-all text-left">
                           <Shield className="h-4 w-4" />
                           <span className="text-xs font-bold uppercase">Team</span>
                         </button>
                       )}
                       <button onClick={() => navigate('settings')} className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-600/10 text-slate-300 hover:text-blue-400 transition-all text-left">
                         <SettingsIcon className="h-4 w-4" />
                         <span className="text-xs font-bold uppercase">Settings</span>
                       </button>
                       <div className="h-px bg-white/5 mx-2 my-1"></div>
                       <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-all text-left">
                         <LogOut className="h-4 w-4" />
                         <span className="text-xs font-bold uppercase">Logout</span>
                       </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => navigate('login')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Login
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-400">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-white/5 px-4 py-4 space-y-1">
            <button onClick={() => navigate('home')} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-slate-400 hover:bg-slate-800 hover:text-white">Home</button>
            {user && (
              <>
                <button onClick={() => navigate('challenges')} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-slate-400 hover:bg-slate-800 hover:text-white">Challenges</button>
                <button onClick={() => navigate('scoreboard')} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-slate-400 hover:bg-slate-800 hover:text-white">Scoreboard</button>
                <button onClick={() => navigate('users')} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-slate-400 hover:bg-slate-800 hover:text-white">Users</button>
                <button onClick={() => navigate('teams')} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-slate-400 hover:bg-slate-800 hover:text-white">Teams</button>
                <button onClick={() => navigate('settings')} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-slate-400 hover:bg-slate-800 hover:text-white">Settings</button>
              </>
            )}
            {user ? (
              <button onClick={handleLogout} className="w-full text-left px-3 py-3 rounded-xl text-xs font-bold uppercase text-red-400 hover:bg-red-950/30">Logout</button>
            ) : (
              <button onClick={() => navigate('login')} className="w-full bg-blue-600 py-3 rounded-xl text-xs font-bold uppercase text-center">Login</button>
            )}
          </div>
        )}
      </nav>

      {/* Main Viewport */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </div>

      <footer className="py-10 text-center border-t border-white/5 mt-auto">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Powered by CTFd</p>
      </footer>
    </div>
  );
};

export default App;
