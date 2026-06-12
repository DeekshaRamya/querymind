'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import SqlViewer from '../SqlViewer';
import ResultsTable from '../ResultsTable';
import QueryCorrection from '../QueryCorrection';
import ActionButtons from '../ActionButtons';
import LoadingTimeline from './LoadingTimeline';
import { QueryResponse } from '../../types';
import { useDatabase } from '@/contexts/DatabaseContext';

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

interface QueryInputSectionProps {
  userName?: string;
}

export default function QueryInputSection({ userName }: QueryInputSectionProps) {
  const { activeDatabase } = useDatabase();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState('');

  // Clear states when switching databases
  useEffect(() => {
    setResult(null);
    setError('');
  }, [activeDatabase]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query, db_name: activeDatabase?.name })
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.details ? `${data.error} Details: ${data.details}` : (data.error || 'Failed to generate query');
        throw new Error(errorMsg);
      }

      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while processing your request.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Greeting Section (Hidden if there's a result or loading) */}
      {!result && !loading && (
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A855F7] to-[#7E22CE] shadow-[0_0_20px_rgba(168,85,247,0.5)] mb-6"></div>
          <h1 className="text-[36px] font-medium text-[#111827] tracking-tight leading-tight">
            {getGreeting()}
          </h1>
          <h2 className="text-[36px] font-medium text-[#111827] tracking-tight leading-tight">
            What&apos;s on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#C084FC]">your mind?</span>
          </h2>
        </div>
      )}

      {/* Enterprise AI Prompt Box */}
      <form onSubmit={handleGenerate} className="w-full relative mb-10">
        <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.04)] focus-within:ring-1 focus-within:ring-[#A855F7] focus-within:border-[#A855F7] transition-all overflow-hidden p-3 flex flex-col">
          <div className="flex items-start gap-2 px-1">
            <svg className="w-5 h-5 text-[#A855F7] shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI a question or make a request."
              className="w-full min-h-[60px] max-h-[300px] resize-none text-[15px] text-[#111827] placeholder-[#9CA3AF] bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end mt-2">
            <button
              type="submit"
              disabled={loading || query.trim().length === 0}
              className={`p-2 rounded-xl transition-colors flex items-center justify-center ${loading || query.trim().length === 0
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                : 'bg-[#111827] text-white hover:bg-[#374151]'
                }`}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
        <div className="mt-3 text-right">
          <span className="text-[12px] text-[#9CA3AF]">Press <kbd className="font-mono bg-[#F3F4F6] px-1.5 py-0.5 rounded border border-[#E5E7EB]">Enter ↵</kbd> to send</span>
        </div>
      </form>


      {/* Loading Timeline */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <LoadingTimeline />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="mt-8 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 flex items-start gap-3 text-[#DC2626]">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h4 className="text-[14px] font-semibold">Query Error</h4>
            <p className="text-[13px] mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results Area */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 space-y-8"
        >
          {result.correctedQuestion && (
            <QueryCorrection corrected={result.correctedQuestion} />
          )}

          <div className="flex flex-col space-y-6">
            <SqlViewer sql={result.sql} />

            <div className="flex flex-col space-y-4">
              <ResultsTable data={result.data} />
              <div className="flex justify-start">
                <ActionButtons data={result.data} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
