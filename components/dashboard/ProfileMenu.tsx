'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, Trash2, User, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileMenuProps {
  userName: string;
  userEmail: string;
}

export default function ProfileMenu({ userName, userEmail }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmDelete) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/profile', { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          router.push('/');
        } else {
          const data = await res.json();
          alert(`Failed to delete account: ${data.message}`);
        }
      } catch (err) {
        alert('An error occurred while deleting your account.');
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] rounded-full flex items-center justify-center text-white font-semibold text-[13px] hover:ring-2 hover:ring-[#2563EB]/30 transition-all focus:outline-none"
      >
        {userName.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-50 py-1">
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA]">
            <p className="text-[14px] font-semibold text-[#111827] truncate">{userName}</p>
            <p className="text-[13px] text-[#6B7280] truncate mt-0.5">{userEmail}</p>
          </div>
          
          <div className="p-1">
            <button 
              onClick={() => router.push('/profile')}
              className="w-full text-left px-3 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] rounded-md transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Profile Settings
            </button>

            <button 
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] rounded-md transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
