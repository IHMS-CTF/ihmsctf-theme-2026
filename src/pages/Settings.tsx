import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, MapPin, Globe, Settings as SettingsIcon, ShieldCheck, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-40">
        <Loader2 className="h-12 w-12 text-edex-cyan animate-spin mb-4" />
        <p className="text-edex-text-secondary font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Header */}
      <header>
        <div className="edex-page-subtitle">
          <SettingsIcon className="h-4 w-4" />
          Account
        </div>
        <h1 className="edex-page-title">
          Sett<span className="edex-page-title-accent">ings</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <div className="edex-panel-accent p-8 text-center">
            <div className="p-6 bg-edex-surface border border-edex-border inline-block mb-6">
              <User className="h-12 w-12 text-edex-cyan" />
            </div>
            <h3 className="text-2xl font-bold text-edex-text mb-1">{user?.name}</h3>
            <p className="text-sm text-edex-text-muted">Participant</p>
          </div>

          <div className="edex-panel p-6 space-y-4">
            <h4 className="text-sm font-semibold text-edex-text-muted">Security Status</h4>
            <div className="flex items-center justify-between p-4 bg-edex-success-10 border border-edex-success-20 rounded">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-edex-success" />
                <span className="text-sm font-medium text-edex-success">Account Verified</span>
              </div>
              <div className="edex-status-online"></div>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="xl:col-span-2">
          <div className="edex-panel p-8">
            <h3 className="text-lg font-semibold text-edex-text mb-8">Profile Information</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="edex-label" htmlFor="name">Username</label>
                  <input 
                    type="text" 
                    id="name"
                    className="edex-input bg-edex-surface cursor-not-allowed opacity-60"
                    value={formData.name}
                    readOnly
                  />
                  <p className="text-xs text-edex-text-muted mt-1">Username cannot be changed</p>
                </div>
                <div>
                  <label className="edex-label" htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    className="edex-input bg-edex-surface cursor-not-allowed opacity-60"
                    value={formData.email}
                    readOnly
                  />
                  <p className="text-xs text-edex-text-muted mt-1">Contact admin to change email</p>
                </div>
              </div>

              <div>
                <label className="edex-label" htmlFor="affiliation">Affiliation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-edex-text-muted" />
                  <input 
                    type="text" 
                    id="affiliation"
                    className="edex-input pl-10"
                    value={formData.affiliation}
                    onChange={(e) => setFormData(prev => ({ ...prev, affiliation: e.target.value }))}
                    placeholder="Your school or organization"
                  />
                </div>
              </div>

              <div>
                <label className="edex-label" htmlFor="website">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-edex-text-muted" />
                  <input 
                    type="url" 
                    id="website"
                    className="edex-input pl-10"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button className="edex-btn-primary">
                  Save Changes
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
