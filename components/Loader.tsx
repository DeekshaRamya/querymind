'use client';
import { useEffect, useState, useRef } from 'react';

interface LoaderProps {
  onComplete: () => void;
  text?: string;
}

export default function Loader({ onComplete, text = 'Authenticating workspace...' }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2; // Speed it up slightly
      });
    }, 10);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (progress === 100 && !isExiting) {
      timeoutId = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onCompleteRef.current();
        }, 600); // Wait for fade out
      }, 200); // Small pause at 100%
    }
    return () => clearTimeout(timeoutId);
  }, [progress, isExiting]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.6s ease-in-out',
        fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <div className="flex flex-col items-center max-w-[200px] w-full">
        <div className="w-10 h-10 mb-6 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <div className="w-full bg-[#F3F4F6] h-[4px] rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-[#2563EB] rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-[13px] font-medium text-[#6B7280]">
          {text}
        </div>
      </div>
    </div>
  );
}
