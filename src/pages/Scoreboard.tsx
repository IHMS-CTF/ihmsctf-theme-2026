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
import { Trophy, Users, TrendingUp, BarChart3, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Chart colors matching our theme
const CHART_COLORS = [
  '#58a6ff', // cyan
  '#c9453a', // primary
  '#f0c14b', // gold
  '#3fb950', // success
  '#f85149', // error
  '#8b949e', // silver
  '#da8e66', // bronze
  '#d29922', // warning
  '#79c0ff', // cyan-bright
  '#388bfd', // cyan-dim
];

interface ScoreboardProps {
  onNavigate: (view: string, params?: any) => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ onNavigate }) => {
  const [scoreboard, setScoreboard] = useState<any[]>([]);
  const [topHistory, setTopHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    }).finally(() => setLoading(false));
  }, []);

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
          borderColor: CHART_COLORS[index % CHART_COLORS.length],
          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
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
          color: '#8b949e',
          font: { family: 'JetBrains Mono, monospace', size: 11, weight: 500 as any },
          boxWidth: 12,
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: '#161b22',
        titleFont: { family: 'JetBrains Mono, monospace', size: 12, weight: 600 as any },
        bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
        borderColor: '#21262d',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 4,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(33, 38, 45, 0.8)' },
        ticks: { 
          color: '#8b949e', 
          font: { family: 'JetBrains Mono, monospace', size: 10 } 
        }
      },
      y: {
        grid: { color: 'rgba(33, 38, 45, 0.8)' },
        ticks: { 
          color: '#8b949e', 
          font: { family: 'JetBrains Mono, monospace', size: 10 } 
        },
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-auto text-edex-cyan animate-spin mb-4" />
        <p className="text-edex-text-secondary font-medium">Loading scoreboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <header>
        <div className="edex-page-subtitle">
          <TrendingUp className="h-4 w-auto" />
          Live Rankings
        </div>
        <h1 className="edex-page-title">
          Score<span className="edex-page-title-accent">board</span>
        </h1>
      </header>

      {scoreboard.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Progression Chart */}
          <div className="edex-panel p-6 xl:col-span-2">
            <div className="edex-section-header mb-4">
              <TrendingUp className="h-4 w-auto text-edex-cyan" />
              <h3>Score Progression</h3>
            </div>
            <div className="chart-container">
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <BarChart3 className="h-12 w-auto text-edex-text-muted mb-4 opacity-50" />
                  <p className="text-sm text-edex-text-muted">No progression data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="edex-panel flex flex-col overflow-hidden">
            <div className="p-4 border-b border-edex-border flex items-center justify-between">
              <span className="text-sm font-semibold text-edex-text flex items-center gap-2">
                <Users className="h-4 w-auto text-edex-cyan" />
                Rankings
              </span>
              <span className="text-xs text-edex-text-muted">{scoreboard.length} teams</span>
            </div>
            
            <div className="scoreboard-table-container">
              <table className="edex-table">
                <thead>
                  <tr>
                    <th className="w-16">Rank</th>
                    <th>Team</th>
                    <th className="text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreboard.map((team, index) => (
                    <tr 
                      key={index} 
                      className="cursor-pointer" 
                      onClick={() => onNavigate('team-profile', { id: team.account_id || team.id })}
                    >
                      <td>
                        {index < 3 ? (
                          <div className={`edex-rank-${index + 1}`}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-edex-text-muted">#{index + 1}</span>
                        )}
                      </td>
                      <td>
                        <span className="font-medium text-edex-text hover:text-edex-cyan transition-colors">
                          {team.name}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-edex-text">{team.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Trophy className="h-16 w-auto text-edex-text-muted mb-6 opacity-50" />
          <h3 className="text-xl font-semibold text-edex-text-secondary mb-2">No Data Yet</h3>
          <p className="text-sm text-edex-text-muted">
            The scoreboard will populate once teams start solving challenges.
          </p>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
