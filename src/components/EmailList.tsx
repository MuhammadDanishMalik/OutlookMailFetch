'use client';

import React, { useState } from 'react';
import { Mail, Clock, Key, ChevronRight, Copy, Check, Filter, Search, Paperclip, Shield } from 'lucide-react';
import { EmailMessage } from '@/types';

interface EmailListProps {
  emails: EmailMessage[];
  currentEmail: string;
  onSelectEmail: (email: EmailMessage) => void;
  isLoading: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  currentEmail,
  onSelectEmail,
  isLoading,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredEmails = emails.filter((item) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      item.subject.toLowerCase().includes(q) ||
      item.from.name.toLowerCase().includes(q) ||
      item.from.address.toLowerCase().includes(q) ||
      item.snippet.toLowerCase().includes(q) ||
      (item.otpData && item.otpData.code.toLowerCase().includes(q))
    );
  });

  const formatRelativeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-200">
            Inbox Messages {emails.length > 0 && `(${emails.length})`}
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            {currentEmail}
          </span>
        </div>

        {emails.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter messages..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}
      </div>

      {/* Messages List */}
      {filteredEmails.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
          <Mail className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm text-gray-400 font-medium">
            {filterQuery ? 'No matching emails found for your filter.' : 'No emails loaded yet.'}
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {filterQuery
              ? 'Try searching with a different keyword.'
              : 'Enter an email address above to check the latest emails and verification codes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEmails.map((email) => {
            const hasOtp = Boolean(email.otpData);

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`glass-card p-4 rounded-xl transition-all cursor-pointer group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  hasOtp
                    ? 'border-purple-500/30 hover:border-purple-400/60 bg-purple-950/15'
                    : 'hover:border-white/20'
                }`}
              >
                {/* Left Side: Sender Avatar & Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Sender Avatar */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      hasOtp
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                  >
                    {email.from.name ? email.from.name.charAt(0).toUpperCase() : 'M'}
                  </div>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                        {email.from.name || email.from.address}
                      </span>
                      {email.from.address && (
                        <span className="text-[11px] text-gray-500 truncate hidden sm:inline">
                          &lt;{email.from.address}&gt;
                        </span>
                      )}
                      {email.hasAttachments && (
                        <Paperclip className="w-3 h-3 text-gray-500" />
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-gray-100 group-hover:text-white line-clamp-1">
                      {email.subject || '(No Subject)'}
                    </h4>

                    <p className="text-xs text-gray-400 line-clamp-1">
                      {email.snippet}
                    </p>
                  </div>
                </div>

                {/* Right Side: OTP Badge + Timestamp + Arrow */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {hasOtp && email.otpData && (
                    <div className="flex items-center gap-1.5 bg-black/60 border border-purple-500/40 rounded-lg px-2.5 py-1 shadow-sm">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-mono text-xs font-bold text-purple-200 tracking-wider">
                        {email.otpData.code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, email.otpData!.code)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white cursor-pointer ml-1"
                        title="Copy OTP Code"
                      >
                        {copiedCode === email.otpData.code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeDate(email.date)}</span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
