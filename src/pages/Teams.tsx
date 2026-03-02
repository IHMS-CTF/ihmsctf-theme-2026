import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users as TeamsIcon, Search, ChevronRight, Loader2, Globe } from 'lucide-react';

interface TeamsProps {
  onNavigate: (view: string, params?: any) => void;
}

const Teams: React.FC<TeamsProps> = ({ onNavigate }) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/teams')
      .then(res => setTeams(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-12 text-edex-cyan animate-spin mb-4" />
        <p className="text-edex-text-secondary font-medium">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="edex-page-subtitle">
            <Globe className="h-4 w-4" />
            Organizations
          </div>
          <h1 className="edex-page-title">
            Team<span className="edex-page-title-accent">s</span>
          </h1>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-edex-text-muted" />
          <input 
            type="text" 
            placeholder="Search teams..." 
            className="edex-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map((team) => (
          <button 
            key={team.id} 
            onClick={() => onNavigate('team-profile', { id: team.id })}
            className="edex-card group text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 bg-edex-primary-10 border border-edex-primary-20 text-edex-primary group-hover:bg-edex-primary group-hover:text-white transition-colors flex-shrink-0">
                  <TeamsIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-edex-text truncate group-hover:text-edex-cyan transition-colors">
                    {team.name}
                  </h4>
                  <p className="text-xs text-edex-text-muted">Team</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-edex-text-muted group-hover:text-edex-cyan group-hover:translate-x-half transition-all flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="py-20 text-center">
          <TeamsIcon className="h-12 w-12 text-edex-text-muted mx-auto mb-4 opacity-50" />
          <p className="text-edex-text-muted">No teams found</p>
        </div>
      )}
    </div>
  );
};

export default Teams;
