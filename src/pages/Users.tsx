import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Search, User } from 'lucide-react';

interface UsersProps {
  onNavigate: (view: string, params?: any) => void;
}

const Users: React.FC<UsersProps> = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/users')
      .then(res => setUsers(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-40 animate-pulse text-blue-500 font-mono tracking-widest uppercase font-black text-xl">Loading Users...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto py-6">
      <header className="space-y-2 border-l-4 border-blue-600 pl-8">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Users</h1>
        <p className="text-slate-500 font-bold tracking-widest text-sm uppercase">Active users.</p>
      </header>

      <div className="bg-slate-900 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between space-y-6 md:space-y-0 bg-slate-900/80">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 border border-blue-500/20 shadow-inner">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">Global Roster</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{users.length} Users</p>
            </div>
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search user..." 
              className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-700 focus:border-blue-500 outline-none transition-all font-mono font-bold text-xs tracking-widest shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-slate-950/50 border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 transition-all group hover:bg-slate-900 shadow-lg cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-slate-900 p-3 rounded-xl text-slate-500 group-hover:text-blue-500 transition-colors">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                    {user.name}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Users;
