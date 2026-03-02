import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Search, User, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-12 text-cyan animate-spin mb-4" />
        <p className="text-secondary font-medium">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="section-header mb-2">
            <UsersIcon className="h-4 w-4" />
            <span>Participants</span>
          </div>
          <h1 className="text-3xl font-bold text-primary">
            User<span className="text-maroon">s</span>
          </h1>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* User Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="terminal-panel p-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan/10 border border-cyan/20 text-cyan group-hover:bg-cyan group-hover:text-void transition-colors">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-primary truncate group-hover:text-cyan transition-colors">
                  {user.name}
                </h4>
                <p className="text-xs text-muted">Participant</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-20 text-center">
          <UsersIcon className="h-12 w-12 text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted">No users found</p>
        </div>
      )}
    </div>
  );
};

export default Users;
