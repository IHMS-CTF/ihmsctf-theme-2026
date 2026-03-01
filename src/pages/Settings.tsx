import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, MapPin, Globe, Cpu, ChevronRight, ShieldCheck } from 'lucide-react';

interface SettingsProps {
  onNavigate: (view: string, params?: any) => void;
}

const Settings: React.FC<SettingsProps> = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    affiliation: '',
    website: '',
    country: ''
  });

  useEffect(() => {
    axios.get('/api/user')
      .then(res => {
        setUser(res.data.user);
        setFormData({
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          affiliation: res.data.user.affiliation || '',
          website: res.data.user.website || '',
          country: res.data.user.country || ''
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-40 animate-pulse text-blue-500 font-mono tracking-widest uppercase font-black text-xl">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-10 animate-in fade-in duration-700">
      <header className="space-y-2 border-l-4 border-blue-600 pl-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Settings</h1>
        <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Manage your profile.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-10">
        <div className="space-y-8">
          <div className="bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl text-center group">
            <div className="bg-slate-950 p-10 rounded-3xl border border-white/5 shadow-inner inline-block mb-6">
              <User className="h-16 w-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{user?.name}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active User</p>
          </div>

          <div className="bg-slate-900 border border-white/5 p-8 rounded-[2rem] shadow-2xl space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Account Status</h4>
            <div className="flex items-center space-x-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-bold text-white uppercase tracking-tight">Verified</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-10 flex items-center space-x-3">
              <Cpu className="h-6 w-6 text-blue-500" />
              <span>Profile Info</span>
            </h3>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1" htmlFor="name">Username</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 rounded-xl px-5 py-4 text-white font-mono font-bold tracking-widest text-xs shadow-inner outline-none transition-all"
                    value={formData.name}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1" htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 rounded-xl px-5 py-4 text-white font-mono font-bold tracking-widest text-xs shadow-inner outline-none transition-all"
                    value={formData.email}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1" htmlFor="affiliation">Affiliation</label>
                <div className="relative">
                   <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700" />
                   <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 rounded-xl pl-14 pr-6 py-4 text-white font-mono font-bold tracking-widest text-xs shadow-inner outline-none transition-all"
                    value={formData.affiliation}
                    placeholder="Affiliation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1" htmlFor="website">Website</label>
                <div className="relative">
                   <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700" />
                   <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-white/5 focus:border-blue-500 rounded-xl pl-14 pr-6 py-4 text-white font-mono font-bold tracking-widest text-xs shadow-inner outline-none transition-all"
                    value={formData.website}
                    placeholder="Website"
                  />
                </div>
              </div>

              <div className="pt-6">
                 <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-3">
                    <span>Update Profile</span>
                    <ChevronRight className="h-4 w-4" />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
