'use client';

import React from 'react';
import { Mail, Sparkles, HelpCircle, Database, Shield } from 'lucide-react';

interface NavbarProps {
  accountsCount: number;
  onOpenVault: () => void;
  onOpenGuide: () => void;
  onTriggerDemo: () => void;
  isLoadingDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  accountsCount,
  onOpenVault,
  onOpenGuide,
  onTriggerDemo,
  isLoadingDemo,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-600/30 ring-1 ring-white/20">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-300 to-red-400">
                Outlook Code Portal
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                Netflix &amp; OTP Hub
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Multi-Account IMAP Engine &bull; Netflix Household &amp; Verification Codes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Preview Button */}
          <button
            type="button"
            onClick={onTriggerDemo}
            disabled={isLoadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Preview Netflix Household & OTP detection with simulated live data"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="hidden md:inline">Try</span> Demo
          </button>

          {/* Setup Guide Button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-white/10 rounded-lg transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Setup Guide</span>
          </button>

          {/* Account Vault Button */}
          <button
            type="button"
            onClick={onOpenVault}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-lg shadow-md shadow-rose-600/25 border border-rose-400/30 transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Vault</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-full text-[11px] font-mono border border-white/10">
              {accountsCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
