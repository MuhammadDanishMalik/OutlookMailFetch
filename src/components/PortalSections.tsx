'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Shield, Tv, Sparkles } from 'lucide-react';
import { FetchEmailsResponse } from '@/types';

interface PortalSectionsProps {
  household: FetchEmailsResponse['household'];
  verification: FetchEmailsResponse['verification'];
  onOpenEmail?: (id: string) => void;
}

export const PortalSections: React.FC<PortalSectionsProps> = ({
  household,
  verification,
  onOpenEmail,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2 w-full">
      {/* 1. Recent Household Codes & Links (Netflix) */}
      <article className="rounded-2xl border border-purple-800/50 bg-gradient-to-b from-purple-950/30 to-gray-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Tv className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-purple-200">
              Recent Household Codes ({household.length})
            </h2>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            Netflix
          </span>
        </div>

        <div className="space-y-3">
          {household.length === 0 ? (
            <div className="rounded-xl border border-purple-900/30 bg-black/30 p-4 text-center text-xs text-gray-400">
              No Netflix Household records found in recent messages.
            </div>
          ) : (
            household.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-purple-500/20 bg-black/40 p-3.5 space-y-2 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>{formatDate(row.created_at)}</span>
                  <span className="text-purple-400 font-medium">{row.from}</span>
                </div>

                <p className="text-xs font-medium text-gray-200 line-clamp-2">
                  {row.subject}
                </p>

                {row.code ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-purple-950/40 border border-purple-500/30 px-3 py-2">
                    <span className="font-mono text-xl font-extrabold tracking-widest text-purple-100 select-all">
                      {row.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(row.code!)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-purple-500/40 text-xs font-medium text-purple-200 hover:bg-purple-600/30 transition-colors cursor-pointer"
                    >
                      {copiedCode === row.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Code not detected in body</p>
                )}

                {row.link && (
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:underline pt-1"
                  >
                    <span>Update Household / Confirm Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </article>

      {/* 2. Recent Verification Codes */}
      <article className="rounded-2xl border border-amber-800/50 bg-gradient-to-b from-amber-950/25 to-gray-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-amber-200">
              Recent Verification Codes ({verification.length})
            </h2>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            OTPs &amp; PINs
          </span>
        </div>

        <div className="space-y-3">
          {verification.length === 0 ? (
            <div className="rounded-xl border border-amber-900/30 bg-black/30 p-4 text-center text-xs text-gray-400">
              No verification codes found in recent messages.
            </div>
          ) : (
            verification.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-amber-500/20 bg-black/40 p-3.5 space-y-2 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>{formatDate(row.created_at)}</span>
                  {row.serviceName && (
                    <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      {row.serviceName}
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-gray-200 line-clamp-2">
                  {row.subject}
                </p>

                <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-950/40 border border-amber-500/30 px-3 py-2">
                  <span className="font-mono text-xl font-extrabold tracking-widest text-amber-100 select-all">
                    {row.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(row.code)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-500/40 text-xs font-medium text-amber-200 hover:bg-amber-600/30 transition-colors cursor-pointer"
                  >
                    {copiedCode === row.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {row.link && (
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 hover:underline pt-1"
                  >
                    <span>Open Related Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </article>
    </div>
  );
};
