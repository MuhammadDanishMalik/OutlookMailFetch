'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck, Key, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface YahooAppPasswordGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YahooAppPasswordGuideModal: React.FC<YahooAppPasswordGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-2xl bg-gray-900 border border-purple-500/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/60 via-gray-900 to-gray-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">
                How to Generate Yahoo App Passwords
              </h2>
              <p className="text-xs text-purple-300">
                Bypass browser logins &amp; automate IMAP code fetching in 30 seconds
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
          {/* Why Explanation */}
          <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-purple-200">Why does Yahoo require an App Password?</p>
              <p className="text-gray-300">
                Yahoo prevents automated 3rd-party logins with standard passwords to protect accounts. By generating a 16-character <strong>App Password</strong>, this application can securely connect directly via IMAP and fetch all verification codes without ever triggering Yahoo&apos;s repeated browser login prompts or captchas.
              </p>
            </div>
          </div>

          {/* Step by Step list */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Step-by-Step Instructions:
            </h3>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                1
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Go to Yahoo Account Security
                </p>
                <p className="text-xs text-gray-400">
                  Open your Yahoo Account Security settings in your browser.
                </p>
                <a
                  href="https://login.yahoo.com/account/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 underline font-mono mt-1"
                >
                  login.yahoo.com/account/security <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                2
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Generate App Password
                </p>
                <p className="text-xs text-gray-400">
                  Scroll down to the <strong>&quot;App passwords&quot;</strong> or <strong>&quot;Generate app password&quot;</strong> section. Click <strong>Generate</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                3
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Enter App Name
                </p>
                <p className="text-xs text-gray-400">
                  Type any name (e.g. <code>Mail Hub</code> or <code>OTP Extractor</code>) and click <strong>Generate password</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                4
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium text-gray-100 text-xs">
                  Copy &amp; Paste into Vault
                </p>
                <p className="text-xs text-gray-400">
                  Copy the generated 16-character code (e.g. <code>abcd efgh ijkl mnop</code>) and paste it into this app.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-gray-950/80 flex items-center justify-between">
          <a
            href="https://login.yahoo.com/account/security"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300"
          >
            <span>Open Yahoo Security</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
