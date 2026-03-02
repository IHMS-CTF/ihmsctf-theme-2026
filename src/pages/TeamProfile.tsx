import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Shield, 
  Users as TeamIcon, 
  MapPin, 
  Globe,
  Trophy,
  Loader2,
  AlertCircle
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-12 text-cyan animate-spin mb-4" />
        <p className="text-secondary font-medium">Loading team profile...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <AlertCircle className="h-16 w-16 text-error mb-6" />
        <h2 className="text-2xl font-bold text-primary mb-2">Team Not Found</h2>
        <p className="text-secondary mb-8">The requested team does not exist.</p>
        <button onClick={() => onNavigate('teams')} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Back Button */}
      <button 
        onClick={() => onNavigate('teams')}
        className="inline-flex items-center gap-2 text-secondary hover:text-cyan transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Teams</span>
      </button>

      {/* Team Header */}
      <div className="terminal-panel-glow p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Trophy className="h-24 w-24 text-cyan" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-6 bg-surface border border-border">
              <Shield className="h-12 w-12 text-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="status-online"></div>
                <span className="text-xs font-medium text-success">Active</span>
              </div>
              <h1 className="text-3xl font-bold text-primary mb-3">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                {team.affiliation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{team.affiliation}</span>
                  </div>
                )}
                {team.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{team.website}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <TeamIcon className="h-4 w-4" />
                  <span>{team.members?.length || 0} members</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="stat">
              <div className="stat-value text-cyan">{team.score || 0}</div>
              <div className="stat-label">Points</div>
            </div>
            <div className="stat">
              <div className="stat-value">#{team.rank || 'N/A'}</div>
              <div className="stat-label">Rank</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Solves Table */}
        <div className="lg:col-span-2">
          <div className="section-header mb-4">
            <Trophy className="h-4 w-4 text-cyan" />
            <h2>Solved Challenges</h2>
          </div>

          <div className="terminal-panel overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Category</th>
                  <th className="text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {team.solves && team.solves.length > 0 ? team.solves.map((solve: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <span className="font-medium text-primary">{solve.challenge.name}</span>
                    </td>
                    <td>
                      <span className="badge-secondary text-xs">{solve.challenge.category}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-bold text-primary">{solve.challenge.value}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <p className="text-muted">No challenges solved yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <div className="section-header mb-4">
            <TeamIcon className="h-4 w-4 text-cyan" />
            <h2>Members</h2>
          </div>

          <div className="space-y-2">
            {team.members && team.members.length > 0 ? team.members.map((member: any, i: number) => (
              <div key={i} className="terminal-panel p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-muted">
                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="font-medium text-primary">{member.name}</span>
              </div>
            )) : (
              <div className="terminal-panel p-8 text-center">
                <p className="text-muted">No members listed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;
