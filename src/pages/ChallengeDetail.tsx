import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Flag, 
  HelpCircle,
  Clock
} from 'lucide-react';

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/challenges/${id}`)
      .then(res => setChallenge(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-xl font-medium animate-pulse">Loading challenge details...</div>;
  if (!challenge) return <div className="text-center py-20 bg-red-50 text-red-700 rounded-3xl border border-red-200 font-bold">Challenge not found.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group">
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <Link to="/challenges" className="font-bold tracking-tight uppercase text-sm">Back to Challenges</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">
            {challenge.solved_by_me && (
              <div className="absolute top-0 right-0 bg-green-500 text-white px-8 py-2 font-bold uppercase tracking-widest text-xs transform translate-x-10 translate-y-6 rotate-45 shadow-lg">
                Solved
              </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-10 space-y-4 md:space-y-0">
              <div className="space-y-2">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 mb-2 inline-block">
                  {challenge.category}
                </span>
                <h1 className="text-5xl font-black text-slate-900 leading-tight">{challenge.name}</h1>
              </div>
              <div className="text-right">
                <span className="text-6xl font-black text-blue-600 tracking-tighter">{challenge.value}</span>
                <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mt-[-5px]">Points</span>
              </div>
            </div>

            <div 
              className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: challenge.description }}
            />
            
            {challenge.files && challenge.files.length > 0 && (
              <div className="mt-12 pt-10 border-t border-gray-100 space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span>Resources & Files</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenge.files.map((file: string, index: number) => (
                    <a 
                      key={index} 
                      href={file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <FileText className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate font-bold text-sm tracking-tight">{file.split('/').pop()}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[2rem] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] bg-blue-600 h-24 w-24 rounded-full blur-[60px] opacity-40"></div>
            
            <div className="space-y-2 relative">
              <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Submission</h3>
              <p className="text-xl font-black">Submit your flag</p>
            </div>
            
            <div className="space-y-4 relative">
              <input 
                type="text" 
                placeholder="flag{...}" 
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-600/50 outline-none transition-all font-mono font-bold"
              />
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 tracking-widest uppercase text-sm">
                <Flag className="h-5 w-5" />
                <span>Submit Flag</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 space-y-8">
            <h3 className="text-xl font-black text-slate-900 border-b border-gray-50 pb-4">Challenge Stats</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Solves</span>
                </span>
                <p className="text-3xl font-black text-slate-900">{challenge.solves || 0}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Attempts</span>
                </span>
                <p className="text-3xl font-black text-slate-900">{challenge.attempts || 0}</p>
              </div>
            </div>
            
            {challenge.hints && challenge.hints.length > 0 && (
              <div className="pt-6 border-t border-gray-50 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Available Hints</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {challenge.hints.map((_: any, i: number) => (
                    <button key={i} className="px-5 py-2.5 bg-gray-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl border border-gray-100 text-xs font-black tracking-widest uppercase transition-all">
                      Hint {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;
