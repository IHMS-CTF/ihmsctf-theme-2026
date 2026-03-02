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
  Globe,
  Wifi,
  ChevronRight
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

// Live clock component
const Timer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className="text-green font-bold text-xl tabular-nums">
      {currentTime}
    </span>
  );
};

// Hex stream decoration
const HexStream: React.FC = () => {
  const [hex, setHex] = useState('');
  
  useEffect(() => {
    const generateHex = () => {
      let result = '';
      for (let i = 0; i < 200; i++) {
        result += Math.floor(Math.random() * 16).toString(16).toUpperCase();
        if (i % 2 === 1) result += ' ';
      }
      setHex(result);
    };
    
    generateHex();
    const interval = setInterval(generateHex, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return <div className="hex-stream">{hex}</div>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({ cpu: 12, ram: 45, latency: 24 });
  const [activityLog, setActivityLog] = useState<any[]>([]);
  
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
    const statsInterval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 20) + 5,
        ram: Math.floor(Math.random() * 10) + 40,
        latency: Math.floor(Math.random() * 30) + 15
      });
    }, 3000);

    // Fetch activity log (recent solves from scoreboard)
    const fetchActivity = () => {
      axios.get('/api/scoreboard')
        .then(res => {
          const teams = res.data || [];
          const logs = teams.slice(0, 5).map((team: any, idx: number) => ({
            type: idx === 0 ? 'solve' : 'info',
            team: team.name,
            score: team.score
          }));
          setActivityLog(logs);
        })
        .catch(() => setActivityLog([]));
    };

    fetchActivity();
    const activityInterval = setInterval(fetchActivity, 30000);

    return () => {
      window.removeEventListener('popstate', syncStateWithUrl);
      clearInterval(statsInterval);
      clearInterval(activityInterval);
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

  // Loading screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-void font-mono">
        <Terminal className="h-16 w-16 text-maroon mb-6 animate-pulse" />
        <div className="text-2xl font-bold text-primary mb-4 font-display tracking-widest">
          INITIALIZING<span className="animate-blink">_</span>
        </div>
        <div className="w-48 h-1 bg-border-dim overflow-hidden">
          <div className="w-full h-full bg-maroon animate-pulse"></div>
        </div>
        <div className="mt-4 text-xs text-muted uppercase tracking-widest">
          Loading system modules...
        </div>
      </div>
    );
  }

  let activeView = view;
  if (!user && !['home', 'login', 'scoreboard'].includes(view)) {
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
      className={`nav-item w-full ${active ? 'active' : ''}`}
    >
      <Icon className="nav-icon" />
      <span className="flex-grow text-left">{label}</span>
      <ChevronRight className="nav-arrow h-4 w-4" />
    </button>
  );

  return (
    <div className="app-container">
      
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <Trophy className="logo-icon" />
          <span className="logo-text">
            IHMS<span className="logo-accent">CTF</span>
          </span>
        </div>
        
        {/* System Stats - desktop only */}
        <div className="header-stats">
          <div className="stat-item">
            <Cpu className="h-3 w-3" />
            <span>CPU:</span>
            <span className="stat-value">{stats.cpu}%</span>
          </div>
          <div className="stat-item">
            <Activity className="h-3 w-3" />
            <span>MEM:</span>
            <span className="stat-value">{stats.ram}%</span>
          </div>
          <div className="stat-item">
            <Zap className="h-3 w-3" />
            <span>LAT:</span>
            <span className="stat-value">{stats.latency}ms</span>
          </div>
        </div>

        <div className="header-user">
          <div className="status-indicator">
            <div className="status-dot online"></div>
            <span>ONLINE</span>
          </div>
          
          {user && (
            <>
              <span className="user-name">{user.name}</span>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="sidebar-left">
        <nav className="flex-grow">
          <div className="nav-group">
            <div className="nav-group-title">System</div>
            <NavItem icon={LayoutDashboard} label="Dashboard" id="home" active={activeView === 'home'} />
            <NavItem icon={BarChart3} label="Scoreboard" id="scoreboard" active={activeView === 'scoreboard'} />
          </div>

          {user && (
            <div className="nav-group">
              <div className="nav-group-title">Operations</div>
              <NavItem icon={Target} label="Challenges" id="challenges" active={activeView === 'challenges'} />
              <NavItem icon={UsersIcon} label="Users" id="users" active={activeView === 'users'} />
              <NavItem icon={Globe} label="Teams" id="teams" active={activeView === 'teams'} />
            </div>
          )}

          <div className="nav-group">
            <div className="nav-group-title">Account</div>
            {user ? (
              <>
                <NavItem icon={Shield} label="My Team" id="team-profile" active={activeView === 'team-profile'} />
                <NavItem icon={SettingsIcon} label="Settings" id="settings" active={activeView === 'settings'} />
              </>
            ) : (
              <NavItem icon={User} label="Login" id="login" active={activeView === 'login'} />
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-line">
              <span>SYS</span>
              <span className="status-value">OK</span>
            </div>
            <div className="status-line">
              <span>NET</span>
              <span className="status-value">SECURE</span>
            </div>
            <div className="status-line">
              <span>VER</span>
              <span className="status-value">1.4.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className={`content-area ${activeView === 'challenges' ? 'p-2' : ''}`}>
          <div className={`mx-auto ${activeView === 'challenges' ? 'h-full max-w-7xl' : 'max-w-6xl'}`}>
            {renderView()}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Widgets */}
      <aside className="sidebar-right">
        {/* Time Widget */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Clock className="inline h-3 w-3 mr-1" />
              System Time
            </div>
          </div>
          <div className="widget-content">
            <Timer />
            <div className="text-xs text-muted mt-1">Local timezone</div>
          </div>
        </div>

        {/* Activity Feed Widget */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Activity className="inline h-3 w-3 mr-1" />
              Activity Feed
            </div>
            <span className="widget-action">View all</span>
          </div>
          <div className="widget-content">
            <div className="terminal-panel p-3 h-48 overflow-y-auto custom-scrollbar text-xs space-y-2 bg-terminal">
              {activityLog.length > 0 ? (
                activityLog.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className={log.type === 'solve' ? 'text-success' : 'text-cyan'}>
                      [{log.type === 'solve' ? 'SOLVE' : 'INFO'}]
                    </span>
                    <span className="text-secondary truncate">
                      {log.team}: {log.score} pts
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex gap-2">
                    <span className="text-success">[OK]</span>
                    <span className="text-secondary">System initialized</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan">[INFO]</span>
                    <span className="text-secondary">Connected to CTFd</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted animate-blink">_</span>
                    <span className="text-muted">Awaiting data...</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Network Status Widget */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Wifi className="inline h-3 w-3 mr-1" />
              Network
            </div>
          </div>
          <div className="widget-content">
            <div className="grid grid-cols-2 gap-2">
              <div className="terminal-panel p-2 text-center">
                <div className="text-xs text-muted">Protocol</div>
                <div className="text-sm font-bold text-primary">TLS 1.3</div>
              </div>
              <div className="terminal-panel p-2 text-center">
                <div className="text-xs text-muted">Status</div>
                <div className="text-sm font-bold text-success">Secure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hex Stream Decoration */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">
              <Terminal className="inline h-3 w-3 mr-1" />
              Data Stream
            </div>
          </div>
          <div className="widget-content">
            <div className="terminal-panel p-2 h-16 overflow-hidden bg-terminal">
              <HexStream />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-auto p-4 border-t border-dim text-xs text-muted">
          Indian Hills Middle School<br />
          CTF Competition Platform
        </div>
      </aside>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>IHMS_CTF_v1.4.0</span>
          </div>
          <span className="footer-item">
            {user ? `SESSION: ${user.name.toUpperCase()}` : 'GUEST_MODE'}
          </span>
        </div>
        <div className="footer-center">
          Capture The Flag Competition System
        </div>
        <div className="footer-right">
          <span className="footer-item">39.0062N 94.6293W</span>
          <span className="footer-item tabular-nums">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
          </span>
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
          <div className="mobile-menu-header">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-maroon" />
              <span className="font-display font-bold tracking-wide">IHMS<span className="text-maroon">CTF</span></span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="close-btn" aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* User info section for mobile */}
          {user && (
            <div className="mobile-user-info mb-4">
              <div className="user-badge">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <div className="user-name">{user.name}</div>
                  <div className="user-status">Online</div>
                </div>
              </div>
            </div>
          )}
          
          <nav className="mobile-menu-nav">
            <button onClick={() => navigate('home')} className={`mobile-nav-item ${activeView === 'home' ? 'active' : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>
            <button onClick={() => navigate('scoreboard')} className={`mobile-nav-item ${activeView === 'scoreboard' ? 'active' : ''}`}>
              <BarChart3 className="h-5 w-5" />
              Scoreboard
            </button>
            {user && (
              <>
                <button onClick={() => navigate('challenges')} className={`mobile-nav-item ${activeView === 'challenges' ? 'active' : ''}`}>
                  <Target className="h-5 w-5" />
                  Challenges
                </button>
                <button onClick={() => navigate('users')} className={`mobile-nav-item ${activeView === 'users' ? 'active' : ''}`}>
                  <UsersIcon className="h-5 w-5" />
                  Users
                </button>
                <button onClick={() => navigate('teams')} className={`mobile-nav-item ${activeView === 'teams' ? 'active' : ''}`}>
                  <Globe className="h-5 w-5" />
                  Teams
                </button>
              </>
            )}
            
            <div className="border-t border-dim my-4"></div>
            
            {user ? (
              <>
                <button onClick={() => navigate('team-profile')} className={`mobile-nav-item ${activeView === 'team-profile' ? 'active' : ''}`}>
                  <Shield className="h-5 w-5" />
                  My Team
                </button>
                <button onClick={() => navigate('settings')} className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`}>
                  <SettingsIcon className="h-5 w-5" />
                  Settings
                </button>
                <button onClick={handleLogout} className="mobile-nav-item text-error">
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => navigate('login')} className={`mobile-nav-item ${activeView === 'login' ? 'active' : ''}`}>
                <User className="h-5 w-5" />
                Login
              </button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
};

export default App;
