'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setName(data.data.name || '');
        setEmail(data.data.email || '');
        setDbUsername(data.data.db_username || '');
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (err) {
      setError('An error occurred while loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = { name, email };
      if (password) payload.password = password;
      if (dbUsername) payload.db_username = dbUsername;
      if (dbPassword) payload.db_password = dbPassword;

      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (payload.name) localStorage.setItem('userName', payload.name);
        if (payload.email) localStorage.setItem('userEmail', payload.email);
        setSuccess('Profile updated successfully!');
        setPassword('');
        setDbPassword('');
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 font-sans">
      <div className="max-w-[500px] mx-auto">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-[#6B7280] hover:text-[#111827] transition-colors mb-6 text-[14px] font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight leading-tight">Profile Settings</h1>
            <p className="text-[#6B7280] text-[15px]">Manage your account & database credentials</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Account Section */}
            <div className="space-y-5">
              <h2 className="text-[16px] font-semibold text-[#111827] border-b border-[#E5E7EB] pb-2">Account Details</h2>
              
              <div>
                <label className="block text-[#4B5563] text-[13px] font-medium mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-3.5 py-2 text-[14.5px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[13px] font-medium mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-3.5 py-2 text-[14.5px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[13px] font-medium mb-1.5">New Password (leave blank to keep current)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-3.5 pr-10 py-2 text-[14.5px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Database Section */}
            <div className="space-y-5 pt-2">
              <h2 className="text-[16px] font-semibold text-[#111827] border-b border-[#E5E7EB] pb-2">Database Credentials</h2>
              
              <div>
                <label className="block text-[#4B5563] text-[13px] font-medium mb-1.5">Database Username</label>
                <input 
                  type="text" 
                  value={dbUsername}
                  onChange={(e) => setDbUsername(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-3.5 py-2 text-[14.5px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#4B5563] text-[13px] font-medium mb-1.5">New DB Password (leave blank to keep current)</label>
                <div className="relative">
                  <input 
                    type={showDbPassword ? "text" : "password"} 
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#E5E7EB] rounded-[8px] pl-3.5 pr-10 py-2 text-[14.5px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowDbPassword(!showDbPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors focus:outline-none"
                  >
                    {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-[13.5px] px-3.5 py-2.5 rounded-[8px]">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-[#ECFDF5] border border-[#6EE7B7] text-[#059669] text-[13.5px] px-3.5 py-2.5 rounded-[8px]">
                {success}
              </div>
            )}

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-[#111827] text-white font-medium text-[14.5px] rounded-[8px] h-[44px] hover:bg-[#374151] transition-colors disabled:opacity-70 mt-6 flex items-center justify-center shadow-sm"
            >
              {saving ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
