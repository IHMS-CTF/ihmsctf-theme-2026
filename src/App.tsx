import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LogOut, 
  Menu,
  X,
  User,
  Settings as SettingsIcon,
  Shield,
  Trophy,
  Activity,
  Cpu,
  Terminal,
  Clock,
  Zap,
  LayoutDashboard,
  Target,
  BarChart3,
  Users as UsersIcon,
  Globe
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
import ChallengeDetail from './pages/ChallengeDetail';

const Timer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  
  useEffect(() => {
    // Simulated end time: 48 hours from now for demo
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 48);
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("FINISHED");
        clearInterval(interval);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className="text-edex-cyan font-bold text-xl tabular-nums">
      {timeLeft}
    </span>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({ cpu: 12, ram: 45, latency: 24 });
  
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

    window.addEventListener('popstate', syncStateWithUrl);
    
    // Simulate system stats
    const interval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 20) + 5,
        ram: Math.floor(Math.random() * 10) + 40,
        latency: Math.floor(Math.random() * 30) + 15
      });
    }, 3000);

    return () => {
      window.removeEventListener('popstate', syncStateWithUrl);
      clearInterval(interval);
    };
  }, []);

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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-edex-bg font-mono">
        <Terminal className="h-16 w-16 text-edex-cyan mb-6 animate-pulse" />
        <div className="text-2xl font-bold text-edex-text mb-4">Initializing...</div>
        <div className="w-48 h-1 bg-edex-border overflow-hidden rounded">
          <div className="w-full h-full bg-edex-cyan animate-pulse"></div>
        </div>
      </div>
    );
  }

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
      case 'challenge-detail': return <ChallengeDetail id={viewParams.id} onNavigate={navigate} />;
      case 'settings': return <Settings onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  const NavItem = ({ icon: Icon, label, id, active }: { icon: any, label: string, id: string, active: boolean }) => (
    <button 
      onClick={() => navigate(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-sm font-medium ${
        active 
          ? 'edex-nav-active' 
          : 'edex-nav-item'
      }`}
    >
      <Icon className={`h-4 w-auto ${active ? 'text-edex-cyan' : ''}`} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-screen bg-edex-bg text-edex-text font-mono flex flex-col overflow-hidden select-none">
      
      {/* Top Header */}
      <header className="header">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-auto text-edex-primary" />
            <span className="text-base font-bold text-edex-text">
              IHMS<span className="text-edex-primary">CTF</span>
            </span>
          </div>
          
          {/* System Stats - desktop only */}
          <div className="header-stats">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-auto" />
              <span>CPU: {stats.cpu}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-auto" />
              <span>MEM: {stats.ram}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-auto" />
              <span>LAT: {stats.latency}ms</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="status-indicator">
            <div className="edex-status-online"></div>
            <span className="text-xs font-medium text-edex-success">Online</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <span className="user-name">
                {user.name}
              </span>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Left Sidebar - Navigation */}
        <aside className="sidebar-left">
          <nav className="flex-grow py-4">
            <div className="px-4 mb-2">
              <span className="text-xs font-semibold text-edex-text-muted uppercase tracking-wider">Navigation</span>
            </div>
            <div className="nav-group">
              <NavItem icon={LayoutDashboard} label="Home" id="home" active={activeView === 'home'} />
              {user && (
                <>
                  <NavItem icon={Target} label="Challenges" id="challenges" active={activeView === 'challenges'} />
                  <NavItem icon={BarChart3} label="Scoreboard" id="scoreboard" active={activeView === 'scoreboard'} />
                  <NavItem icon={UsersIcon} label="Users" id="users" active={activeView === 'users'} />
                  <NavItem icon={Globe} label="Teams" id="teams" active={activeView === 'teams'} />
                </>
              )}
            </div>

            <div className="px-4 mt-6 mb-2">
              <span className="text-xs font-semibold text-edex-text-muted uppercase tracking-wider">Account</span>
            </div>
            <div className="nav-group">
              {user ? (
                <>
                  <NavItem icon={Shield} label="Profile" id="team-profile" active={activeView === 'team-profile'} />
                  <NavItem icon={SettingsIcon} label="Settings" id="settings" active={activeView === 'settings'} />
                </>
              ) : (
                <NavItem icon={User} label="Login" id="login" active={activeView === 'login'} />
              )}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-edex-border">
            <div className="edex-panel p-4 text-center">
              <Terminal className="h-8 w-auto text-edex-text-muted mx-auto mb-2 opacity-50" />
              <div className="text-xs text-edex-text-muted">v1.4.0</div>
            </div>
          </div>
        </aside>

        {/* Central Viewport */}
        <main className="main-content">
          <div className={`flex-grow overflow-y-auto edex-scrollbar ${activeView === 'challenges' ? 'p-2' : 'p-6'}`}>
            <div className={`max-w-6xl mx-auto ${activeView === 'challenges' ? 'h-full' : ''}`}>
              {renderView()}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Stats & Info */}
        <aside className="sidebar-right">
          <div className="p-4 space-y-6">
            {/* Mission Clock */}
            <div className="edex-panel p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-edex-text-muted uppercase tracking-wider mb-3">
                <Clock className="h-4 w-auto" />
                Time Remaining
              </div>
              <Timer />
              <div className="text-xs text-edex-text-muted mt-1">Until competition ends</div>
            </div>

            {/* System Log */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-edex-text-muted uppercase tracking-wider mb-3">
                <Activity className="h-4 w-auto" />
                Activity Log
              </div>
              <div className="edex-panel bg-edex-bg p-3 h-52 overflow-hidden text-xs space-y-2">
                <div className="flex gap-2">
                  <span className="text-edex-success">[OK]</span>
                  <span className="text-edex-text-secondary">System initialized</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-edex-cyan">[INFO]</span>
                  <span className="text-edex-text-secondary">Connected to CTFd API</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-edex-success">[OK]</span>
                  <span className="text-edex-text-secondary">Session active</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-edex-text-muted animate-pulse">_</span>
                  <span className="text-edex-text-muted">Awaiting input...</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="edex-panel p-3 text-center">
                <div className="text-xs text-edex-text-muted mb-1">Network</div>
                <div className="text-sm font-bold text-edex-text">Secure</div>
              </div>
              <div className="edex-panel p-3 text-center">
                <div className="text-xs text-edex-text-muted mb-1">Protocol</div>
                <div className="text-sm font-bold text-edex-text">TLS 1.3</div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-edex-border">
            <p className="text-xs text-edex-text-muted leading-relaxed">
              Indian Hills Middle School Cybersecurity Training Platform
            </p>
          </div>
        </aside>
      </div>

      {/* Footer Status Bar */}
      <footer className="footer">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="status-dot"></div>
            <span>IHMS Cybersec</span>
          </div>
          <span className="footer-version">v1.4.0</span>
          <span className="footer-session">
            {user ? `Session: ${user.name}` : 'Guest Mode'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="footer-coords">39.0062° N, 94.6293° W</span>
        </div>
      </footer>

      {/* Mobile Menu Button */}
      <div className="mobile-menu-btn">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="mobile-fab"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <div className="text-xl font-bold text-edex-text mb-8">Navigation</div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('home')} className="mobile-menu-item">
              Home
            </button>
            {user && (
              <>
                <button onClick={() => navigate('challenges')} className="mobile-menu-item">
                  Challenges
                </button>
                <button onClick={() => navigate('scoreboard')} className="mobile-menu-item">
                  Scoreboard
                </button>
              </>
            )}
            <div className="border-t border-edex-border my-4"></div>
            {user ? (
              <button onClick={handleLogout} className="mobile-menu-item text-edex-error">
                Logout
              </button>
            ) : (
              <button onClick={() => navigate('login')} className="mobile-menu-item text-edex-cyan">
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
