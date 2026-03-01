import React, { useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trophy, BarChart3 } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string, params?: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  useEffect(() => {
    axios.get('/api/config').then(() => {}).catch(console.error);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-20 py-10 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-black tracking-tighter text-white uppercase">
          CTFd
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Welcome to the CTFd platform. This is a simplified frontend for viewing challenges, the scoreboard, and user rankings.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
          <button 
            onClick={() => onNavigate('challenges')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            Challenges
          </button>
          <button 
            onClick={() => onNavigate('scoreboard')}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95"
          >
            Scoreboard
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-all group shadow-2xl">
          <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 mb-6 w-fit">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase mb-3 tracking-tight">Timeline</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Competition events and timeline are synchronized directly from CTFd.
          </p>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-all group shadow-2xl">
          <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 mb-6 w-fit">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase mb-3 tracking-tight">Rankings</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Real-time scoreboard and individual rankings based on solved challenges.
          </p>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-all group shadow-2xl">
          <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 mb-6 w-fit">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase mb-3 tracking-tight">Challenges</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            View available challenges, categories, point values, and solve counts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
