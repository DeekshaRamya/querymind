import React, { useState } from "react";
import { Download, Copy, Check } from "lucide-react";

interface ActionButtonsProps {
  data: Record<string, unknown>[];
}

export default function ActionButtons({ data }: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleDownloadCsv = () => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          let field = row[fieldName];
          let fieldStr = '';
          if (field === null || field === undefined) {
            fieldStr = '';
          } else if (typeof field === 'object') {
            fieldStr = JSON.stringify(field);
          } else {
            fieldStr = String(field);
          }
          
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            fieldStr = `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(',')
      )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full font-sans">
      <button 
        onClick={handleDownloadCsv}
        className="flex items-center gap-2 text-[13px] font-medium text-[#4B5563] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors shadow-sm"
      >
        <Download className="w-4 h-4" />
        Download CSV
      </button>

      <button
        onClick={handleCopy}
        className="flex items-center gap-2 text-[13px] font-medium text-[#4B5563] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors shadow-sm"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-[#10B981]" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy JSON
          </>
        )}
      </button>
    </div>
  );
}
