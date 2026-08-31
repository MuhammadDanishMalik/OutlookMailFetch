'use client';

import React, { useState } from 'react';
import { Copy, Check, ShieldAlert, Sparkles, Clock, Mail, ExternalLink } from 'lucide-react';
import { ExtractedOtp } from '@/types';

interface OtpHeroCardProps {
  otpData: {
    otp: ExtractedOtp;
    emailSubject: string;
    emailFrom: string;
    emailDate: string;
    emailId: string;
  };
  emailAddress: string;
  onViewEmail: (emailId: string) => void;
}

export const OtpHeroCard: React.FC<OtpHeroCardProps> = ({
  otpData,
  emailAddress,
  onViewEmail,
}) => {
  const [copied, setCopied] = useState(false);
  const { otp, emailSubject, emailFrom, emailDate, emailId } = otpData;

  const handleCopy = () => {
    navigator.clipboard.writeText(otp.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = (() => {
    try {
      const date = new Date(emailDate);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return `${diffSec} seconds ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return emailDate;
    }
  })();

  return (
    <div className="w-full relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-gray-900/80 to-gray-950/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl otp-glow transition-all">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Service Details & OTP Badge */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Latest Verification Code
            </span>

            {otp.serviceName && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {otp.serviceName}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-gray-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              {formattedTime}
            </span>
          </div>

          <div>
            <h2 className="text-sm md:text-base font-medium text-gray-200 line-clamp-1">
              {emailSubject}
            </h2>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <span>From: <strong className="text-gray-300 font-normal">{emailFrom}</strong></span>
              <span>•</span>
              <span className="text-purple-400 font-mono">{emailAddress}</span>
            </p>
          </div>

          {/* Context Snippet */}
          {otp.context && (
            <p className="text-xs text-gray-400 bg-black/40 border border-white/5 rounded-lg px-3 py-2 font-mono line-clamp-2">
              &ldquo;{otp.context}&rdquo;
            </p>
          )}
        </div>

        {/* Right Side: Big Glowing Code & Copy Button */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0">
          <div className="w-full md:w-auto bg-black/60 border-2 border-purple-500/40 rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 shadow-inner">
            <span className="font-mono text-3xl md:text-4xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)] select-all">
              {otp.code}
            </span>
          </div>

          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onViewEmail(emailId)}
              className="px-3 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
              title="View full email body"
            >
              <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
