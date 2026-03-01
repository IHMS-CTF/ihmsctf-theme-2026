import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Trophy, Medal, Users, TrendingUp, Search, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ScoreboardProps {
  onNavigate: (view: string, params?: any) => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ onNavigate }) => {
  const [scoreboard, setScoreboard] = useState<any[]>([]);
  const [topHistory, setTopHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get('/api/scoreboard'),
      axios.get('/api/scoreboard/top')
    ]).then(([sb, top]) => {
      setScoreboard(sb.data || []);
      setTopHistory(top.data || {});
    }).catch(err => {
      console.error("Failed to fetch scoreboard:", err);
      setScoreboard([]);
      setTopHistory({});
    })
      .finally(() => setLoading(false));
  }, []);

  const filteredScoreboard = scoreboard.filter(team => 
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6',
    '#6366f1', '#f43f5e', '#22c55e', '#eab308', '#d946ef'
  ];

  const prepareChartData = () => {
    if (!topHistory || typeof topHistory !== 'object' || Object.keys(topHistory).length === 0) return null;

    try {
      const datasets = Object.entries(topHistory).map(([teamName, history]: [string, any], index) => {
        if (!Array.isArray(history)) return null;
        return {
          label: teamName,
          data: history.map((entry: any) => ({
            x: entry.date ? new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            y: entry.score || 0
          })),
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length],
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        };
      }).filter(d => d !== null);

      if (datasets.length === 0) return null;

      const labels = Array.from(new Set(
        Object.values(topHistory).flatMap((h: any) => 
          Array.isArray(h) ? h.map((e: any) => e.date ? new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') : []
        )
      )).filter(l => l !== '').sort();

      return { labels, datasets };
    } catch (err) {
      console.error("Error preparing chart data:", err);
      return null;
    }
  };

  const chartData = prepareChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'monospace', size: 10 },
          boxWidth: 10,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'monospace', size: 12 },
        bodyFont: { family: 'monospace', size: 12 },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b', font: { family: 'monospace', size: 10 } },
        beginAtZero: true
      }
    }
  };

  if (loading) return <div className="text-center py-40 animate-pulse text-blue-500 font-mono tracking-widest uppercase font-black text-xl">Loading Scoreboard...</div>;

  return (
    <div className="space-y-16 animate-in fade-in duration-700 max-w-6xl mx-auto py-6">
      <header className="space-y-2 border-l-4 border-blue-600 pl-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Scoreboard</h1>
        <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Competition rankings.</p>
      </header>

      {scoreboard.length > 0 ? (
        <>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-10 rounded-[2rem] shadow-2xl">
            <div className="flex items-center space-x-3 mb-10">
              <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Score Progression</h3>
            </div>
            <div className="h-[450px] flex items-center justify-center">
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center space-y-4">
                  <BarChart3 className="h-12 w-12 text-slate-700 mx-auto" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">No scoring data available for top teams.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between space-y-6 md:space-y-0 bg-slate-900/80">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">Teams</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{scoreboard.length} Teams</p>
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

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-950/50 text-left border-b border-white/5">
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rank</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredScoreboard.map((team, index) => (
                    <tr key={index} className="hover:bg-blue-600/5 transition-colors group cursor-pointer" onClick={() => onNavigate('team-profile', { id: team.account_id || team.id })}>
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-4">
                          {index < 3 ? (
                            <div className={`p-2 rounded-lg border flex items-center justify-center ${
                              index === 0 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 
                              index === 1 ? 'bg-slate-300/10 border-slate-300/30 text-slate-300' : 
                              'bg-amber-600/10 border-amber-600/30 text-amber-600'
                            }`}>
                              <Medal className="h-5 w-5" />
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-slate-600 w-10 text-center font-mono">#{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">{team.name}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <span className="text-3xl font-black text-blue-500 tracking-tighter block">{team.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="py-40 bg-slate-900 border border-dashed border-white/10 rounded-[4rem] text-center space-y-10 shadow-2xl">
          <Trophy className="h-20 w-20 text-slate-800 mx-auto" />
          <h3 className="text-3xl font-black text-white uppercase tracking-tight">Scoreboard is empty.</h3>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
