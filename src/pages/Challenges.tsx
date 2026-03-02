import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  Flag, 
  CheckCircle,
  AlertCircle,
  Target,
  Loader2
} from 'lucide-react';
import { marked } from 'marked';

interface ChallengesProps {
  onNavigate: (view: string, params?: any) => void;
}

const Challenges: React.FC<ChallengesProps> = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [challengeDetails, setChallengeDetails] = useState<any>(null);
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = () => {
    setLoading(true);
    axios.get('/api/challenges')
      .then(res => setChallenges(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSelectChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
    setResult(null);
    setSubmission('');
    setDetailsLoading(true);
    
    axios.get(`/api/challenges/${challenge.id}`)
      .then(res => setChallengeDetails(res.data))
      .catch(console.error)
      .finally(() => setDetailsLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || submitting || !selectedChallenge) return;
    
    setSubmitting(true);
    setResult(null);

    try {
      const response = await axios.post('/api/challenges/attempt', {
        challenge_id: selectedChallenge.id,
        submission: submission
      });
      
      const data = response.data;
      setResult(data);
      
      if (data.success && data.data.status === 'correct') {
        fetchChallenges();
        setChallenges(prev => prev.map(c => 
          c.id === selectedChallenge.id ? { ...c, solved_by_me: true, solves: c.solves + 1 } : c
        ));
        setSelectedChallenge((prev: any) => ({ ...prev, solved_by_me: true }));
      }
    } catch (err: any) {
      setResult({ success: false, data: { status: 'error', message: err.response?.data?.message || 'Submission failed' } });
    } finally {
      setSubmitting(false);
    }
  };

  // Group challenges by category
  const categories = challenges.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {});

  const filteredCategories = Object.entries(categories).reduce((acc: any, [category, challs]: [string, any]) => {
    acc[category] = challs;
    return acc;
  }, {});

  const cleanFilename = (url: string) => {
    const filename = url.split('/').pop() || '';
    return filename.split('?')[0];
  };

  if (loading && challenges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-12 text-maroon animate-spin mb-4" />
        <p className="text-secondary font-medium">Loading challenges...</p>
      </div>
    );
  }

  return (
    <div className="challenges-page">
      <div className="challenges-layout animate-fade-in">
        
        {/* Left Pane: Challenge Navigator */}
        <div className="challenges-nav">
          <div className="terminal-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary">Challenges</h2>
              <span className="text-xs text-muted">{challenges.length} total</span>
            </div>
          </div>

          <div className="challenges-list">
            {Object.entries(filteredCategories).map(([category, categoryChallenges]: [string, any]) => (
              <div key={category}>
                <div className="section-header mb-2">
                  <h3>{category}</h3>
                  <div className="header-line"></div>
                </div>

                <div className="flex flex-col gap-2">
                  {categoryChallenges.map((challenge: any) => (
                    <button
                      key={challenge.id}
                      onClick={() => handleSelectChallenge(challenge)}
                      className={`challenge-item ${selectedChallenge?.id === challenge.id ? 'active' : ''} ${challenge.solved_by_me ? 'solved' : ''}`}
                    >
                      <div className="challenge-info">
                        <div className="challenge-name flex items-center gap-2">
                          {challenge.solved_by_me && (
                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          )}
                          <span>{challenge.name}</span>
                        </div>
                        <div className="challenge-meta">
                          <span>{challenge.value} pts</span>
                          <span>{challenge.solves} solves</span>
                        </div>
                      </div>
                      
                      <span className="challenge-points">{challenge.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Challenge Details */}
        <div className="challenges-detail">
          {selectedChallenge ? (
            <div className="challenge-view animate-slide-in">
              {/* Header */}
              <div className="challenge-header">
                <div className="challenge-title-row">
                  <div className="space-y-3">
                    <div className="challenge-badges">
                      <span className="badge-secondary">{selectedChallenge.category}</span>
                      {selectedChallenge.solved_by_me && (
                        <span className="badge-success flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Solved
                        </span>
                      )}
                    </div>
                    <h1 className="challenge-title">{selectedChallenge.name}</h1>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="stat">
                      <div className="stat-value text-maroon">{selectedChallenge.value}</div>
                      <div className="stat-label">Points</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">{selectedChallenge.solves}</div>
                      <div className="stat-label">Solves</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="challenge-body">
                {/* Description */}
                <div className="challenge-description">
                  <div className="terminal-panel p-6">
                    <h3 className="label mb-4">Description</h3>
                    {detailsLoading ? (
                      <div className="space-y-3">
                        <div className="skeleton-line medium"></div>
                        <div className="skeleton-line full"></div>
                        <div className="skeleton-line short"></div>
                      </div>
                    ) : (
                      <div 
                        className="prose"
                        dangerouslySetInnerHTML={{ __html: marked.parse(challengeDetails?.description || '') }}
                      />
                    )}
                  </div>

                  {challengeDetails?.files && challengeDetails.files.length > 0 && (
                    <div className="terminal-panel p-6 challenge-files">
                      <h3 className="label mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Resources
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {challengeDetails.files.map((file: string, i: number) => (
                          <a 
                            key={i} 
                            href={file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-item group"
                          >
                            <div className="file-info">
                              <FileText className="file-icon h-4 w-4" />
                              <span className="file-name truncate">{cleanFilename(file)}</span>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted group-hover:text-cyan" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submission */}
                <div className="challenge-sidebar">
                  <div className="terminal-panel-glow p-6 challenge-submit">
                    <h3 className="label mb-4 flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Submit Flag
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="submit-form flex-col gap-4">
                      <input 
                        type="text" 
                        placeholder="flag{...}" 
                        className="input font-mono"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        disabled={submitting || selectedChallenge.solved_by_me}
                      />

                      <button 
                        type="submit"
                        disabled={submitting || selectedChallenge.solved_by_me || !submission}
                        className={`w-full flex items-center justify-center gap-2 ${
                          selectedChallenge.solved_by_me 
                            ? 'btn-ghost cursor-not-allowed' 
                            : 'btn-primary-solid'
                        }`}
                      >
                        {selectedChallenge.solved_by_me ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Already Solved
                          </>
                        ) : submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Flag className="h-4 w-4" />
                            Submit
                          </>
                        )}
                      </button>

                      {result && (
                        <div className={`alert ${
                          result.data.status === 'correct' || result.data.status === 'already_solved'
                            ? 'alert-success' 
                            : 'alert-error'
                        }`}>
                          {result.data.status === 'correct' || result.data.status === 'already_solved' 
                            ? <CheckCircle className="alert-icon h-4 w-4" /> 
                            : <AlertCircle className="alert-icon h-4 w-4" />
                          }
                          <div>
                            <p className="font-semibold text-sm capitalize">{result.data.status?.replace('_', ' ')}</p>
                            <p className="text-xs opacity-80">{result.data.message || 'Response received.'}</p>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Target className="empty-icon h-16 w-16" />
              <h2 className="empty-title">No Challenge Selected</h2>
              <p className="empty-desc">
                Select a challenge from the list to view details and submit your flag.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
