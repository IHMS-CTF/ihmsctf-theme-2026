import React, { useEffect } from 'react';
import axios from 'axios';
import { Shield, Target, Database, Cpu, Globe, ChevronRight } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string, params?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  useEffect(() => {
    axios.get('/api/config').then(() => {}).catch(console.error);
  }, []);

  return (
    <div className="home-page space-y-10">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-pattern"></div>
        
        <div className="hero-content max-w-2xl space-y-6">
          <div>
            <div className="page-subtitle">
              <div className="status-dot online"></div>
              System Online
            </div>
            <h1 className="hero-title">
              IHMS<br/>
              <span className="title-accent">Capture The Flag</span>
            </h1>
          </div>
          
          <p className="hero-subtitle text-lg leading-relaxed max-w-xl">
            Welcome to the Indian Hills Middle School CTF Competition. 
            Test your skills, solve challenges, and compete for the top spot on the leaderboard.
          </p>
          
          <div className="hero-actions">
            <button 
              onClick={() => onNavigate('challenges')}
              className="btn-primary-solid flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Start Challenges
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onNavigate('scoreboard')}
              className="btn-secondary flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              View Scoreboard
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="feature-title">Secure Environment</h3>
          <p className="feature-desc">
            Practice in a safe, isolated environment. All traffic is encrypted and monitored for educational purposes.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="feature-title">Real-Time Scoring</h3>
          <p className="feature-desc">
            Track your progress instantly. See how you rank against other participants in real-time.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="feature-title">Team Collaboration</h3>
          <p className="feature-desc">
            Work together with your team to solve challenges. Share knowledge and learn from each other.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="terminal-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="status-dot online"></div>
          <span className="text-sm text-secondary">
            System operational. All services running normally.
          </span>
        </div>
        <span className="text-xs text-muted hidden sm:inline">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default Home;
