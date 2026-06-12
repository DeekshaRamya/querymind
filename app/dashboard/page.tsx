'use client';

import { useEffect, useState } from 'react';
import QueryInputSection from '@/components/dashboard/QueryInputSection';
import ProfileMenu from '@/components/dashboard/ProfileMenu';
import DatabaseSwitcher from '@/components/dashboard/DatabaseSwitcher';
import Link from 'next/link';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Database } from 'lucide-react';

export default function DashboardPage() {
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@company.com');
  const [isLoaded, setIsLoaded] = useState(false);
  const { activeDatabase } = useDatabase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      setUserName(localStorage.getItem('userName') || 'User');
      setUserEmail(localStorage.getItem('userEmail') || 'user@company.com');
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="bg-white min-h-screen text-[#111827] font-sans selection:bg-[#2563EB] selection:text-white flex flex-col">
      {/* Top Navigation */}
      <nav className="h-[72px] border-b border-[#E5E7EB] px-6 lg:px-8 flex items-center justify-between bg-white sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-[16px] text-[#111827] tracking-tight">Query Minded</span>
          </Link>
          <div className="hidden md:block w-[1px] h-6 bg-[#E5E7EB]"></div>
          <DatabaseSwitcher />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ProfileMenu userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          <QueryInputSection userName={userName} />
        </div>
      </main>
    </div>
  );
}
