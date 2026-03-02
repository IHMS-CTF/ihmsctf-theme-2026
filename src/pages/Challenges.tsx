import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  Flag, 
  ChevronRight,
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

  // Filter challenges
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
        <Loader2 className="h-12 w-auto text-edex-cyan animate-spin mb-4" />
        <p className="text-edex-text-secondary font-medium">Loading challenges...</p>
      </div>
    );
  }

  return (
    <div className="challenges-layout animate-fade-in">
      
      {/* Left Pane: Challenge Navigator */}
      <div className="challenges-nav">
        <div className="edex-panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-edex-text">Challenges</h2>
            <span className="text-xs text-edex-text-muted">{challenges.length} total</span>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto edex-scrollbar space-y-4 pr-1">
          {Object.entries(filteredCategories).map(([category, categoryChallenges]: [string, any]) => (
            <div key={category}>
              <div className="edex-section-header mb-2">
                <h3>{category}</h3>
              </div>

              <div className="space-y-1">
                {categoryChallenges.map((challenge: any) => (
                  <button
                    key={challenge.id}
                    onClick={() => handleSelectChallenge(challenge)}
                    className={`challenge-item ${
                      selectedChallenge?.id === challenge.id ? 'active' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {challenge.solved_by_me && (
                          <CheckCircle2 className="h-4 w-auto text-edex-success flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          selectedChallenge?.id === challenge.id ? 'text-edex-cyan' : 'text-edex-text'
                        }`}>
                          {challenge.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-edex-text-muted">
                        <span>{challenge.value} pts</span>
                        <span>{challenge.solves} solves</span>
                      </div>
                    </div>
                    
                    <ChevronRight className={`h-4 w-auto flex-shrink-0 transition-transform ${
                      selectedChallenge?.id === challenge.id ? 'text-edex-cyan translate-x-half' : 'text-edex-text-muted'
                    }`} />
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
          <div className="flex flex-col h-full animate-slide-in-right">
            {/* Detail Header */}
            <div className="edex-panel-accent p-6 mb-6">
              <div className="challenge-header">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="edex-badge-cyan">{selectedChallenge.category}</span>
                    {selectedChallenge.solved_by_me && (
                      <span className="edex-badge-success">
                        <CheckCircle2 className="h-3 w-auto mr-1" />
                        Solved
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-edex-text">
                    {selectedChallenge.name}
                  </h1>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-edex-cyan">{selectedChallenge.value}</div>
                    <div className="text-xs text-edex-text-muted">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-edex-text">{selectedChallenge.solves}</div>
                    <div className="text-xs text-edex-text-muted">Solves</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="challenge-content">
              {/* Description Area */}
              <div className="challenge-description">
                <div className="edex-panel p-6">
                  <h3 className="edex-label mb-4">Description</h3>
                  {detailsLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="skeleton-line w-3/4"></div>
                      <div className="skeleton-line w-full"></div>
                      <div className="skeleton-line w-5/6"></div>
                    </div>
                  ) : (
                    <div 
                      className="edex-prose"
                      dangerouslySetInnerHTML={{ __html: marked.parse(challengeDetails?.description || '') }}
                    />
                  )}
                </div>

                {challengeDetails?.files && challengeDetails.files.length > 0 && (
                  <div className="edex-panel p-6">
                    <h3 className="edex-label mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-auto" />
                      Resources
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {challengeDetails.files.map((file: string, i: number) => (
                        <a 
                          key={i} 
                          href={file} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-link group"
                        >
                          <span className="truncate text-sm text-edex-text-secondary group-hover:text-edex-text">
                            {cleanFilename(file)}
                          </span>
                          <ExternalLink className="h-4 w-auto text-edex-text-muted group-hover:text-edex-cyan flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Area */}
              <div className="challenge-submission">
                <div className="edex-panel-primary p-6">
                  <h3 className="edex-label mb-4 flex items-center gap-2">
                    <Flag className="h-4 w-auto" />
                    Submit Flag
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="flag{...}" 
                      className="edex-input font-mono"
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      disabled={submitting || selectedChallenge.solved_by_me}
                    />

                    <button 
                      type="submit"
                      disabled={submitting || selectedChallenge.solved_by_me || !submission}
                      className={`w-full ${
                        selectedChallenge.solved_by_me 
                          ? 'edex-btn-ghost cursor-not-allowed' 
                          : 'edex-btn-primary'
                      }`}
                    >
                      {selectedChallenge.solved_by_me ? (
                        <>
                          <CheckCircle className="h-4 w-auto" />
                          Already Solved
                        </>
                      ) : submitting ? (
                        <>
                          <Loader2 className="h-4 w-auto animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Flag className="h-4 w-auto" />
                          Submit
                        </>
                      )}
                    </button>

                    {result && (
                      <div className={`${
                        result.data.status === 'correct' || result.data.status === 'already_solved'
                          ? 'edex-alert-success' 
                          : 'edex-alert-error'
                      }`}>
                        {result.data.status === 'correct' || result.data.status === 'already_solved' 
                          ? <CheckCircle className="h-4 w-auto flex-shrink-0" /> 
                          : <AlertCircle className="h-4 w-auto flex-shrink-0" />
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
            <Target className="h-16 w-auto text-edex-text-muted mb-6 opacity-50" />
            <h2 className="text-xl font-semibold text-edex-text-secondary mb-2">No Challenge Selected</h2>
            <p className="text-sm text-edex-text-muted max-w-sm">
              Select a challenge from the list on the left to view its details and submit your flag.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
