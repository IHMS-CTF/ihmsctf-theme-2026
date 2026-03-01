import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Users as TeamIcon, 
  MapPin, 
  Globe
} from 'lucide-react';

interface TeamProfileProps {
  id: string;
  onNavigate: (view: string, params?: any) => void;
}

const TeamProfile: React.FC<TeamProfileProps> = ({ id, onNavigate }) => {
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`/api/teams/${id}`)
        .then(res => setTeam(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="text-center py-40 animate-pulse text-blue-500 font-mono tracking-widest uppercase font-black text-xl">Loading Team Profile...</div>;
  if (!team) return <div className="text-center py-40 text-red-500 font-bold uppercase tracking-widest">Team not found</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-12 animate-in fade-in duration-700">
      <button 
        onClick={() => onNavigate('teams')}
        className="flex items-center space-x-2 text-slate-500 hover:text-blue-500 transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold tracking-widest uppercase text-xs">Back to Teams</span>
      </button>

      <div className="bg-slate-900 border border-white/5 p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-8 md:space-y-0 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
            <div className="bg-slate-950 p-10 rounded-3xl border border-white/5 shadow-inner">
              <ShieldAlert className="h-20 w-20 text-blue-500" />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-5xl font-black text-white uppercase tracking-tight leading-none">{team.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-500 font-bold tracking-widest uppercase text-[10px] pt-2">
                {team.affiliation && <div className="flex items-center space-x-2"><MapPin className="h-3 w-3" /> <span>{team.affiliation}</span></div>}
                {team.website && <div className="flex items-center space-x-2"><Globe className="h-3 w-3" /> <span>{team.website}</span></div>}
                <div className="flex items-center space-x-2"><TeamIcon className="h-3 w-3" /> <span>{team.members?.length || 0} Members</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950/80 border border-white/5 p-6 rounded-2xl text-center space-y-1 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Points</span>
                <p className="text-4xl font-black text-blue-500 tracking-tighter">{team.score || 0}</p>
             </div>
             <div className="bg-slate-950/80 border border-white/5 p-6 rounded-2xl text-center space-y-1 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rank</span>
                <p className="text-4xl font-black text-white tracking-tighter">#{team.rank || 'N/A'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight border-b border-white/5 pb-4">Solves</h2>

          <div className="bg-slate-900 border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-white/5">
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Challenge</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {team.solves && team.solves.length > 0 ? team.solves.map((solve: any, i: number) => (
                    <tr key={i} className="hover:bg-blue-600/5 transition-colors group">
                      <td className="px-10 py-6">
                        <span className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{solve.challenge.name}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{solve.challenge.category}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className="text-xl font-bold text-blue-500 tracking-tighter">{solve.challenge.value}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-10 py-10 text-center text-slate-700 font-bold uppercase tracking-widest text-xs">No solves yet.</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight border-b border-white/5 pb-4">Members</h2>

          <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-2xl space-y-4">
             {team.members && team.members.length > 0 ? team.members.map((member: any, i: number) => (
                <div key={i} className="flex items-center space-x-4 bg-slate-950/50 border border-white/5 p-4 rounded-xl">
                   <TeamIcon className="h-4 w-4 text-slate-500" />
                   <span className="text-sm font-bold text-white uppercase tracking-tight">{member.name}</span>
                </div>
             )) : (
                <div className="py-6 text-center text-slate-700 font-bold uppercase tracking-widest text-xs">No members.</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;
