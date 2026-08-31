'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck, Key, CheckCircle2 } from 'lucide-react';

interface OutlookGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutlookGuideModal: React.FC<OutlookGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">
                Outlook &amp; Microsoft IMAP Setup Guide
              </h2>
              <p className="text-xs text-rose-300">
                Automated IMAP Code &amp; Netflix Household Retrieval
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-sm text-gray-200">
          {/* Outlook IMAP Info */}
          <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-rose-200">Supported Email Providers:</p>
              <p className="text-gray-300">
                This portal connects directly to <strong>Outlook.com, Hotmail, Live.com, Office365, MSN</strong> (and Yahoo/Gmail/custom IMAP).
              </p>
              <p className="text-rose-300/80 font-mono text-[11px]">
                Host: outlook.office365.com &bull; Port: 993 &bull; SSL/TLS: Yes
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              How to Connect Outlook / Hotmail Accounts:
            </h3>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                1
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Standard Password / App Password
                </p>
                <p className="text-xs text-gray-400">
                  Most standard Outlook / Hotmail accounts connect with your regular account password. If you have 2-Step Verification enabled, generate an App Password in Microsoft Security.
                </p>
                <a
                  href="https://account.microsoft.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 underline font-mono mt-1"
                >
                  account.microsoft.com/security <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                2
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Bulk Import in Vault
                </p>
                <p className="text-xs text-gray-400">
                  Open the <strong>Vault</strong> &rarr; click <strong>Bulk Import</strong> &rarr; paste your accounts line-by-line in format: <code>email:password</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                3
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Instant Code &amp; Household Lookup
                </p>
                <p className="text-xs text-gray-400">
                  Type any email in the search bar. The app fetches incoming messages, parses Netflix Household update links, and displays verification codes with 1-click copy!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between">
          <a
            href="https://account.microsoft.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300"
          >
            <span>Microsoft Security</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
