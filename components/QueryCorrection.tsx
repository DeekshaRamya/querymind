import React from 'react';
import { Sparkles } from 'lucide-react';

interface QueryCorrectionProps {
  corrected: string;
}

export default function QueryCorrection({ corrected }: QueryCorrectionProps) {
  return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-5 flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-[#BFDBFE] shadow-sm">
        <Sparkles className="w-4 h-4 text-[#2563EB]" />
      </div>
      <div>
        <h3 className="text-[14px] font-semibold text-[#1E3A8A] mb-1">
          AI Synthesis
        </h3>
        <p className="text-[14px] text-[#1E40AF] leading-relaxed">
          {corrected}
        </p>
      </div>
    </div>
  );
}
