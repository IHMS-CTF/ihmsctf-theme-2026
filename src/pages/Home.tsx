import React, { useEffect } from 'react';
import axios from 'axios';
import { Terminal, Shield, Target, Database, Cpu, Globe, ChevronRight } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string, params?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  useEffect(() => {
    axios.get('/api/config').then(() => {}).catch(console.error);
  }, []);

  return (
    <div className="space-y-10 py-6 animate-fade-in">
      
      {/* Hero Section */}
      <section className="edex-panel-accent p-10 relative overflow-hidden">
        <div className="hero-bg-icon">
          <Terminal className="h-32 w-auto text-edex-primary" />
        </div>
        
        <div className="max-w-2xl space-y-6 relative z-10">
          <div>
            <div className="edex-page-subtitle">
              <div className="edex-status-online"></div>
              System Online
            </div>
            <h1 className="edex-page-title">
              IHMS Cyber<br/>
              <span className="edex-page-title-accent">Defense Exercise</span>
            </h1>
          </div>
          
          <p className="text-edex-text-secondary text-lg leading-relaxed max-w-xl">
            Welcome to the Indian Hills Middle School Cybersecurity Training Platform. 
            Test your skills, solve challenges, and compete with your peers.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => onNavigate('challenges')}
              className="edex-btn-primary"
            >
              <Target className="h-4 w-auto" />
              Start Challenges
              <ChevronRight className="h-4 w-auto" />
            </button>
            <button 
              onClick={() => onNavigate('scoreboard')}
              className="edex-btn-secondary"
            >
              <Database className="h-4 w-auto" />
              View Scoreboard
            </button>
          </div>
        </div>

        {/* Decorative Grid Background */}
        <div className="edex-grid-bg absolute inset-0 opacity-30 pointer-events-none"></div>
      </section>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="edex-card group">
          <div className="feature-icon group-hover:bg-edex-primary group-hover:text-white">
            <Shield className="h-6 w-auto" />
          </div>
          <h3 className="text-lg font-bold text-edex-text mb-3">Secure Environment</h3>
          <p className="text-edex-text-secondary text-sm leading-relaxed">
            Practice in a safe, isolated environment. All traffic is encrypted and monitored for educational purposes.
          </p>
        </div>

        <div className="edex-card group">
          <div className="feature-icon group-hover:bg-edex-primary group-hover:text-white">
            <Cpu className="h-6 w-auto" />
          </div>
          <h3 className="text-lg font-bold text-edex-text mb-3">Real-Time Scoring</h3>
          <p className="text-edex-text-secondary text-sm leading-relaxed">
            Track your progress instantly. See how you rank against other participants in real-time.
          </p>
        </div>

        <div className="edex-card group">
          <div className="feature-icon group-hover:bg-edex-primary group-hover:text-white">
            <Globe className="h-6 w-auto" />
          </div>
          <h3 className="text-lg font-bold text-edex-text mb-3">Team Collaboration</h3>
          <p className="text-edex-text-secondary text-sm leading-relaxed">
            Work together with your team to solve challenges. Share knowledge and learn from each other.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="edex-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="edex-status-online"></div>
          <span className="text-sm text-edex-text-secondary">
            System operational. All services running normally.
          </span>
        </div>
        <span className="text-xs text-edex-text-muted hidden sm:inline">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default Home;
