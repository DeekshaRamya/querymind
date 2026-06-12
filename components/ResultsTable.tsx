import React, { useState } from 'react';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResultsTableProps {
  data: Record<string, unknown>[];
}

export default function ResultsTable({ data }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const currentData = data.slice(startIdx, startIdx + rowsPerPage);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center w-full flex flex-col items-center justify-center">
        <Database className="w-8 h-8 text-[#9CA3AF] mb-3" />
        <p className="text-[#111827] font-medium text-[15px]">No results found</p>
        <p className="text-[#6B7280] text-[13px] mt-1">The query executed successfully but returned an empty dataset.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm w-full flex flex-col font-sans overflow-hidden">
      <div className="bg-[#FAFAFA] px-5 py-3 border-b border-[#E5E7EB] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#6B7280]" />
          <span className="text-[13px] font-semibold text-[#111827]">Query Results</span>
        </div>
        <div className="text-[12px] font-medium bg-[#F3F4F6] text-[#4B5563] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
          {data.length} records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px] text-[#111827]">
          <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-5 py-3 font-semibold text-[#4B5563] whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {currentData.map((row, index) => (
              <tr key={index} className="hover:bg-[#FAFAFA] transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-5 py-3 whitespace-nowrap">
                    {row[col] !== null ? (
                      String(row[col])
                    ) : (
                      <span className="text-[#9CA3AF] italic">null</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-5 py-3 border-t border-[#E5E7EB] bg-white">
          <span className="text-[13px] text-[#6B7280]">
            Showing <span className="font-medium text-[#111827]">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
            <span className="font-medium text-[#111827]">{Math.min(currentPage * rowsPerPage, data.length)}</span> of{' '}
            <span className="font-medium text-[#111827]">{data.length}</span> results
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (currentPage > 1) setCurrentPage(currentPage - 1);
              }}  
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-[#E5E7EB] text-[#4B5563] hover:bg-[#FAFAFA] hover:text-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
              }}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-[#E5E7EB] text-[#4B5563] hover:bg-[#FAFAFA] hover:text-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
