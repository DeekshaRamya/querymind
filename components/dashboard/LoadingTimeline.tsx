'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CircleDashed, Circle } from 'lucide-react';

const stages = [
  "Understanding Request",
  "Analyzing Database Schema",
  "Generating SQL Query",
  "Validating Query",
  "Retrieving Results",
  "Preparing Insights"
];

export default function LoadingTimeline() {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Timer for elapsed seconds
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    
    // Simulate progression through stages (mocked for UI purposes)
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < stages.length - 1) return prev + 1;
        clearInterval(stageInterval);
        return prev;
      });
    }, 1200);

    return () => {
      clearInterval(timer);
      clearInterval(stageInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm my-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E7EB]">
        <h3 className="text-[14px] font-semibold text-[#111827]">Processing Query</h3>
        <div className="text-[13px] font-medium text-[#6B7280] font-mono bg-[#FAFAFA] px-2 py-1 rounded">
          {elapsed.toString().padStart(2, '0')}s elapsed
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStage;
          const isActive = index === currentStage;
          const isPending = index > currentStage;

          return (
            <motion.div 
              key={stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 ${isPending ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {isCompleted ? (
                  <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : isActive ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <CircleDashed className="w-5 h-5 text-[#2563EB]" />
                  </motion.div>
                ) : (
                  <Circle className="w-5 h-5 text-[#E5E7EB]" />
                )}
              </div>
              
              <span className={`text-[14px] ${isActive ? 'text-[#111827] font-medium' : 'text-[#6B7280]'}`}>
                {stage}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
