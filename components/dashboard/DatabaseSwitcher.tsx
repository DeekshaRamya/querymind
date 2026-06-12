'use client';

import { useState, useRef, useEffect } from 'react';
import { Database, ChevronDown, Check, Plus } from 'lucide-react';
import { useDatabase } from '@/contexts/DatabaseContext';
import Link from 'next/link';

export default function DatabaseSwitcher() {
  const { activeDatabase, setActiveDatabase, databases, loading, isSwitching } = useDatabase();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] animate-pulse w-48 h-9">
      </div>
    );
  }

  // Helper to format display text
  const getDisplayText = (db: { name: string, type: string } | null) => {
    if (!db) return 'Select Database';
    return db.name;
  };

  return (
    <div className="relative flex items-center gap-3" ref={menuRef}>

      {/* Configure Button next to switcher */}
      <Link
        href="/db-config"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors text-[#4B5563] text-[13px] font-medium shadow-sm"
        title="Add new database connection"
      >
        <Plus className="w-4 h-4" />
        New DB
      </Link>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-[#111827] shadow-sm"
      >
        <Database className={`w-4 h-4 text-[#2563EB] ${isSwitching ? 'animate-pulse' : ''}`} />
        <span className="text-[13px] font-medium max-w-[150px] truncate">
          {isSwitching ? 'Connecting...' : getDisplayText(activeDatabase)}
        </span>
        {!isSwitching && <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1.5 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-50 py-1 right-0 sm:left-0 sm:right-auto">
          <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFAFA] flex justify-between items-center">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Databases</p>
            <Link href="/db-config" className="sm:hidden text-[#2563EB] text-[11px] font-bold hover:underline">
              + ADD NEW
            </Link>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-1">
            {databases.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-[#6B7280]">
                No databases configured.
              </div>
            ) : (
              databases.map((db) => {
                const isActive = activeDatabase?.name === db.name;
                return (
                  <button
                    key={db.name}
                    onClick={() => {
                      setActiveDatabase(db);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] font-medium rounded-md transition-colors flex items-center justify-between group
                      ${isActive
                        ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                        : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                      }
                    `}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{db.name}</span>
                      <span className={`text-[10px] ${isActive ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'}`}>
                        {db.type === 'postgres' ? 'PostgreSQL' : 'SQL Server'}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
