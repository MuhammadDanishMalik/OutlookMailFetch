'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Clock, User, Shield, FileText, Code2, Sparkles, ExternalLink } from 'lucide-react';
import { EmailMessage } from '@/types';

interface EmailDetailModalProps {
  email: EmailMessage | null;
  onClose: () => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ email, onClose }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'raw'>('html');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!email) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formattedDate = (() => {
    try {
      return new Date(email.date).toLocaleString([], {
        dateStyle: 'full',
        timeStyle: 'medium',
      });
    } catch {
      return email.date;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-gray-900 border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4 bg-gray-950/60">
          <div className="space-y-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-100 line-clamp-2">
              {email.subject || '(No Subject)'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <strong className="text-gray-300 font-medium">{email.from.name}</strong> &lt;{email.from.address}&gt;
              </span>
              <span className="flex items-center gap-1.5 font-mono text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
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

        {/* OTP Highlight Banner (if detected in this email) */}
        {email.otpData && (
          <div className="px-6 py-3 bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-purple-950/60 border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-semibold text-purple-200">
                Verification Code Detected:
              </span>
              <span className="px-3 py-1 bg-black/60 border border-purple-400/40 rounded-md font-mono text-base font-bold text-white tracking-widest select-all">
                {email.otpData.code}
              </span>
              {email.otpData.serviceName && (
                <span className="text-xs text-purple-300">
                  ({email.otpData.serviceName})
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCopyCode(email.otpData!.code)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Content View Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'html'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              HTML View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Plain Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Headers & Metadata
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] bg-black/40">
          {activeTab === 'html' && (
            email.bodyHtml ? (
              <div className="bg-white rounded-xl p-4 sm:p-6 overflow-x-auto text-black">
                <div
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                  className="prose max-w-none text-sm"
                />
              </div>
            ) : (
              <div className="p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap">
                {email.bodyText || 'No body content available.'}
              </div>
            )
          )}

          {activeTab === 'text' && (
            <div className="p-4 bg-gray-950/80 rounded-xl border border-white/5 font-mono text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
              {email.bodyText || 'No text content available.'}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3 font-mono text-xs text-gray-300">
              <div className="p-4 bg-gray-950/80 rounded-xl border border-white/5 space-y-2">
                <p><span className="text-gray-500">Message ID:</span> {email.id}</p>
                <p><span className="text-gray-500">UID:</span> {email.uid}</p>
                <p><span className="text-gray-500">Sequence:</span> {email.seq}</p>
                <p><span className="text-gray-500">From:</span> {email.from.name} &lt;{email.from.address}&gt;</p>
                <p><span className="text-gray-500">To:</span> {email.to.join(', ')}</p>
                <p><span className="text-gray-500">Date:</span> {email.date}</p>
                <p><span className="text-gray-500">Subject:</span> {email.subject}</p>
                <p><span className="text-gray-500">Has Attachments:</span> {String(email.hasAttachments)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-gray-950/80 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">
            UID: {email.uid}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
