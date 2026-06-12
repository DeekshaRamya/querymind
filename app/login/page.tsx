'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [hasConfig, setHasConfig] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRole', data.user.role);

        if (data.user.role !== 'admin' && data.user.hasConfig === false) {
          window.location.href = '/db-config';
        } else {
          setUserRole(data.user.role || 'user');
          setHasConfig(true);
          setShowLoader(true);
        }
      } else {
        setError(data.message || 'Login failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(`An error occurred: ${err.message || 'Network error'}`);
      setLoading(false);
    }
  };

  if (showLoader) {
    return (
      <Loader 
        onComplete={() => {
          if (userRole === 'admin') {
            window.location.href = '/admin';
          } else if (!hasConfig) {
            window.location.href = '/db-config';
          } else {
            window.location.href = '/dashboard';
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="w-10 h-10 bg-[#2563EB] rounded-lg mx-auto mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">Welcome back</h1>
        <p className="text-[#6B7280] text-[16px] mt-2">Sign in to your enterprise data assistant</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm"
      >
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[#111827] text-[14px] font-medium mb-1.5">Email address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[#111827] text-[14px] font-medium">Password</label>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2.5 text-[15px] text-[#111827] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors placeholder-[#9CA3AF]"
              required
            />
          </div>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] text-[14px] px-3 py-2 rounded-[8px]">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#2563EB] text-white font-medium text-[15px] rounded-[10px] h-[44px] hover:bg-[#1D4ED8] transition-colors disabled:opacity-70 mt-2 flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Sign in'}
          </button>

          <div className="relative mt-6 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="w-full bg-white border border-[#E5E7EB] text-[#111827] font-medium text-[15px] rounded-[10px] h-[44px] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21">
              <path fill="#f25022" d="M1 1h9v9H1z"/>
              <path fill="#00a4ef" d="M1 11h9v9H1z"/>
              <path fill="#7fba00" d="M11 1h9v9h-9z"/>
              <path fill="#ffb900" d="M11 11h9v9h-9z"/>
            </svg>
            Microsoft
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-[#6B7280] text-[14px]">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-[#111827] font-medium hover:text-[#2563EB] transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
