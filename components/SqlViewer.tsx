import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SqlViewerProps {
  sql: string;
}

export default function SqlViewer({ sql }: SqlViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] w-full rounded-xl shadow-sm overflow-hidden font-sans relative">
      <div className="bg-[#FAFAFA] px-5 py-3 border-b border-[#E5E7EB] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span className="text-[13px] font-semibold text-[#111827]">Generated SQL</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-md hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-5 overflow-x-auto bg-[#FAFAFA]">
        <pre className="text-[14px] text-[#111827] font-mono leading-relaxed whitespace-pre-wrap">
          <code>{sql}</code>
        </pre>
      </div>
    </div>
  );
}
