import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users as TeamsIcon, Search, ShieldAlert, ChevronRight } from 'lucide-react';

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

  if (loading) return <div className="text-center py-40 animate-pulse text-blue-500 font-mono tracking-widest uppercase font-black text-xl">Loading Teams...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto py-6">
      <header className="space-y-2 border-l-4 border-blue-600 pl-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Teams</h1>
        <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Active teams.</p>
      </header>

      <div className="bg-slate-900 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between space-y-6 md:space-y-0 bg-slate-900/80">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 border border-blue-500/20 shadow-inner">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">Team Roster</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{teams.length} Teams</p>
            </div>
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search team..." 
              className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-700 focus:border-blue-500 outline-none transition-all font-mono font-bold text-xs tracking-widest shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
          {filteredTeams.map((team) => (
            <div 
              key={team.id} 
              onClick={() => onNavigate('team-profile', { id: team.id })}
              className="bg-slate-950/50 border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 transition-all group hover:bg-slate-900 shadow-lg cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-slate-900 p-3 rounded-xl text-slate-500 group-hover:text-blue-500 transition-colors">
                    <TeamsIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                      {team.name}
                    </h4>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;
