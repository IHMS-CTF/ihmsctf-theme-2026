import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  X, 
  FileText, 
  ExternalLink, 
  Flag, 
  Users, 
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { marked } from 'marked';

interface ChallengesProps {
  onNavigate: (view: string, params?: any) => void;
}

const Challenges: React.FC<ChallengesProps> = () => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleOpenChallenge = (challenge: any) => {
    setSelectedChallenge(null);
    setResult(null);
    setSubmission('');
    
    axios.get(`/api/challenges/${challenge.id}`)
      .then(res => setSelectedChallenge(res.data))
      .catch(console.error);
  };

  const handleClose = () => {
    setSelectedChallenge(null);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || submitting) return;
    
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
      }
    } catch (err: any) {
      setResult({ success: false, data: { status: 'error', message: err.response?.data?.message || 'Submission failed' } });
    } finally {
      setSubmitting(false);
    }
  };

  const categories = challenges.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {});

  const cleanFilename = (url: string) => {
    const filename = url.split('/').pop() || '';
    return filename.split('?')[0];
  };

  if (loading && challenges.length === 0) {
    return <div className="text-center py-40 animate-pulse text-blue-500 font-mono tracking-widest uppercase font-black text-xl">Loading Challenges...</div>;
  }

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom duration-700">
      <header className="space-y-2 border-l-4 border-blue-600 pl-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Challenges</h1>
        <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Select a challenge to solve.</p>
      </header>

      {Object.entries(categories).map(([category, categoryChallenges]: [string, any]) => (
        <section key={category} className="space-y-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight border-b-2 border-blue-600/50 pb-2">{category}</h2>
            <div className="h-px flex-grow bg-slate-900"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryChallenges.map((challenge: any) => (
              <button
                key={challenge.id}
                onClick={() => handleOpenChallenge(challenge)}
                className={`relative group flex flex-col p-6 rounded-2xl border transition-all text-left overflow-hidden ${
                  challenge.solved_by_me 
                  ? 'bg-blue-600/5 border-blue-600/20 hover:border-blue-600/40' 
                  : 'bg-slate-900 border-white/5 hover:border-white/10 hover:bg-slate-800 shadow-xl'
                }`}
              >
                {challenge.solved_by_me && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white p-1.5 rounded-bl-xl shadow-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
                
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{challenge.category}</span>
                    <span className={`text-xs font-bold tracking-tight ${challenge.solved_by_me ? 'text-blue-400' : 'text-white'}`}>
                      {challenge.value} PTS
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight uppercase group-hover:text-blue-400 transition-colors">
                    {challenge.name}
                  </h3>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <Users className="h-3 w-3" />
                    <span>{challenge.solves} Solves</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:translate-x-1 transition-transform group-hover:text-blue-500" />
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Challenge Modal */}
      {selectedChallenge && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 backdrop-blur-md bg-slate-950/80 animate-in fade-in duration-300"
          onClick={handleClickOutside}
        >
          <div 
            ref={modalRef}
            className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
          >
            {/* Modal Header */}
            <div className="p-8 pb-0 flex justify-between items-start relative">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  {selectedChallenge.category}
                </span>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none pt-2">
                  {selectedChallenge.name}
                </h2>
                <div className="flex items-center space-x-4 pt-4">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-blue-500">{selectedChallenge.value}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Points</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800"></div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-slate-300">{selectedChallenge.solves}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Solves</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-3 rounded-2xl transition-all active:scale-90"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 flex-grow overflow-y-auto space-y-10 custom-scrollbar">
              <div 
                className="prose prose-invert prose-blue max-w-none text-slate-300 font-medium leading-relaxed"
                dangerouslySetInnerHTML={{ __html: marked.parse(selectedChallenge.description || '') }}
              />

              {selectedChallenge.files && selectedChallenge.files.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Files</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedChallenge.files.map((file: string, i: number) => (
                      <a 
                        key={i} 
                        href={file} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <FileText className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                          <span className="truncate text-xs font-bold uppercase tracking-tight text-slate-300 group-hover:text-white transition-colors">
                            {cleanFilename(file)}
                          </span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Submission */}
            <div className="p-8 bg-slate-950/50 border-t border-white/5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Flag" 
                    className="w-full bg-slate-900 border border-white/5 focus:border-blue-500 rounded-xl p-6 text-white placeholder-slate-600 outline-none transition-all font-mono font-bold tracking-widest shadow-inner group-hover:bg-slate-800"
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={submitting}
                    className={`absolute right-3 top-3 bottom-3 px-8 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center space-x-2 ${
                      submitting ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95'
                    }`}
                  >
                    <Flag className="h-4 w-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                  </button>
                </div>

                {result && (
                  <div className={`p-4 rounded-xl flex items-center space-x-3 border animate-in slide-in-from-top duration-300 ${
                    result.data.status === 'correct' || result.data.status === 'already_solved'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {result.data.status === 'correct' || result.data.status === 'already_solved' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <p className="text-sm font-bold uppercase tracking-widest">{result.data.message || result.data.status}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
