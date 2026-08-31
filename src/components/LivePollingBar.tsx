'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Square, Radio, Sparkles } from 'lucide-react';

interface LivePollingBarProps {
  isPolling: boolean;
  onTogglePolling: (enabled: boolean) => void;
  onManualRefresh: () => void;
  intervalSeconds?: number;
  isLoading: boolean;
}

export const LivePollingBar: React.FC<LivePollingBarProps> = ({
  isPolling,
  onTogglePolling,
  onManualRefresh,
  intervalSeconds = 10,
  isLoading,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPolling && !isLoading) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            onManualRefresh();
            return intervalSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSecondsLeft(intervalSeconds);
    }

    return () => clearInterval(timer);
  }, [isPolling, isLoading, intervalSeconds, onManualRefresh]);

  const progressPercent = ((intervalSeconds - secondsLeft) / intervalSeconds) * 100;

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gray-900/60 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => onTogglePolling(!isPolling)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isPolling
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/5'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPolling ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'
            }`}
          />
          <span>{isPolling ? 'Live Waiting Mode Active' : 'Enable Live Auto-Check'}</span>
        </button>

        {isPolling && (
          <span className="text-xs text-emerald-400/90 font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Auto-refreshing in {secondsLeft}s
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onManualRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Now</span>
        </button>
      </div>
    </div>
  );
};
