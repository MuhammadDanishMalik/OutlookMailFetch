'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mail, Key, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Account } from '@/types';

interface SearchBarProps {
  accounts: Account[];
  currentEmail: string;
  onSearch: (email: string, password?: string, saveToVault?: boolean) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  accounts,
  currentEmail,
  onSearch,
  isLoading,
}) => {
  const [inputEmail, setInputEmail] = useState(currentEmail);
  const [customPassword, setCustomPassword] = useState('');
  const [saveToVault, setSaveToVault] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManualPassword, setShowManualPassword] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputEmail(currentEmail);
  }, [currentEmail]);

  const matchedAccount = accounts.find(
    (acc) => acc.email.toLowerCase() === inputEmail.trim().toLowerCase()
  );

  const suggestions = accounts
    .filter((acc) =>
      acc.email.toLowerCase().includes(inputEmail.trim().toLowerCase()) &&
      acc.email.toLowerCase() !== inputEmail.trim().toLowerCase()
    )
    .slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (acc: Account) => {
    setInputEmail(acc.email);
    setShowSuggestions(false);
    setShowManualPassword(false);
    setCustomPassword('');
    onSearch(acc.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    setShowSuggestions(false);

    if (customPassword.trim()) {
      onSearch(inputEmail.trim(), customPassword.trim(), saveToVault);
    } else if (matchedAccount) {
      onSearch(inputEmail.trim());
    } else {
      setShowManualPassword(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative z-20">
        <div className="relative flex items-center shadow-2xl rounded-2xl p-1.5 bg-slate-900/90 border border-rose-500/25 focus-within:border-rose-500/60 focus-within:ring-4 focus-within:ring-rose-500/15 transition-all">
          <div className="pl-3.5 pr-2 text-gray-400">
            <Search className="w-5 h-5 text-rose-400" />
          </div>

          <input
            type="email"
            value={inputEmail}
            onChange={(e) => {
              setInputEmail(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Enter Outlook / Hotmail / Email address (e.g. user@outlook.com)..."
            className="w-full bg-transparent px-2 py-3 text-sm md:text-base text-gray-100 placeholder:text-slate-500 focus:outline-none font-mono"
            required
          />

          {matchedAccount && (
            <button
              type="button"
              onClick={() => setShowManualPassword(!showManualPassword)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 mr-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium shrink-0 cursor-pointer transition-colors"
              title="Click to change saved password / App Password"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>In Vault</span>
              <span className="text-[10px] text-emerald-300/80 underline ml-0.5">Edit Pass</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !inputEmail.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Connecting IMAP...</span>
              </>
            ) : (
              <>
                <span>Search Codes</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Auto-complete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-30 divide-y divide-white/5">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-black/40">
              Saved Accounts in Vault ({suggestions.length})
            </div>
            {suggestions.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectSuggestion(acc)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-rose-600/15 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-sm font-mono text-gray-200 group-hover:text-rose-200 truncate">
                    {acc.email}
                  </span>
                  {acc.label && (
                    <span className="px-2 py-0.5 text-[10px] rounded bg-white/10 text-gray-300">
                      {acc.label}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 group-hover:text-rose-400">
                  Select & Fetch &rarr;
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Inline Password Entry for Unsaved Accounts */}
      {!matchedAccount && inputEmail.trim() && (showManualPassword || customPassword) && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs text-rose-300 shrink-0">
            <Key className="w-4 h-4 text-rose-400" />
            <span>Password / App Password:</span>
          </div>

          <input
            type="password"
            value={customPassword}
            onChange={(e) => setCustomPassword(e.target.value)}
            placeholder="Account Password or App Password"
            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-rose-400 font-mono"
            autoFocus
          />

          <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={saveToVault}
              onChange={(e) => setSaveToVault(e.target.checked)}
              className="rounded border-gray-700 text-rose-600 focus:ring-rose-500"
            />
            <span>Save to Vault</span>
          </label>
        </div>
      )}

      {/* Quick Switch Pills */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-gray-400 scrollbar-thin">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 shrink-0">
            Quick Pick:
          </span>
          {accounts.slice(0, 5).map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => {
                setInputEmail(acc.email);
                setShowManualPassword(false);
                onSearch(acc.email);
              }}
              className={`px-2.5 py-1 rounded-lg border font-mono transition-all shrink-0 cursor-pointer ${
                inputEmail.toLowerCase() === acc.email.toLowerCase()
                  ? 'bg-rose-500/25 border-rose-500/50 text-rose-200'
                  : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {acc.email}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
