import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Flag, 
  HelpCircle,
  Users,
  AlertCircle,
  Loader2,
  Server,
  Play,
  Square,
  RefreshCw,
  Clock,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { marked } from 'marked';

interface ContainerInfo {
  status: string;
  instance_uuid?: string;
  connection?: {
    host: string;
    port: number;
    ports?: Record<string, number>;
    type: string;
    info?: string;
    urls?: string[];
  };
  expires_at?: number;
  renewal_count?: number;
  max_renewals?: number;
}

interface ChallengeDetailProps {
  id: string;
  onNavigate: (view: string, params?: any) => void;
}

const ChallengeDetail: React.FC<ChallengeDetailProps> = ({ id, onNavigate }) => {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Container state
  const [container, setContainer] = useState<ContainerInfo | null>(null);
  const [containerLoading, setContainerLoading] = useState(false);
  const [containerError, setContainerError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Check if challenge supports containers
  const isContainerChallenge = challenge?.type === 'container';

  // Fetch container info
  const fetchContainerInfo = useCallback(async () => {
    if (!id || !isContainerChallenge) return;
    
    try {
      const res = await axios.get(`/api/containers/info/${id}`);
      if (res.data.status !== 'not_found') {
        setContainer(res.data);
      } else {
        setContainer(null);
      }
    } catch (err) {
      console.error('Failed to fetch container info:', err);
    }
  }, [id, isContainerChallenge]);

  // Start container
  const startContainer = async () => {
    if (!id) return;
    
    setContainerLoading(true);
    setContainerError(null);
    
    try {
      const res = await axios.post('/api/containers/request', { challenge_id: parseInt(id) });
      setContainer(res.data);
    } catch (err: any) {
      setContainerError(err.response?.data?.error || 'Failed to start container');
    } finally {
      setContainerLoading(false);
    }
  };

  // Stop container
  const stopContainer = async () => {
    if (!id) return;
    
    setContainerLoading(true);
    setContainerError(null);
    
    try {
      await axios.post('/api/containers/stop', { challenge_id: parseInt(id) });
      setContainer(null);
    } catch (err: any) {
      setContainerError(err.response?.data?.error || 'Failed to stop container');
    } finally {
      setContainerLoading(false);
    }
  };

  // Renew container
  const renewContainer = async () => {
    if (!id) return;
    
    setContainerLoading(true);
    setContainerError(null);
    
    try {
      const res = await axios.post('/api/containers/renew', { challenge_id: parseInt(id) });
      setContainer(prev => prev ? { ...prev, ...res.data } : null);
    } catch (err: any) {
      setContainerError(err.response?.data?.error || 'Failed to renew container');
    } finally {
      setContainerLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const diff = expiresAt - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  useEffect(() => {
    if (id) {
      axios.get(`/api/challenges/${id}`)
        .then(res => setChallenge(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Fetch container info when challenge loads
  useEffect(() => {
    if (challenge && isContainerChallenge) {
      fetchContainerInfo();
    }
  }, [challenge, isContainerChallenge, fetchContainerInfo]);

  // Auto-refresh container time remaining
  useEffect(() => {
    if (!container?.expires_at) return;
    
    const interval = setInterval(() => {
      // Force re-render to update time display
      setContainer(prev => prev ? { ...prev } : null);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [container?.expires_at]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || submitting || !challenge) return;
    
    setSubmitting(true);
    setResult(null);

    try {
      const response = await axios.post('/api/challenges/attempt', {
        challenge_id: challenge.id,
        submission: submission
      });
      
      setResult(response.data);
      
      if (response.data.success && response.data.data.status === 'correct') {
        setChallenge((prev: any) => ({ ...prev, solved_by_me: true, solves: (prev.solves || 0) + 1 }));
      }
    } catch (err: any) {
      setResult({ 
        success: false, 
        data: { 
          status: 'error', 
          message: err.response?.data?.message || 'Submission failed' 
        } 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-12 text-cyan animate-spin mb-4" />
        <p className="text-muted font-medium">Loading challenge...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <AlertCircle className="h-16 w-16 text-error mb-6" />
        <h2 className="text-2xl font-bold text-primary mb-2">Challenge Not Found</h2>
        <p className="text-muted mb-8">The requested challenge does not exist or has been removed.</p>
        <button onClick={() => onNavigate('challenges')} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to Challenges
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6 animate-fade-in">
      {/* Back Navigation */}
      <button 
        onClick={() => onNavigate('challenges')}
        className="inline-flex items-center gap-2 text-muted hover:text-cyan transition-colors group mb-2"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Challenges</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Header */}
          <div className="terminal-panel-glow p-6 relative">
            {challenge.solved_by_me && (
              <div className="absolute top-4 right-4">
                <span className="badge-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Solved
                </span>
              </div>
            )}
            
            <div className="space-y-4">
              <span className="badge-secondary">
                {challenge.category}
              </span>
              
              <h1 className="text-2xl font-bold text-primary">
                {challenge.name}
              </h1>
              
              <div className="flex items-center gap-6 text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-cyan">{challenge.value}</span>
                  <span className="text-xs uppercase tracking-wider">points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">{challenge.solves || 0} solves</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="terminal-panel p-6">
            <h3 className="label mb-4">Description</h3>
            <div 
              className="prose"
              dangerouslySetInnerHTML={{ __html: marked.parse(challenge.description || '') }}
            />
          </div>
          
          {/* Files */}
          {challenge.files && challenge.files.length > 0 && (
            <div className="terminal-panel p-6">
              <h3 className="label mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resources
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {challenge.files.map((file: string, index: number) => (
                  <a 
                    key={index} 
                    href={file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-void border border-border hover:border-cyan transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-4 w-4 text-muted flex-shrink-0" />
                      <span className="truncate text-sm text-muted group-hover:text-primary">
                        {file.split('/').pop()?.split('?')[0]}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted group-hover:text-cyan flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Container Panel - Only shown for container challenges */}
          {isContainerChallenge && (
            <div className="terminal-panel-glow p-6">
              <h3 className="label mb-4 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Instance
              </h3>
              
              {containerError && (
                <div className="alert-error mb-4">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs">{containerError}</p>
                  </div>
                </div>
              )}
              
              {container && container.status !== 'not_found' ? (
                <div className="space-y-4">
                  {/* Connection Info */}
                  <div className="bg-void border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Terminal className="h-3 w-3" />
                      <span className="uppercase tracking-wider">Connection</span>
                    </div>
                    
                    {/* URLs if available */}
                    {container.connection?.urls && container.connection.urls.length > 0 && (
                      <div className="space-y-1">
                        {container.connection.urls.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <a 
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-cyan hover:underline truncate flex-1"
                            >
                              {url}
                            </a>
                            <button
                              onClick={() => copyToClipboard(url)}
                              className="p-1 hover:bg-surface transition-colors"
                              title="Copy URL"
                            >
                              {copiedText === url ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3 text-muted" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Host:Port connection */}
                    {container.connection?.host && container.connection?.port && (
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-cyan flex-1 truncate">
                          {container.connection.host}:{container.connection.port}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`${container.connection?.host}:${container.connection?.port}`)}
                          className="p-1 hover:bg-surface transition-colors"
                          title="Copy connection"
                        >
                          {copiedText === `${container.connection?.host}:${container.connection?.port}` ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Connection info text */}
                    {container.connection?.info && (
                      <p className="text-xs text-muted">{container.connection.info}</p>
                    )}
                  </div>
                  
                  {/* Time Remaining */}
                  {container.expires_at && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-muted">
                        <Clock className="h-3 w-3" />
                        <span>Time remaining</span>
                      </div>
                      <span className={`font-mono font-bold ${
                        container.expires_at - Date.now() < 60000 ? 'text-error' : 'text-cyan'
                      }`}>
                        {formatTimeRemaining(container.expires_at)}
                      </span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={renewContainer}
                      disabled={containerLoading}
                      className="btn-secondary flex-1 text-xs"
                      title="Extend container time"
                    >
                      {containerLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Renew
                    </button>
                    <button
                      onClick={stopContainer}
                      disabled={containerLoading}
                      className="btn-ghost flex-1 text-xs text-error hover:bg-error/10"
                      title="Stop container"
                    >
                      {containerLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                      Stop
                    </button>
                  </div>
                  
                  {/* Renewal count */}
                  {container.renewal_count !== undefined && container.max_renewals !== undefined && (
                    <p className="text-xs text-muted text-center">
                      Renewals: {container.renewal_count} / {container.max_renewals}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted">
                    Start an instance to access the challenge environment.
                  </p>
                  <button
                    onClick={startContainer}
                    disabled={containerLoading}
                    className="btn-primary-solid w-full"
                  >
                    {containerLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Start Instance
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submission Form */}
          <div className="terminal-panel-glow p-6">
            <h3 className="label mb-4 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Submit Flag
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="flag{...}" 
                className="input font-mono"
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                disabled={submitting || challenge.solved_by_me}
              />
              
              <button 
                type="submit"
                disabled={submitting || challenge.solved_by_me || !submission}
                className={`w-full ${challenge.solved_by_me ? 'btn-ghost cursor-not-allowed opacity-50' : 'btn-primary-solid'}`}
              >
                {challenge.solved_by_me ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
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
                <div className={`${
                  result.data.status === 'correct' || result.data.status === 'already_solved'
                    ? 'alert-success' 
                    : 'alert-error'
                }`}>
                  {result.data.status === 'correct' || result.data.status === 'already_solved' 
                    ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> 
                    : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <p className="font-bold text-xs uppercase tracking-tight">{result.data.status?.replace('_', ' ')}</p>
                    <p className="text-xs opacity-80">{result.data.message || 'Response received.'}</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Stats */}
          <div className="terminal-panel p-6">
            <h3 className="label mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="stat">
                <div className="stat-value text-success">{challenge.solves || 0}</div>
                <div className="stat-label">Solves</div>
              </div>
              <div className="stat">
                <div className="stat-value text-maroon">{challenge.attempts || 0}</div>
                <div className="stat-label">Attempts</div>
              </div>
            </div>
          </div>
          
          {/* Hints */}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="terminal-panel p-6">
              <h3 className="label mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Hints
              </h3>
              <div className="flex flex-col gap-2">
                {challenge.hints.map((_: any, i: number) => (
                  <button 
                    key={i} 
                    className="btn-ghost text-xs justify-start"
                  >
                    Unlock Hint {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;
